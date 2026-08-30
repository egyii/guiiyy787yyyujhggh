DO $$
DECLARE c uuid; s uuid; ch1 uuid; ch2 uuid; l uuid;
BEGIN
INSERT INTO public.courses (slug, title, description, icon, position)
VALUES ('polity', 'Polity', 'Indian Polity for competitive exams: constitutional history, Union and territory, citizenship, fundamental rights and DPSP with class videos and notes.', 'Landmark', 10)
RETURNING id INTO c;

INSERT INTO public.subjects (slug, title, description, icon, course_id, position)
VALUES ('indian-polity', 'Indian Polity', 'Core polity syllabus with video classes and Telegram class notes for every topic.', 'Scale', c, 1)
RETURNING id INTO s;

INSERT INTO public.chapters (subject_id, slug, title, summary, position)
VALUES (s, 'polity-foundations', 'Foundations', 'Lists in the Constitution and the historical acts that shaped it.', 1)
RETURNING id INTO ch1;

INSERT INTO public.chapters (subject_id, slug, title, summary, position)
VALUES (s, 'polity-constitution-rights', 'Constitution & Rights', 'Union and its territory, citizenship, fundamental rights and directive principles.', 2)
RETURNING id INTO ch2;

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, notes, position)
VALUES (ch1, 'polity-lists', 'Lists', 'Lists in the Indian Constitution.', 'https://www.youtube.com/embed/IywkOUMB5dY', 'Class notes: https://t.me/aspirants_gs/64', 1);

INSERT INTO public.lessons (chapter_id, slug, title, description, position)
VALUES (ch1, 'polity-historical-acts', 'Historical Acts', 'Historical background: acts that shaped the Indian Constitution, in three parts.', 2)
RETURNING id INTO l;
INSERT INTO public.lesson_parts (lesson_id, title, description, video_url, notes, position) VALUES
  (l, 'Part 1', 'Historical Acts — Part 1', 'https://www.youtube.com/embed/YJEDujpa57s', 'Class notes: https://t.me/aspirants_gs/102', 1),
  (l, 'Part 2', 'Historical Acts — Part 2', 'https://www.youtube.com/embed/dKeIBwsTlsU', 'Class notes: https://t.me/aspirants_gs/121', 2),
  (l, 'Part 3', 'Historical Acts — Part 3', 'https://www.youtube.com/embed/XlQcQ2Ein8c', 'Class notes: https://t.me/aspirants_gs/132', 3);

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, notes, position)
VALUES (ch2, 'polity-union-and-its-territory', 'Union and its Territory', 'Articles 1-4: Union and its territory.', 'https://www.youtube.com/embed/MUeVksov9T8', 'Class notes: https://t.me/aspirants_gs/294', 1);

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, notes, position)
VALUES (ch2, 'polity-citizenship', 'Citizenship', 'Citizenship provisions in the Indian Constitution.', 'https://www.youtube.com/embed/qoninetDpzQ', 'Class notes: https://t.me/aspirants_gs/306', 2);

INSERT INTO public.lessons (chapter_id, slug, title, description, position)
VALUES (ch2, 'polity-fundamental-rights', 'Fundamental Rights', 'Fundamental Rights in two parts.', 3)
RETURNING id INTO l;
INSERT INTO public.lesson_parts (lesson_id, title, description, video_url, notes, position) VALUES
  (l, 'Part 1', 'Fundamental Rights — Part 1', 'https://www.youtube.com/embed/oOPQLqQngt8', 'Class notes: https://t.me/aspirants_gs/310', 1),
  (l, 'Part 2', 'Fundamental Rights — Part 2', 'https://www.youtube.com/embed/ftxWiNzwqaU', 'Class notes: https://t.me/aspirants_gs/313', 2);

INSERT INTO public.lessons (chapter_id, slug, title, description, video_url, notes, position)
VALUES (ch2, 'polity-dpsp', 'DPSP', 'Directive Principles of State Policy.', 'https://www.youtube.com/embed/ji8ct6AeiPk', 'Class notes: https://t.me/aspirants_gs/315', 4);
END $$;