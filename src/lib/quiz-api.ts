import { supabase } from "@/integrations/supabase/client";

export type Quiz = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  icon: string;
};

export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  position: number;
  explanation: string | null;
};

export type LeaderRow = {
  id: string;
  username: string;
  xp: number;
};

export async function fetchQuizzes(): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, slug, title, description, category, difficulty, icon")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchQuizBySlug(slug: string) {
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, slug, title, description, category, difficulty, icon")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchQuestions(quizId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, prompt, options, correct_index, position, explanation")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: (q.options as string[]) ?? [],
    correct_index: q.correct_index,
    position: q.position,
    explanation: q.explanation ?? null,
  }));
}

export async function fetchLeaderboard(limit = 25): Promise<LeaderRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, xp")
    .order("xp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, xp, streak")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyAttempts(userId: string) {
  const { data, error } = await supabase
    .from("attempts")
    .select("id, score, total, xp_earned, created_at, quizzes(title, slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function saveAttempt(input: {
  userId: string;
  quizId: string;
  score: number;
  total: number;
}) {
  const xp = input.score * 100;
  const { error } = await supabase.from("attempts").insert({
    user_id: input.userId,
    quiz_id: input.quizId,
    score: input.score,
    total: input.total,
    xp_earned: xp,
  });
  if (error) throw error;
  return xp;
}
