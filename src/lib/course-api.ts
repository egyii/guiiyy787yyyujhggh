import { supabase } from "@/integrations/supabase/client";

export type Subject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
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

export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, slug, title, description, icon")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSubjectBySlug(slug: string): Promise<Subject | null> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, slug, title, description, icon")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSubjectOutline(subjectId: string) {
  const [chapters, lessons] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, subject_id, parent_id, slug, title, summary, position")
      .eq("subject_id", subjectId)
      .order("position", { ascending: true }),
    supabase
      .from("lessons")
      .select(
        "id, chapter_id, slug, title, description, video_url, pdf_url, notes, assignment, duration_minutes, quiz_id, position",
      )
      .order("position", { ascending: true }),
  ]);
  if (chapters.error) throw chapters.error;
  if (lessons.error) throw lessons.error;

  const chapterList = (chapters.data ?? []) as Chapter[];
  const ids = new Set(chapterList.map((c) => c.id));
  const lessonList = ((lessons.data ?? []) as Lesson[]).filter((l) => ids.has(l.chapter_id));
  return { chapters: chapterList, lessons: lessonList };
}

export async function fetchLessonBySlug(slug: string) {
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, chapter_id, slug, title, description, video_url, pdf_url, notes, assignment, duration_minutes, quiz_id, position, chapters(id, slug, title, subject_id, subjects(slug, title)), quizzes(slug, title)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}
