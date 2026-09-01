import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { ArenaShell, Breadcrumbs } from "@/components/arena-shell";
import { useIsAdmin } from "@/hooks/use-admin";
import {
  ENTITIES,
  createRow,
  deleteRow,
  entityFor,
  listRows,
  updateRow,
  type EntityKey,
  type Field,
  type Row,
} from "@/lib/admin-api";

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

const inputClass =
  "w-full rounded-2xl bg-secondary/50 px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-foreground/15";

function toFormValue(field: Field, value: unknown) {
  if (value === null || value === undefined) return "";
  if (field.kind === "json") return (value as string[]).join("\n");
  return String(value);
}

function fromFormValue(field: Field, raw: string): unknown {
  const trimmed = raw.trim();
  if (field.kind === "number") return trimmed === "" ? null : Number(trimmed);
  if (field.kind === "json")
    return trimmed
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  if (trimmed === "") return field.required ? "" : null;
  return raw;
}

function RowEditor({
  entityKey,
  row,
  refs,
  onClose,
}: {
  entityKey: EntityKey;
  row: Row | null;
  refs: Record<string, Row[]>;
  onClose: () => void;
}) {
  const entity = entityFor(entityKey);
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(entity.fields.map((f) => [f.name, toFormValue(f, row?.[f.name])])),
  );
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Row = {};
      for (const f of entity.fields) payload[f.name] = fromFormValue(f, values[f.name] ?? "");
      if (row?.id) await updateRow(entityKey, String(row.id), payload);
      else await createRow(entityKey, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center">
      <div className="reveal-scale card-soft max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] p-6 sm:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {row ? "Edit" : "New"} {entity.label.replace(/s$/, "")}
          </h2>
          <button onClick={onClose} aria-label="Close" className="press grid size-9 place-items-center rounded-full bg-secondary/70">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          {entity.fields.map((f) => {
            const value = values[f.name] ?? "";
            const set = (v: string) => setValues((p) => ({ ...p, [f.name]: v }));
            return (
              <label key={f.name} className="block space-y-1.5">
                <span className="text-[13px] text-muted-foreground">{f.label}</span>
                {f.kind === "textarea" || f.kind === "json" ? (
                  <textarea rows={f.kind === "json" ? 4 : 3} value={value} onChange={(e) => set(e.target.value)} className={inputClass} />
                ) : f.kind === "select" ? (
                  <select value={value} onChange={(e) => set(e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.kind === "ref" ? (
                  <select value={value} onChange={(e) => set(e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    {(refs[f.refTable!] ?? []).map((r) => (
                      <option key={String(r.id)} value={String(r.id)}>
                        {String(r[entityFor(f.refTable!).labelField] ?? r.id).slice(0, 60)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.kind === "number" ? "number" : "text"}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className={inputClass}
                  />
                )}
              </label>
            );
          })}
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="press flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose} className="press rounded-full bg-secondary px-5 py-3 text-sm font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const [tab, setTab] = useState<EntityKey>("courses");
  const [editing, setEditing] = useState<{ row: Row | null } | null>(null);
  const qc = useQueryClient();

  const entity = entityFor(tab);
  const rows = useQuery({
    queryKey: ["admin", tab],
    queryFn: () => listRows(tab),
    enabled: isAdmin,
  });

  const refKeys = useMemo(
    () => Array.from(new Set(entity.fields.filter((f) => f.kind === "ref").map((f) => f.refTable!))),
    [entity],
  );
  const refQueries = useQuery({
    queryKey: ["admin-refs", refKeys],
    enabled: isAdmin && refKeys.length > 0,
    queryFn: async () => {
      const out: Record<string, Row[]> = {};
      for (const k of refKeys) out[k] = await listRows(k);
      return out;
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow(tab, id),
    onSuccess: () => qc.invalidateQueries(),
  });

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

  return (
    <ArenaShell>
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <Breadcrumbs items={[{ label: "Admin" }]} />

        <header className="space-y-2">
          <h1 className="reveal text-3xl font-semibold sm:text-4xl">Admin</h1>
          <p className="reveal text-[15px] text-muted-foreground" style={{ animationDelay: "70ms" }}>
            Create and edit courses, subjects, chapters, classes, parts, quizzes and questions.
          </p>
        </header>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {ENTITIES.map((e) => (
            <button
              key={e.key}
              onClick={() => setTab(e.key)}
              className={`press shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                tab === e.key ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {rows.data?.length ?? 0} {entity.label.toLowerCase()}
          </span>
          <button
            onClick={() => setEditing({ row: null })}
            className="press inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" /> New
          </button>
        </div>

        <div className="card-soft divide-y divide-border/60 rounded-[24px] p-2">
          {rows.isLoading ? (
            <div className="h-40 animate-pulse rounded-[20px] bg-surface" />
          ) : (rows.data ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            (rows.data ?? []).map((row) => (
              <div key={String(row.id)} className="flex items-center gap-3 px-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {String(row[entity.labelField] ?? row.id)}
                  </span>
                  {row.slug ? (
                    <span className="block truncate text-[12px] text-muted-foreground">/{String(row.slug)}</span>
                  ) : null}
                </span>
                <button
                  onClick={() => setEditing({ row })}
                  aria-label="Edit"
                  className="press grid size-9 place-items-center rounded-full bg-secondary/60 hover:bg-secondary"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this item?")) remove.mutate(String(row.id));
                  }}
                  aria-label="Delete"
                  className="press grid size-9 place-items-center rounded-full bg-secondary/60 text-destructive hover:bg-destructive/15"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {rows.error && <p className="text-sm text-destructive">{(rows.error as Error).message}</p>}
      </div>

      {editing && (
        <RowEditor
          entityKey={tab}
          row={editing.row}
          refs={refQueries.data ?? {}}
          onClose={() => setEditing(null)}
        />
      )}
    </ArenaShell>
  );
}
