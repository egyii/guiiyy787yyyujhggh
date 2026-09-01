import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as {
  from: (table: string) => {
    select: (cols: string) => {
      order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Row[] | null; error: { message: string } | null }>;
    };
    insert: (values: Row) => Promise<{ error: { message: string } | null }>;
    update: (values: Row) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
  };
};

export type Row = Record<string, unknown>;

export type FieldKind = "text" | "textarea" | "number" | "select" | "ref" | "json";

export type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  refTable?: EntityKey;
  optional?: boolean;
};

export type EntityKey =
  | "courses"
  | "subjects"
  | "chapters"
  | "lessons"
  | "lesson_parts"
  | "quizzes"
  | "questions";

export type Entity = {
  key: EntityKey;
  table: string;
  label: string;
  labelField: string;
  orderBy: string;
  fields: Field[];
};

const contentFields: Field[] = [
  { name: "video_url", label: "Video embed URL", kind: "text" },
  { name: "pdf_url", label: "PDF URL", kind: "text" },
  { name: "notes", label: "Notes", kind: "textarea" },
  { name: "assignment", label: "Assignment", kind: "textarea" },
  { name: "duration_minutes", label: "Duration (min)", kind: "number" },
];

export const ENTITIES: Entity[] = [
  {
    key: "courses",
    table: "courses",
    label: "Courses",
    labelField: "title",
    orderBy: "position",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "icon", label: "Icon (lucide name)", kind: "text" },
      { name: "position", label: "Position", kind: "number" },
    ],
  },
  {
    key: "subjects",
    table: "subjects",
    label: "Subjects",
    labelField: "title",
    orderBy: "position",
    fields: [
      { name: "course_id", label: "Course", kind: "ref", refTable: "courses" },
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "icon", label: "Icon (lucide name)", kind: "text" },
      { name: "position", label: "Position", kind: "number" },
    ],
  },
  {
    key: "chapters",
    table: "chapters",
    label: "Chapters",
    labelField: "title",
    orderBy: "position",
    fields: [
      { name: "subject_id", label: "Subject", kind: "ref", refTable: "subjects", required: true },
      { name: "parent_id", label: "Parent chapter (for sub-chapter)", kind: "ref", refTable: "chapters" },
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "position", label: "Position", kind: "number" },
    ],
  },
  {
    key: "lessons",
    table: "lessons",
    label: "Classes",
    labelField: "title",
    orderBy: "position",
    fields: [
      { name: "chapter_id", label: "Chapter", kind: "ref", refTable: "chapters", required: true },
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      ...contentFields,
      { name: "quiz_id", label: "Associated quiz", kind: "ref", refTable: "quizzes" },
      { name: "position", label: "Position", kind: "number" },
    ],
  },
  {
    key: "lesson_parts",
    table: "lesson_parts",
    label: "Class parts",
    labelField: "title",
    orderBy: "position",
    fields: [
      { name: "lesson_id", label: "Class", kind: "ref", refTable: "lessons", required: true },
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      ...contentFields,
      { name: "position", label: "Position", kind: "number" },
    ],
  },
  {
    key: "quizzes",
    table: "quizzes",
    label: "Quizzes",
    labelField: "title",
    orderBy: "created_at",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "category", label: "Category", kind: "text" },
      {
        name: "difficulty",
        label: "Difficulty",
        kind: "select",
        options: ["NOVICE", "SKILLED", "EXPERT"],
      },
    ],
  },
  {
    key: "questions",
    table: "questions",
    label: "Questions",
    labelField: "prompt",
    orderBy: "position",
    fields: [
      { name: "quiz_id", label: "Quiz", kind: "ref", refTable: "quizzes", required: true },
      { name: "prompt", label: "Prompt", kind: "textarea", required: true },
      { name: "options", label: "Options (one per line)", kind: "json", required: true },
      { name: "correct_index", label: "Correct option (0-based)", kind: "number" },
      { name: "explanation", label: "Explanation", kind: "textarea" },
      { name: "position", label: "Position", kind: "number" },
    ],
  },
];

export function entityFor(key: EntityKey) {
  return ENTITIES.find((e) => e.key === key)!;
}

export async function listRows(key: EntityKey): Promise<Row[]> {
  const entity = entityFor(key);
  const { data, error } = await db
    .from(entity.table)
    .select("*")
    .order(entity.orderBy, { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createRow(key: EntityKey, values: Row) {
  const { error } = await db.from(entityFor(key).table).insert(values);
  if (error) throw new Error(error.message);
}

export async function updateRow(key: EntityKey, id: string, values: Row) {
  const { error } = await db.from(entityFor(key).table).update(values).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRow(key: EntityKey, id: string) {
  const { error } = await db.from(entityFor(key).table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
