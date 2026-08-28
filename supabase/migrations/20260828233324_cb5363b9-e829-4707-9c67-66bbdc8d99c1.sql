
CREATE TABLE public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default 'BookOpen',
  position int not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are publicly readable" ON public.subjects FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  parent_id uuid references public.chapters(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (subject_id, slug)
);
GRANT SELECT ON public.chapters TO anon, authenticated;
GRANT ALL ON public.chapters TO service_role;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chapters are publicly readable" ON public.chapters FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  video_url text,
  pdf_url text,
  notes text,
  assignment text,
  duration_minutes int,
  quiz_id uuid references public.quizzes(id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons are publicly readable" ON public.lessons FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.subjects (slug, title, description, icon, position) VALUES
 ('frontend-engineering','Frontend Engineering','Modern interfaces: React, state, performance and design systems.','MonitorSmartphone',1),
 ('computer-science','Computer Science','Algorithms, data structures and the machines underneath.','Cpu',2);

INSERT INTO public.chapters (subject_id, parent_id, slug, title, summary, position)
SELECT s.id, null, 'react-foundations', 'React Foundations', 'Components, props and rendering model.', 1 FROM public.subjects s WHERE s.slug='frontend-engineering';
INSERT INTO public.chapters (subject_id, parent_id, slug, title, summary, position)
SELECT s.id, c.id, 'state-and-effects', 'State and Effects', 'useState, useEffect and data flow.', 1
FROM public.subjects s JOIN public.chapters c ON c.subject_id = s.id AND c.slug='react-foundations'
WHERE s.slug='frontend-engineering';
INSERT INTO public.chapters (subject_id, parent_id, slug, title, summary, position)
SELECT s.id, null, 'performance', 'Performance', 'Rendering cost, memoisation and Core Web Vitals.', 2 FROM public.subjects s WHERE s.slug='frontend-engineering';
INSERT INTO public.chapters (subject_id, parent_id, slug, title, summary, position)
SELECT s.id, null, 'algorithms', 'Algorithms', 'Complexity, sorting and searching.', 1 FROM public.subjects s WHERE s.slug='computer-science';
INSERT INTO public.chapters (subject_id, parent_id, slug, title, summary, position)
SELECT s.id, c.id, 'graphs', 'Graphs and Traversal', 'BFS, DFS and shortest paths.', 1
FROM public.subjects s JOIN public.chapters c ON c.subject_id = s.id AND c.slug='algorithms'
WHERE s.slug='computer-science';

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, pdf_url, notes, assignment, duration_minutes, quiz_id, position)
SELECT c.id, 'class-jsx-and-components', 'Class 1 — JSX and Components', 'How JSX compiles and how to break UI into components.',
 'https://www.youtube.com/embed/SqcY0GlETPk', null,
 'JSX is syntax sugar over createElement. Components are functions returning elements.',
 'Rebuild a profile card as three composable components with typed props.', 24,
 (SELECT id FROM public.quizzes ORDER BY created_at LIMIT 1), 1
FROM public.chapters c WHERE c.slug='react-foundations';

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, pdf_url, notes, assignment, duration_minutes, position)
SELECT c.id, 'class-usestate-deep-dive', 'Class 2 — useState Deep Dive', 'State batching, derived state and common pitfalls.',
 'https://www.youtube.com/embed/O6P86uwfdR0', null,
 'Never mirror props in state. Prefer derived values over synchronised state.',
 'Refactor a form with five useState calls into a single reducer.', 31, 1
FROM public.chapters c WHERE c.slug='state-and-effects';

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, notes, assignment, duration_minutes, position)
SELECT c.id, 'class-render-cost', 'Class 1 — Measuring Render Cost', 'Profiling components and finding wasted renders.',
 'https://www.youtube.com/embed/00lxm_doFYw',
 'Measure before memoising. The Profiler flamegraph shows commit cost per component.',
 'Profile a list of 1000 rows and cut render time in half.', 27, 1
FROM public.chapters c WHERE c.slug='performance';

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, notes, assignment, duration_minutes, position)
SELECT c.id, 'class-big-o', 'Class 1 — Big-O Intuition', 'Reading complexity from code without maths anxiety.',
 'https://www.youtube.com/embed/Mo4vesaut8g',
 'Count the loops, then the work inside them. Constants are noise at scale.',
 'Annotate five functions with their time and space complexity.', 22, 1
FROM public.chapters c WHERE c.slug='algorithms';

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, notes, assignment, duration_minutes, position)
SELECT c.id, 'class-bfs-dfs', 'Class 2 — BFS and DFS', 'Two traversals that solve most graph interview questions.',
 'https://www.youtube.com/embed/pcKY4hjDrxk',
 'BFS uses a queue and finds shortest unweighted paths; DFS uses a stack or recursion.',
 'Implement both traversals and print visit order for a sample graph.', 35, 1
FROM public.chapters c WHERE c.slug='graphs';
