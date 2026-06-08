"use client";

import { useState, useEffect, useMemo } from "react";
// REPLACE with
import { getFingerprint as getVoterId } from '@/lib/voter';
import { translations } from "@/lib/translations";
import SortFilter from './components/SortFilter';

type Question = {
  id: string;
  body: string;
  body_en?: string;
  body_ta?: string;
  body_hi?: string;
  author: string | null;
  votes?: number;
  createdAt?: string; // important for latest sorting
};

export default function QuestionsList({
  initialQuestions = [],
  initialHasMore = false,
}: {
  initialQuestions?: Question[];
  initialHasMore?: boolean;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [language, setLanguage] = useState<"en" | "ta" | "hi">("en");
  const [sortBy, setSortBy] = useState<"latest" | "mostVoted">("latest");

  useEffect(() => {
    setHydrated(true);

    const saved =
      (localStorage.getItem("language") as "en" | "ta" | "hi") || "en";

    setLanguage(saved);

    const handleLanguageChange = () => {
      const lang =
        (localStorage.getItem("language") as "en" | "ta" | "hi") || "en";
      setLanguage(lang);
    };

    window.addEventListener("languageChange", handleLanguageChange);

    return () =>
      window.removeEventListener("languageChange", handleLanguageChange);
  }, []);

  const t = translations[language];

  useEffect(() => {
    const timer = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : "/api/questions";

      const res = await fetch(url);
      const data = await res.json();

      setQuestions(data.questions || []);
      setHasMore(data.hasMore || false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function submit() {
    if (!draft.trim()) return;

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });

    const created = await res.json();

    setQuestions((qs) => [
      { ...created, votes: 0 },
      ...qs,
    ]);

    setDraft("");
  }

  async function upvote(id: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === id
          ? { ...q, votes: (q.votes ?? 0) + 1 }
          : q
      )
    );

    const res = await fetch(`/api/questions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voterId: getVoterId(),
      }),
    });

    if (res.status === 409) {
      alert("You have already voted for this question.");
      return;
    }

    if (!res.ok) {
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === id
            ? { ...q, votes: (q.votes ?? 0) - 1 }
            : q
        )
      );
    }
  }

  async function loadMore() {
    setLoading(true);

    const res = await fetch(
      `/api/questions?offset=${questions.length}`
    );

    const data = await res.json();

    setQuestions((qs) => [...qs, ...(data.questions || [])]);
    setHasMore(data.hasMore || false);

    setLoading(false);
  }

  // ✅ IMPORTANT: stable sorting (memoized)
  const displayedQuestions = useMemo(() => {
    const list = [...questions];

    if (sortBy === "mostVoted") {
      return list.sort(
        (a, b) => (b.votes ?? 0) - (a.votes ?? 0)
      );
    }

    // latest
    return list.sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
  }, [questions, sortBy]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {hydrated ? t.interactive : "Loading..."}
      </p>

      {/* Ask question */}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.askQuestion}
          className="flex-1 rounded-md border px-3 py-2"
        />

        <button
          onClick={submit}
          className="rounded-md border px-4 py-2"
        >
          {t.ask}
        </button>
      </div>

      {/* search */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search}
        className="w-full rounded-md border px-3 py-2"
      />

      {/* sort buttons (you already had this — no change needed) */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy("latest")}
          className={`rounded-md border px-3 py-1 ${
            sortBy === "latest" ? "bg-black text-white" : ""
          }`}
        >
          Latest
        </button>

        <button
          onClick={() => setSortBy("mostVoted")}
          className={`rounded-md border px-3 py-1 ${
            sortBy === "mostVoted" ? "bg-black text-white" : ""
          }`}
        >
          Most Voted
        </button>
      </div>

      {/* list */}
      <ul className="space-y-3">
        {displayedQuestions.map((q) => (
          <li
            key={q.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <button
              onClick={() => upvote(q.id)}
              className="rounded-md border px-3 py-1 font-mono"
            >
              ▲ {q.votes ?? 0}
            </button>

            <div className="flex flex-1 items-center justify-between">
  <span>
    {language === "ta"
      ? q.body_ta || q.body_en || q.body
      : language === "hi"
      ? q.body_hi || q.body_en || q.body
      : q.body_en || q.body}
  </span>

  <button
    onClick={async () => {
      if (navigator.share) {
        await navigator.share({
          title: "Kealvi Question",
          text: q.body,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(q.body);
        alert("Question copied to clipboard!");
      }
    }}
    className="ml-3 rounded-md border px-2 py-1"
  >
    🔗
  </button>
</div>
          </li>
        ))}
      </ul>

      {/* load more */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          {loading ? t.loading : t.loadMore}
        </button>
      )}
    </div>
  );
}