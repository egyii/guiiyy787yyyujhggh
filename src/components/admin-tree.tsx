import { useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { EntityKey, Row } from "@/lib/admin-api";

type Handlers = {
  onAdd: (key: EntityKey, defaults: Row) => void;
  onEdit: (key: EntityKey, row: Row) => void;
  onDelete: (key: EntityKey, id: string) => void;
};

type Data = Record<EntityKey, Row[]>;

const byPos = (a: Row, b: Row) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0);

function NodeRow({
  title,
  subtitle,
  depth,
  open,
  hasChildrenToggle,
  onToggle,
  actions,
}: {
  title: string;
  subtitle?: string | undefined;
  depth: number;
  open?: boolean | undefined;
  hasChildrenToggle?: boolean | undefined;
  onToggle?: (() => void) | undefined;
  actions: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-2 py-2.5"
      style={{ paddingLeft: `${depth * 14}px` }}
    >
      {hasChildrenToggle ? (
        <button
          onClick={onToggle}
          aria-label={open ? "Collapse" : "Expand"}
          className="press grid size-7 shrink-0 place-items-center rounded-full bg-secondary/60"
        >
          <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
      ) : (
        <span className="size-7 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {subtitle ? (
          <span className="block truncate text-[12px] text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-1">{actions}</span>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  tone,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`press grid size-8 place-items-center rounded-full bg-secondary/60 hover:bg-secondary ${
        tone === "danger" ? "text-destructive hover:bg-destructive/15" : ""
      }`}
    >
      {children}
    </button>
  );
}

export function AdminTree({ data, onAdd, onEdit, onDelete }: { data: Data } & Handlers) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  const quizTitle = (id: unknown) =>
    data.quizzes.find((q) => q["id"] === id)?.["title"] as string | undefined;

  const renderLesson = (lesson: Row, depth: number) => {
    const id = String(lesson["id"]);
    const parts = data.lesson_parts.filter((p) => p["lesson_id"] === id).sort(byPos);
    const quiz = quizTitle(lesson["quiz_id"]);
    return (
      <div key={id}>
        <NodeRow
          depth={depth}
          title={String(lesson["title"])}
          subtitle={[parts.length ? `${parts.length} parts` : null, quiz ? `Quiz: ${quiz}` : null]
            .filter(Boolean)
            .join(" · ")}
          hasChildrenToggle
          open={open[id]}
          onToggle={() => toggle(id)}
          actions={
            <>
              <IconBtn label="Add part" onClick={() => onAdd("lesson_parts", { lesson_id: id })}>
                <Plus className="size-4" />
              </IconBtn>
              <IconBtn label="Edit class" onClick={() => onEdit("lessons", lesson)}>
                <Pencil className="size-4" />
              </IconBtn>
              <IconBtn label="Delete class" tone="danger" onClick={() => onDelete("lessons", id)}>
                <Trash2 className="size-4" />
              </IconBtn>
            </>
          }
        />
        {open[id] &&
          parts.map((part) => (
            <NodeRow
              key={String(part["id"])}
              depth={depth + 1}
              title={String(part["title"])}
              subtitle="Class part"
              actions={
                <>
                  <IconBtn label="Edit part" onClick={() => onEdit("lesson_parts", part)}>
                    <Pencil className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Delete part"
                    tone="danger"
                    onClick={() => onDelete("lesson_parts", String(part["id"]))}
                  >
                    <Trash2 className="size-4" />
                  </IconBtn>
                </>
              }
            />
          ))}
      </div>
    );
  };

  const renderChapter = (chapter: Row, depth: number) => {
    const id = String(chapter["id"]);
    const subs = data.chapters.filter((c) => c["parent_id"] === id).sort(byPos);
    const lessons = data.lessons.filter((l) => l["chapter_id"] === id).sort(byPos);
    return (
      <div key={id}>
        <NodeRow
          depth={depth}
          title={String(chapter["title"])}
          subtitle={`${lessons.length} classes${subs.length ? ` · ${subs.length} sub-chapters` : ""}`}
          hasChildrenToggle
          open={open[id]}
          onToggle={() => toggle(id)}
          actions={
            <>
              <IconBtn label="Add class" onClick={() => onAdd("lessons", { chapter_id: id })}>
                <Plus className="size-4" />
              </IconBtn>
              <IconBtn
                label="Add sub-chapter"
                onClick={() => onAdd("chapters", { subject_id: chapter["subject_id"], parent_id: id })}
              >
                <Plus className="size-4 opacity-60" />
              </IconBtn>
              <IconBtn label="Edit chapter" onClick={() => onEdit("chapters", chapter)}>
                <Pencil className="size-4" />
              </IconBtn>
              <IconBtn label="Delete chapter" tone="danger" onClick={() => onDelete("chapters", id)}>
                <Trash2 className="size-4" />
              </IconBtn>
            </>
          }
        />
        {open[id] && (
          <>
            {subs.map((sub) => renderChapter(sub, depth + 1))}
            {lessons.map((lesson) => renderLesson(lesson, depth + 1))}
            {subs.length === 0 && lessons.length === 0 && (
              <p
                className="py-2 text-[12px] text-muted-foreground"
                style={{ paddingLeft: `${(depth + 1) * 14 + 36}px` }}
              >
                No classes yet.
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  const renderSubject = (subject: Row, depth: number) => {
    const id = String(subject["id"]);
    const chapters = data.chapters
      .filter((c) => c["subject_id"] === id && !c["parent_id"])
      .sort(byPos);
    return (
      <div key={id}>
        <NodeRow
          depth={depth}
          title={String(subject["title"])}
          subtitle={`${chapters.length} chapters · /${String(subject["slug"] ?? "")}`}
          hasChildrenToggle
          open={open[id]}
          onToggle={() => toggle(id)}
          actions={
            <>
              <IconBtn label="Add chapter" onClick={() => onAdd("chapters", { subject_id: id })}>
                <Plus className="size-4" />
              </IconBtn>
              <IconBtn label="Edit subject" onClick={() => onEdit("subjects", subject)}>
                <Pencil className="size-4" />
              </IconBtn>
              <IconBtn label="Delete subject" tone="danger" onClick={() => onDelete("subjects", id)}>
                <Trash2 className="size-4" />
              </IconBtn>
            </>
          }
        />
        {open[id] &&
          (chapters.length > 0 ? (
            chapters.map((c) => renderChapter(c, depth + 1))
          ) : (
            <p
              className="py-2 text-[12px] text-muted-foreground"
              style={{ paddingLeft: `${(depth + 1) * 14 + 36}px` }}
            >
              No chapters yet.
            </p>
          ))}
      </div>
    );
  };

  const courses = [...data.courses].sort(byPos);
  const orphanSubjects = data.subjects.filter((s) => !s["course_id"]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => onAdd("courses", {})}
          className="press inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="size-4" /> New course
        </button>
      </div>

      <div className="card-soft divide-y divide-border/60 rounded-[24px] px-3 py-1">
        {courses.map((course) => {
          const id = String(course["id"]);
          const subjects = data.subjects.filter((s) => s["course_id"] === id).sort(byPos);
          return (
            <div key={id}>
              <NodeRow
                depth={0}
                title={String(course["title"])}
                subtitle={`${subjects.length} subjects · /${String(course["slug"] ?? "")}`}
                hasChildrenToggle
                open={open[id]}
                onToggle={() => toggle(id)}
                actions={
                  <>
                    <IconBtn label="Add subject" onClick={() => onAdd("subjects", { course_id: id })}>
                      <Plus className="size-4" />
                    </IconBtn>
                    <IconBtn label="Edit course" onClick={() => onEdit("courses", course)}>
                      <Pencil className="size-4" />
                    </IconBtn>
                    <IconBtn label="Delete course" tone="danger" onClick={() => onDelete("courses", id)}>
                      <Trash2 className="size-4" />
                    </IconBtn>
                  </>
                }
              />
              {open[id] &&
                (subjects.length > 0 ? (
                  subjects.map((s) => renderSubject(s, 1))
                ) : (
                  <p className="py-2 pl-[50px] text-[12px] text-muted-foreground">No subjects yet.</p>
                ))}
            </div>
          );
        })}

        {orphanSubjects.length > 0 && (
          <div>
            <p className="px-1 py-2.5 text-[12px] uppercase tracking-wide text-muted-foreground">
              Subjects without a course
            </p>
            {orphanSubjects.map((s) => renderSubject(s, 0))}
          </div>
        )}

        {courses.length === 0 && orphanSubjects.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nothing yet — start with a course.
          </p>
        )}
      </div>
    </div>
  );
}
