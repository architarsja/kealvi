"use client";
import { useEffect, useState } from "react";

// Feature 0, Beat 2 — the naive version. Questions live in a variable on the
// server; the browser asks for them on load. Submit a few, restart the dev
// server, refresh: they're gone. That's the hook.
export default function Page() {
  const [questions, setQuestions] = useState<{ id: string; body: string }[]>([]);
  const [draft, setDraft] = useState("");

  // ask the server for the list on load
  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then(setQuestions);
  }, []);

  async function submit() {
    if (!draft.trim()) return;
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const created = await res.json();
    setQuestions((qs) => [created, ...qs]); // newest on top, no reload
    setDraft("");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-medium">Live Q&amp;A</h1>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button onClick={submit} className="rounded-md border px-4 py-2">
          Ask
        </button>
      </div>
      <ul className="mt-4 space-y-3">
        {questions.map((q) => (
          <li key={q.id} className="rounded-lg border p-3">
            {q.body}
          </li>
        ))}
      </ul>
    </main>
  );
}
