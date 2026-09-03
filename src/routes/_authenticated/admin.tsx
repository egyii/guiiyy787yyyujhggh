import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
import { useIsAdmin } from "@/hooks/use-admin";
import { AdminTree } from "@/components/admin-tree";
import { AdminImport } from "@/components/admin-import";
import { RowEditor } from "@/components/admin-row-editor";
import { ENTITIES, deleteRow, listRows, type EntityKey, type Row } from "@/lib/admin-api";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Manage courses & quizzes | QuizPulse" },
      {
        name: "description",
        content:
          "Admin dashboard to create and edit QuizPulse courses, subjects, chapters, classes, class parts, quizzes and questions.",
      },
      { property: "og:title", content: "Admin — Manage courses & quizzes | QuizPulse" },
      {
        property: "og:description",
        content: "Create and edit courses, classes, quizzes and questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab = "library" | "quizzes" | "import";

const TABS: { key: Tab; label: string }[] = [
  { key: "library", label: "Course library" },
  { key: "quizzes", label: "Quizzes & questions" },
  { key: "import", label: "Import questions" },
];

type Editing = { key: EntityKey; row: Row | null; defaults?: Row };

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const [tab, setTab] = useState<Tab>("library");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [openQuiz, setOpenQuiz] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const all = useQuery({
    queryKey: ["admin-all"],
    enabled: isAdmin,
    queryFn: async () => {
      const out = {} as Record<EntityKey, Row[]>;
      await Promise.all(
        ENTITIES.map(async (e) => {
          out[e.key] = await listRows(e.key);
        }),
      );
      return out;
    },
  });

  const remove = useMutation({
    mutationFn: ({ key, id }: { key: EntityKey; id: string }) => deleteRow(key, id),
    onSuccess: () => qc.invalidateQueries(),
  });

  const onDelete = (key: EntityKey, id: string) => {
    if (confirm("Delete this item? Everything nested inside it may be removed too.")) {
      remove.mutate({ key, id });
    }
  };

  if (loading) {
    return (
      <ArenaShell>
        <div className="mx-auto h-64 w-full max-w-4xl animate-pulse rounded-[24px] bg-surface" />
      </ArenaShell>
    );
  }

  if (!isAdmin) {
    return (
      <ArenaShell>
        <div className="card-soft mx-auto max-w-md space-y-3 rounded-[24px] p-8 text-center">
          <h1 className="text-xl font-semibold">Admins only</h1>
          <p className="text-sm text-muted-foreground">
            Your account doesn’t have admin access. Ask an existing admin to grant you the admin role.
          </p>
        </div>
      </ArenaShell>
    );
  }

  const data = all.data;

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <Breadcrumbs items={[{ label: "Admin" }]} />

        <header className="space-y-2">
          <h1 className="reveal text-3xl font-semibold sm:text-4xl">Admin</h1>
          <p className="reveal text-[15px] text-muted-foreground" style={{ animationDelay: "70ms" }}>
            Build everything in one place — expand a course to add subjects, chapters, classes and parts
            without switching tabs.
          </p>
        </header>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`press shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {all.isLoading || !data ? (
          <div className="h-64 animate-pulse rounded-[24px] bg-surface" />
        ) : tab === "library" ? (
          <AdminTree
            data={data}
            onAdd={(key, defaults) => setEditing({ key, row: null, defaults })}
            onEdit={(key, row) => setEditing({ key, row })}
            onDelete={onDelete}
          />
        ) : tab === "quizzes" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setEditing({ key: "quizzes", row: null })}
                className="press inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Plus className="size-4" /> New quiz
              </button>
            </div>
            <div className="card-soft divide-y divide-border/60 rounded-[24px] px-3 py-1">
              {data.quizzes.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No quizzes yet.</p>
              ) : (
                data.quizzes.map((quiz) => {
                  const id = String(quiz["id"]);
                  const questions = data.questions
                    .filter((q) => q["quiz_id"] === id)
                    .sort((a, b) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0));
                  const isOpen = openQuiz[id];
                  return (
                    <div key={id}>
                      <div className="flex items-center gap-2 py-2.5">
                        <button
                          onClick={() => setOpenQuiz((p) => ({ ...p, [id]: !p[id] }))}
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          className="press grid size-7 shrink-0 place-items-center rounded-full bg-secondary/60"
                        >
                          <ChevronRight className={`size-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{String(quiz["title"])}</span>
                          <span className="block truncate text-[12px] text-muted-foreground">
                            {questions.length} questions · {String(quiz["difficulty"] ?? "")}
                          </span>
                        </span>
                        <button
                          onClick={() => setEditing({ key: "questions", row: null, defaults: { quiz_id: id } })}
                          aria-label="Add question"
                          title="Add question"
                          className="press grid size-8 place-items-center rounded-full bg-secondary/60 hover:bg-secondary"
                        >
                          <Plus className="size-4" />
                        </button>
                        <button
                          onClick={() => setEditing({ key: "quizzes", row: quiz })}
                          aria-label="Edit quiz"
                          className="press grid size-8 place-items-center rounded-full bg-secondary/60 hover:bg-secondary"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => onDelete("quizzes", id)}
                          aria-label="Delete quiz"
                          className="press grid size-8 place-items-center rounded-full bg-secondary/60 text-destructive hover:bg-destructive/15"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {isOpen &&
                        (questions.length === 0 ? (
                          <p className="py-2 pl-[50px] text-[12px] text-muted-foreground">
                            No questions yet — add one, or use Import questions.
                          </p>
                        ) : (
                          questions.map((q) => (
                            <div key={String(q["id"])} className="flex items-center gap-2 py-2 pl-9">
                              <span className="min-w-0 flex-1 truncate text-[13px]">{String(q["prompt"])}</span>
                              <button
                                onClick={() => setEditing({ key: "questions", row: q })}
                                aria-label="Edit question"
                                className="press grid size-8 place-items-center rounded-full bg-secondary/60 hover:bg-secondary"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                onClick={() => onDelete("questions", String(q["id"]))}
                                aria-label="Delete question"
                                className="press grid size-8 place-items-center rounded-full bg-secondary/60 text-destructive hover:bg-destructive/15"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          ))
                        ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <AdminImport quizzes={data.quizzes} />
        )}

        {all.error && <p className="text-sm text-destructive">{(all.error as Error).message}</p>}
      </div>

      {editing && data && (
        <RowEditor
          entityKey={editing.key}
          row={editing.row}
          {...(editing.defaults ? { defaults: editing.defaults } : {})}
          refs={data}
          onClose={() => setEditing(null)}
        />
      )}
    </ArenaShell>
  );
}
