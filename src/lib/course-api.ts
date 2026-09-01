import { supabase } from "@/integrations/supabase/client";

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
};

export type Subject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  course_id: string | null;
};

export type Chapter = {
  id: string;
  subject_id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  summary: string;
  position: number;
};

export type LessonPart = {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  video_url: string | null;
  pdf_url: string | null;
  notes: string | null;
  assignment: string | null;
  duration_minutes: number | null;
  position: number;
};

export type Lesson = {
  id: string;
  chapter_id: string;
  slug: string;
  title: string;
  description: string;
  video_url: string | null;
  pdf_url: string | null;
  notes: string | null;
  assignment: string | null;
  duration_minutes: number | null;
  quiz_id: string | null;
  position: number;
};

const SUBJECT_COLS = "id, slug, title, description, icon, course_id";
const LESSON_COLS =
  "id, chapter_id, slug, title, description, video_url, pdf_url, notes, assignment, duration_minutes, quiz_id, position";
const PART_COLS =
  "id, lesson_id, title, description, video_url, pdf_url, notes, assignment, duration_minutes, position";

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, description, icon")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCourseBySlug(slug: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, description, icon")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchCourseSubjects(courseId: string): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select(SUBJECT_COLS)
    .eq("course_id", courseId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Subject[];
}

/** Counts of chapters + classes per subject, for syllabus previews. */
export async function fetchCourseStats(courseId: string) {
  const subjects = await fetchCourseSubjects(courseId);
  const ids = subjects.map((s) => s.id);
  if (ids.length === 0) return { subjects, chapters: [] as Chapter[], lessonCount: {} as Record<string, number> };

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, subject_id, parent_id, slug, title, summary, position")
    .in("subject_id", ids)
    .order("position", { ascending: true });
  if (error) throw error;

  const chapterList = (chapters ?? []) as Chapter[];
  const chapterIds = chapterList.map((c) => c.id);
  const lessonCount: Record<string, number> = {};
  if (chapterIds.length) {
    const { data: lessons, error: lErr } = await supabase
      .from("lessons")
      .select("id, chapter_id")
      .in("chapter_id", chapterIds);
    if (lErr) throw lErr;
    const bySubject = new Map(chapterList.map((c) => [c.id, c.subject_id]));
    for (const l of lessons ?? []) {
      const sid = bySubject.get(l.chapter_id);
      if (sid) lessonCount[sid] = (lessonCount[sid] ?? 0) + 1;
    }
  }
  return { subjects, chapters: chapterList, lessonCount };
}

export async function fetchSubjectBySlug(slug: string): Promise<Subject | null> {
  const { data, error } = await supabase
    .from("subjects")
    .select(SUBJECT_COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Subject | null;
}

export async function fetchSubjectOutline(subjectId: string) {
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, subject_id, parent_id, slug, title, summary, position")
    .eq("subject_id", subjectId)
    .order("position", { ascending: true });
  if (error) throw error;

  const chapterList = (chapters ?? []) as Chapter[];
  const ids = chapterList.map((c) => c.id);
  if (ids.length === 0) return { chapters: chapterList, lessons: [] as Lesson[], partCount: {} as Record<string, number> };

  const { data: lessons, error: lErr } = await supabase
    .from("lessons")
    .select(LESSON_COLS)
    .in("chapter_id", ids)
    .order("position", { ascending: true });
  if (lErr) throw lErr;

  const lessonList = (lessons ?? []) as Lesson[];
  const partCount: Record<string, number> = {};
  if (lessonList.length) {
    const { data: parts, error: pErr } = await supabase
      .from("lesson_parts")
      .select("id, lesson_id")
      .in(
        "lesson_id",
        lessonList.map((l) => l.id),
      );
    if (pErr) throw pErr;
    for (const p of parts ?? []) partCount[p.lesson_id] = (partCount[p.lesson_id] ?? 0) + 1;
  }

  return { chapters: chapterList, lessons: lessonList, partCount };
}

export type LessonDetail = {
  lesson: Lesson;
  parts: LessonPart[];
  chapter: { id: string; slug: string; title: string; parent_id: string | null } | null;
  subject: { slug: string; title: string } | null;
  quiz: { slug: string; title: string } | null;
};

export async function fetchLessonBySlug(slug: string): Promise<LessonDetail | null> {
  const { data, error } = await supabase
    .from("lessons")
    .select(
      `${LESSON_COLS}, chapters(id, slug, title, parent_id, subject_id, subjects(slug, title)), quizzes(slug, title)`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as Lesson & {
    chapters: {
      id: string;
      slug: string;
      title: string;
      parent_id: string | null;
      subjects: { slug: string; title: string } | null;
    } | null;
    quizzes: { slug: string; title: string } | null;
  };

  const { data: parts, error: pErr } = await supabase
    .from("lesson_parts")
    .select(PART_COLS)
    .eq("lesson_id", row.id)
    .order("position", { ascending: true });
  if (pErr) throw pErr;

  return {
    lesson: row,
    parts: (parts ?? []) as LessonPart[],
    chapter: row.chapters
      ? {
          id: row.chapters.id,
          slug: row.chapters.slug,
          title: row.chapters.title,
          parent_id: row.chapters.parent_id,
        }
      : null,
    subject: row.chapters?.subjects ?? null,
    quiz: row.quizzes ?? null,
  };
}

/** All subjects across every course (used by the courses index). */
export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select(SUBJECT_COLS)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Subject[];
}
