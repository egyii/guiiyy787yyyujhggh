-- 1) Courses
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'GraduationCap',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are publicly readable" ON public.courses FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Subjects belong to a course
ALTER TABLE public.subjects ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- 3) Multi-part classes
CREATE TABLE public.lesson_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text,
  pdf_url text,
  notes text,
  assignment text,
  duration_minutes integer,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lesson_parts_lesson_id_idx ON public.lesson_parts(lesson_id);
GRANT SELECT ON public.lesson_parts TO anon;
GRANT SELECT ON public.lesson_parts TO authenticated;
GRANT ALL ON public.lesson_parts TO service_role;
ALTER TABLE public.lesson_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lesson parts are publicly readable" ON public.lesson_parts FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER update_lesson_parts_updated_at BEFORE UPDATE ON public.lesson_parts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Seed courses
INSERT INTO public.courses (slug, title, description, icon, position) VALUES
  ('engineering-track', 'Engineering Track', 'Frontend and computer-science fundamentals taught class by class, with videos, notes and assignments.', 'Code2', 1),
  ('general-knowledge', 'General Knowledge', 'A broad GK course spanning world affairs, history and polity, and science and technology.', 'Globe2', 2);

UPDATE public.subjects SET course_id = (SELECT id FROM public.courses WHERE slug = 'engineering-track')
WHERE slug IN ('frontend-engineering', 'computer-science');

-- 5) GK subjects
INSERT INTO public.subjects (slug, title, description, icon, position, course_id)
SELECT * FROM (VALUES
  ('gk-world-affairs', 'World Affairs', 'Geography, organisations and current global structures.', 'Globe2', 1),
  ('gk-history-polity', 'History & Polity', 'Modern history milestones and how constitutions work.', 'Landmark', 2),
  ('gk-science-tech', 'Science & Technology', 'Everyday science, space and the technology timeline.', 'Atom', 3)
) AS v(slug, title, description, icon, position)
CROSS JOIN (SELECT id FROM public.courses WHERE slug = 'general-knowledge') c;

-- 6) GK chapters + sub-chapters
WITH s AS (SELECT id, slug FROM public.subjects WHERE slug LIKE 'gk-%')
INSERT INTO public.chapters (subject_id, slug, title, summary, position)
SELECT s.id, v.slug, v.title, v.summary, v.position FROM s
JOIN (VALUES
  ('gk-world-affairs', 'gk-maps-and-nations', 'Chapter 1 — Maps and Nations', 'Continents, capitals and borders that shape the news.', 1),
  ('gk-world-affairs', 'gk-global-bodies', 'Chapter 2 — Global Bodies', 'UN, WHO, WTO and the groups that set world rules.', 2),
  ('gk-history-polity', 'gk-modern-history', 'Chapter 1 — Modern History', 'Revolutions, wars and independence movements.', 1),
  ('gk-history-polity', 'gk-constitutions', 'Chapter 2 — Constitutions', 'Rights, duties and the machinery of government.', 2),
  ('gk-science-tech', 'gk-everyday-science', 'Chapter 1 — Everyday Science', 'Physics, chemistry and biology you can observe.', 1),
  ('gk-science-tech', 'gk-space-and-tech', 'Chapter 2 — Space and Technology', 'Missions, satellites and the computing timeline.', 2)
) AS v(subject_slug, slug, title, summary, position) ON v.subject_slug = s.slug;

WITH p AS (SELECT id, slug FROM public.chapters WHERE slug LIKE 'gk-%')
INSERT INTO public.chapters (subject_id, parent_id, slug, title, summary, position)
SELECT (SELECT subject_id FROM public.chapters WHERE id = p.id), p.id, v.slug, v.title, v.summary, v.position
FROM p JOIN (VALUES
  ('gk-maps-and-nations', 'gk-rivers-and-ranges', 'Rivers and Mountain Ranges', 'Physical features worth memorising.', 1),
  ('gk-global-bodies', 'gk-economic-groups', 'Economic Groups', 'G20, BRICS, OPEC and trade blocs.', 1),
  ('gk-modern-history', 'gk-freedom-movements', 'Freedom Movements', 'Key leaders, dates and turning points.', 1),
  ('gk-everyday-science', 'gk-human-body', 'The Human Body', 'Systems, vitamins and common disorders.', 1),
  ('gk-space-and-tech', 'gk-space-missions', 'Space Missions', 'From Sputnik to modern lunar landers.', 1)
) AS v(parent_slug, slug, title, summary, position) ON v.parent_slug = p.slug;

-- 7) GK classes
WITH c AS (SELECT id, slug FROM public.chapters WHERE slug LIKE 'gk-%')
INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, notes, assignment, duration_minutes, position)
SELECT c.id, v.slug, v.title, v.description, v.video_url, v.notes, v.assignment, v.duration, v.position
FROM c JOIN (VALUES
  ('gk-maps-and-nations', 'gk-class-continents', 'Class 1 — Continents and Capitals', 'A guided tour of the seven continents and the capitals that appear most in exams.', 'https://www.youtube.com/embed/BFntkCkbcNI', E'Seven continents, five oceans.\nAsia is the largest continent by area and population.\nCapitals to remember: Canberra (Australia), Ottawa (Canada), Brasilia (Brazil), Wellington (New Zealand).', E'List one landlocked country per continent and its capital.', 12, 1),
  ('gk-rivers-and-ranges', 'gk-class-rivers', 'Class 2 — Rivers and Ranges', 'Longest rivers, highest peaks and the ranges that divide regions.', 'https://www.youtube.com/embed/wUCM8oJUsWY', E'Nile and Amazon lead the longest-river debate.\nThe Himalayas hold all fourteen 8000m peaks.', E'Match five rivers to the countries they flow through.', 10, 1),
  ('gk-global-bodies', 'gk-class-un-system', 'Class 1 — The UN System', 'Security Council, General Assembly and specialised agencies.', 'https://www.youtube.com/embed/pMR8Sc5tcNc', E'Five permanent Security Council members hold veto power.\nWHO, UNESCO and ILO are specialised agencies.', E'Write the mandate of any three UN agencies in one line each.', 11, 1),
  ('gk-economic-groups', 'gk-class-economic-groups', 'Class 2 — Economic Groups', 'G20, BRICS, OPEC and the major trade blocs.', 'https://www.youtube.com/embed/HDNRxA5oCq0', E'BRICS began as BRIC in 2009; South Africa joined in 2010.\nOPEC coordinates petroleum policy among member states.', E'Tabulate four blocs with founding year and headquarters.', 9, 1),
  ('gk-modern-history', 'gk-class-revolutions', 'Class 1 — Revolutions', 'French, American and Industrial revolutions in one thread.', 'https://www.youtube.com/embed/lTTvKwCylFY', E'1789 — French Revolution begins.\nThe Industrial Revolution started in Britain in the late 18th century.', E'Draw a timeline of three revolutions with two consequences each.', 13, 1),
  ('gk-freedom-movements', 'gk-class-freedom-movements', 'Class 2 — Freedom Movements', 'Colonial resistance and independence across the 20th century.', 'https://www.youtube.com/embed/T_yZFmxvUhs', E'Non-cooperation, civil disobedience and Quit India were successive phases.\nMany African nations gained independence in the 1960s.', E'Pick one movement and summarise its three key phases.', 12, 1),
  ('gk-constitutions', 'gk-class-constitution-basics', 'Class 1 — How Constitutions Work', 'Preamble, rights, duties and separation of powers.', 'https://www.youtube.com/embed/bO7FQsCcbD8', E'Legislature makes law, executive implements it, judiciary interprets it.\nFundamental rights are enforceable in court.', E'Explain separation of powers with one real example.', 14, 1),
  ('gk-everyday-science', 'gk-class-everyday-physics', 'Class 1 — Everyday Physics', 'Force, pressure, light and sound in daily life.', 'https://www.youtube.com/embed/ZM8ECpBuQYE', E'Pressure = force / area.\nLight travels at about 3x10^8 m/s in vacuum.', E'Find five everyday devices and name the principle each uses.', 12, 1),
  ('gk-human-body', 'gk-class-human-body', 'Class 2 — The Human Body', 'Organ systems, vitamins and deficiency diseases.', 'https://www.youtube.com/embed/nsSlHDDZ2xU', E'Vitamin C deficiency causes scurvy.\nThe heart has four chambers.', E'Create a table of five vitamins and their deficiency diseases.', 11, 1),
  ('gk-space-and-tech', 'gk-class-space-race', 'Class 1 — The Space Race', 'Sputnik, Apollo and the modern era of missions.', 'https://www.youtube.com/embed/dQw8Nk6IuRg', E'Sputnik 1 launched in 1957.\nApollo 11 landed humans on the Moon in 1969.', E'List four milestone missions with year and agency.', 13, 1),
  ('gk-space-missions', 'gk-class-modern-missions', 'Class 2 — Modern Missions', 'Mars rovers, lunar landers and space telescopes.', 'https://www.youtube.com/embed/BBLvQm0BQ2E', E'James Webb observes in infrared from L2.\nSeveral agencies now operate lunar landers.', E'Compare two current missions and their objectives.', 12, 1)
) AS v(chapter_slug, slug, title, description, video_url, notes, assignment, duration, position) ON v.chapter_slug = c.slug;

-- 8) Multi-part class examples
INSERT INTO public.lesson_parts (lesson_id, title, description, video_url, notes, assignment, duration_minutes, position)
SELECT l.id, v.title, v.description, v.video_url, v.notes, v.assignment, v.duration, v.position
FROM public.lessons l
JOIN (VALUES
  ('gk-class-continents', 'Part 1 — Continents and Oceans', 'Land masses, oceans and how they are measured.', 'https://www.youtube.com/embed/BFntkCkbcNI', E'Asia, Africa, North America, South America, Antarctica, Europe, Australia.\nPacific is the largest ocean.', E'Sketch the seven continents from memory and label the oceans.', 12, 1),
  ('gk-class-continents', 'Part 2 — Capitals and Currencies', 'Capitals, currencies and common exam traps.', 'https://www.youtube.com/embed/pMR8Sc5tcNc', E'Some countries have multiple capitals (South Africa has three).\nCurrency names repeat across countries — check the issuing nation.', E'Build a 15-row table of country, capital and currency.', 13, 2),
  ('class-bfs-dfs', 'Part 1 — Breadth-First Search', 'Queue-based traversal, level order and shortest paths in unweighted graphs.', 'https://www.youtube.com/embed/pcKY4hjDrxk', E'BFS uses a queue and visits nodes level by level.\nOn unweighted graphs BFS gives shortest paths.', E'Implement BFS and print the level of every node.', 14, 1),
  ('class-bfs-dfs', 'Part 2 — Depth-First Search', 'Recursion, stacks, cycle detection and topological order.', 'https://www.youtube.com/embed/Urx87-NMm6c', E'DFS explores as deep as possible before backtracking.\nDFS powers cycle detection and topological sorting.', E'Detect a cycle in a directed graph using DFS colours.', 15, 2)
) AS v(lesson_slug, title, description, video_url, notes, assignment, duration, position) ON v.lesson_slug = l.slug;
