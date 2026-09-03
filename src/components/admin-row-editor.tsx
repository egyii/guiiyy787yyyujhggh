import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";
import {
  createRow,
  entityFor,
  updateRow,
  type EntityKey,
  type Field,
  type Row,
} from "@/lib/admin-api";

export const inputClass =
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

export function RowEditor({
  entityKey,
  row,
  defaults,
  refs,
  onClose,
}: {
  entityKey: EntityKey;
  row: Row | null;
  defaults?: Row;
  refs: Record<string, Row[]>;
  onClose: () => void;
}) {
  const entity = entityFor(entityKey);
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      entity.fields.map((f) => [f.name, toFormValue(f, row?.[f.name] ?? defaults?.[f.name])]),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Row = {};
      for (const f of entity.fields) payload[f.name] = fromFormValue(f, values[f.name] ?? "");
      if (row?.["id"]) await updateRow(entityKey, String(row["id"]), payload);
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
          <button
            onClick={onClose}
            aria-label="Close"
            className="press grid size-9 place-items-center rounded-full bg-secondary/70"
          >
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
                  <textarea
                    rows={f.kind === "json" ? 4 : 3}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className={inputClass}
                  />
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
                      <option key={String(r["id"])} value={String(r["id"])}>
                        {String(r[entityFor(f.refTable!).labelField] ?? r["id"]).slice(0, 60)}
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
