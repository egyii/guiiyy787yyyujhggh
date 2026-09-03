import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Upload } from "lucide-react";
import { insertRows, type Row } from "@/lib/admin-api";
import { inputClass } from "@/components/admin-row-editor";

type Parsed = {
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
};

const SAMPLE = `What is 2 + 2? | 3 | 4 | 5 | 6 | 1 | Basic addition
Capital of France? | Paris* | Rome | Berlin | Madrid`;

export function parseQuestions(raw: string): Parsed[] {
  const text = raw.trim();
  if (!text) return [];

  // JSON array support
  if (text.startsWith("[")) {
    const arr = JSON.parse(text) as Array<Record<string, unknown>>;
    return arr.map((q, i) => {
      const options = (q["options"] as string[]) ?? [];
      if (!q["prompt"] || options.length < 2)
        throw new Error(`Item ${i + 1}: needs "prompt" and at least 2 "options"`);
      return {
        prompt: String(q["prompt"]),
        options: options.map(String),
        correct_index: Number(q["correct_index"] ?? q["answer_index"] ?? 0),
        explanation: q["explanation"] ? String(q["explanation"]) : null,
      };
    });
  }

  // Pipe format: prompt | opt1 | opt2 | ... | [correctIndex] | [explanation]
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const cells = line.split("|").map((c) => c.trim());
      const prompt = cells.shift() ?? "";
      if (!prompt) throw new Error(`Line ${i + 1}: missing question`);

      let explanation: string | null = null;
      let correct = -1;

      // trailing explanation (non-numeric last cell when >4 cells)
      if (cells.length > 2 && cells[cells.length - 1] && Number.isNaN(Number(cells[cells.length - 1]))) {
        const starred = cells.some((c) => c.endsWith("*"));
        if (starred || cells.length > 3) explanation = cells.pop() ?? null;
      }
      // trailing numeric correct index
      const last = cells[cells.length - 1];
      if (last !== undefined && last !== "" && !Number.isNaN(Number(last)) && cells.length > 2) {
        correct = Number(cells.pop());
      }

      const options = cells.map((c) => c.replace(/\*$/, "").trim()).filter(Boolean);
      const starIdx = cells.findIndex((c) => c.endsWith("*"));
      if (starIdx >= 0) correct = starIdx;
      if (correct < 0) correct = 0;

      if (options.length < 2) throw new Error(`Line ${i + 1}: needs at least 2 options`);
      if (correct >= options.length) throw new Error(`Line ${i + 1}: correct option out of range`);

      return { prompt, options, correct_index: correct, explanation };
    });
}

export function AdminImport({ quizzes }: { quizzes: Row[] }) {
  const qc = useQueryClient();
  const [quizId, setQuizId] = useState("");
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  let preview: Parsed[] = [];
  let parseError: string | null = null;
  try {
    preview = parseQuestions(raw);
  } catch (e) {
    parseError = (e as Error).message;
  }

  const run = useMutation({
    mutationFn: async () => {
      const parsed = parseQuestions(raw);
      if (!quizId) throw new Error("Pick a quiz first");
      if (parsed.length === 0) throw new Error("Nothing to import");
      const rows: Row[] = parsed.map((q, i) => ({
        quiz_id: quizId,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        position: i,
      }));
      await insertRows("questions", rows);
      return parsed.length;
    },
    onSuccess: (n) => {
      setError(null);
      setDone(n);
      setRaw("");
      qc.invalidateQueries();
    },
    onError: (e: Error) => {
      setDone(null);
      setError(e.message);
    },
  });

  return (
    <div className="card-soft space-y-4 rounded-[24px] p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Import questions</h2>
        <p className="text-[13px] text-muted-foreground">
          Paste one question per line: <code>Question | option A* | option B | option C | explanation</code>{" "}
          — mark the correct option with <code>*</code>, or end with a 0-based index. A JSON array of{" "}
          <code>{"{ prompt, options, correct_index, explanation }"}</code> also works.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-[13px] text-muted-foreground">Quiz</span>
        <select value={quizId} onChange={(e) => setQuizId(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {quizzes.map((q) => (
            <option key={String(q["id"])} value={String(q["id"])}>
              {String(q["title"])}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-[13px] text-muted-foreground">Questions</span>
        <textarea
          rows={10}
          value={raw}
          placeholder={SAMPLE}
          onChange={(e) => setRaw(e.target.value)}
          className={`${inputClass} font-mono text-[12.5px]`}
        />
      </label>

      {raw.trim() && parseError && <p className="text-sm text-destructive">{parseError}</p>}
      {raw.trim() && !parseError && (
        <div className="space-y-2 rounded-2xl bg-secondary/40 p-4">
          <p className="text-[13px] font-medium">{preview.length} questions detected</p>
          <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
            {preview.slice(0, 4).map((q, i) => (
              <li key={i} className="truncate">
                {q.prompt} → <span className="text-foreground">{q.options[q.correct_index]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {done !== null && <p className="text-sm text-muted-foreground">Imported {done} questions.</p>}

      <button
        onClick={() => run.mutate()}
        disabled={run.isPending || !quizId || preview.length === 0 || Boolean(parseError)}
        className="press inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        <Upload className="size-4" /> {run.isPending ? "Importing…" : "Import questions"}
      </button>
    </div>
  );
}
