"use client";

import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";
import { translations } from "@/lib/translations";


interface Question {
  id: string;
  body: string;
  body_en?: string;
  body_ta?: string;
  body_hi?: string;
  author: string;
  votes?: number;
}
interface Poll {
  id: string;
  title: string;
  question_id: string; // ✅ foreign key to Question
  question?: Question; // ✅ optional relation if you join with questions
  poll_options?: { id: string; option_text: string; votes: number }[]; // ✅ optional relation if you join with poll_options
}
export default function QuestionsList({
  initialQuestions = [],
  initialHasMore = false,
}: {
  initialQuestions?: Question[];
  initialHasMore?: boolean;
}) {
  // ✅ All hooks at the top
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollTitle, setPollTitle] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [language, setLanguage] = useState<"en" | "ta" | "hi">(
    (typeof window !== "undefined" &&
      (localStorage.getItem("language") as "en" | "ta" | "hi")) || "en"
  );
  const [sortBy, setSortBy] = useState<"latest" | "mostVoted">("latest");
  const [view, setView] = useState<"questions" | "polls">("questions");

  const t = translations[language];

  // ✅ Effect for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const lang =
        (localStorage.getItem("language") as "en" | "ta" | "hi") || "en";
      setLanguage(lang);
    };

    window.addEventListener("languageChange", handleLanguageChange);
    return () => window.removeEventListener("languageChange", handleLanguageChange);
  }, []);

  // ✅ Effect for fetching questions
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

async function createPoll() {
  if (
    !pollTitle.trim() ||
    !pollQuestion.trim() ||
    !option1.trim() ||
    !option2.trim()
  ) {
    alert("Please fill all fields");
    return;
  }

  const res = await fetch("/api/polls", {
  method: "POST",
  body: JSON.stringify({
    title: pollTitle,
    question: questions[0].id,   // ✅ UUID, not text
    options: [option1, option2],
  }),
});


  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Failed to create poll");
    return;
  }
  
  setPolls((prev) => [
    {
      ...data.poll,
      poll_options: [
        {
          id: 1,
          option_text: option1,
        },
        {
          id: 2,
          option_text: option2,
        },
      ],
    },
    ...prev,
  ]);

  setPollTitle("");
  setPollQuestion("");
  setOption1("");
  setOption2("");

  alert("Poll created successfully");
}

  async function submit() {
    if (!draft.trim()) return;

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: draft,
      }),
    });

    const created = await res.json();

    setQuestions((qs) => [
      {
        ...created,
        votes: 0,
      },
      ...qs,
    ]);

    setDraft("");
  }

  async function upvote(id: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === id
          ? {
              ...q,
              votes: (q.votes ?? 0) + 1,
            }
          : q
      )
    );

    const res = await fetch(
      `/api/questions/${id}/vote`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voterId: getVoterId(),
        }),
      }
    );

    if (res.status === 409) {
      alert(
        "You have already voted for this question."
      );
      return;
    }

    if (!res.ok) {
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === id
            ? {
                ...q,
                votes: (q.votes ?? 0) - 1,
              }
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

    setQuestions((qs) => [
      ...qs,
      ...(data.questions || []),
    ]);

    setHasMore(data.hasMore || false);

    setLoading(false);
  }

  const displayedQuestions =
    sortBy === "mostVoted"
      ? [...questions].sort(
          (a, b) => (b.votes ?? 0) - (a.votes ?? 0)
        )
      : questions;

  return (
  <div className="space-y-4">
    {/* Questions / Polls Toggle */}
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setView("questions")}
        className={`rounded-md border px-3 py-1 ${
          view === "questions"
            ? "bg-black text-white"
            : ""
        }`}
      >
        Questions
      </button>

      <button
        onClick={() => setView("polls")}
        className={`rounded-md border px-3 py-1 ${
          view === "polls"
            ? "bg-black text-white"
            : ""
        }`}
      >
        Polls
      </button>
    </div>

    {/* Polls View */}
    {view === "polls" && (
  <div className="space-y-4">

    <input
      value={pollTitle}
      onChange={(e) =>
        setPollTitle(e.target.value)
      }
      placeholder="Poll Title"
      className="w-full rounded-md border px-3 py-2"
    />

    <input
      value={pollQuestion}
      onChange={(e) =>
        setPollQuestion(e.target.value)
      }
      placeholder="Poll Question"
      className="w-full rounded-md border px-3 py-2"
    />

    <input
      value={option1}
      onChange={(e) =>
        setOption1(e.target.value)
      }
      placeholder="Option 1"
      className="w-full rounded-md border px-3 py-2"
    />

    <input
      value={option2}
      onChange={(e) =>
        setOption2(e.target.value)
      }
      placeholder="Option 2"
      className="w-full rounded-md border px-3 py-2"
    />

      <button
    onClick={createPoll}
    className="rounded-md border px-4 py-2"
  >
    Create Poll
  </button>

    {polls.map((poll) => (
      <div
        key={poll.id}
        className="rounded-lg border p-4"
      >
        <h3 className="font-bold">
          {poll.title}
        </h3>

        <p>{poll.question?.body}</p>

        <div className="mt-2 space-y-2">
          {poll.poll_options?.map(
            (option: any) => (
              <div
                key={option.id}
                className="rounded border p-2"
              >
                {option.option_text}
              </div>
            )
          )}
        </div>
      </div>
    ))}
  </div>
)}

    {/* Questions View */}
    {view === "questions" && (
      <>
        {/* Language Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              localStorage.setItem(
                "language",
                "en"
              );
              setLanguage("en");
              window.dispatchEvent(
                new Event("languageChange")
              );
            }}
            className={`rounded-md border px-3 py-1 ${
              language === "en"
                ? "bg-black text-white"
                : ""
            }`}
          >
            English
          </button>

          <button
            onClick={() => {
              localStorage.setItem(
                "language",
                "ta"
              );
              setLanguage("ta");
              window.dispatchEvent(
                new Event("languageChange")
              );
            }}
            className={`rounded-md border px-3 py-1 ${
              language === "ta"
                ? "bg-black text-white"
                : ""
            }`}
          >
            தமிழ்
          </button>

          <button
            onClick={() => {
              localStorage.setItem(
                "language",
                "hi"
              );
              setLanguage("hi");
              window.dispatchEvent(
                new Event("languageChange")
              );
            }}
            className={`rounded-md border px-3 py-1 ${
              language === "hi"
                ? "bg-black text-white"
                : ""
            }`}
          >
            हिन्दी
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) =>
              setDraft(e.target.value)
            }
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

        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder={t.search}
          className="w-full rounded-md border px-3 py-2"
        />

        <div className="flex gap-2">
          <button
            onClick={() =>
              setSortBy("latest")
            }
            className={`rounded-md border px-3 py-1 ${
              sortBy === "latest"
                ? "bg-black text-white"
                : ""
            }`}
          >
            Latest
          </button>

          <button
            onClick={() =>
              setSortBy("mostVoted")
            }
            className={`rounded-md border px-3 py-1 ${
              sortBy === "mostVoted"
                ? "bg-black text-white"
                : ""
            }`}
          >
            Most Voted
          </button>
        </div>

        <ul className="space-y-3">
          {displayedQuestions.map((q) => (
            <li
              key={q.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <button
                onClick={() =>
                  upvote(q.id)
                }
                className="rounded-md border px-3 py-1 font-mono"
              >
                ▲ {q.votes ?? 0}
              </button>

              <span>
                {language === "ta"
                  ? q.body_ta ||
                    q.body_en ||
                    q.body
                  : language === "hi"
                  ? q.body_hi ||
                    q.body_en ||
                    q.body
                  : q.body_en ||
                    q.body}
              </span>
            </li>
          ))}
        </ul>

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-md border px-4 py-2 disabled:opacity-50"
          >
            {loading
              ? t.loading
              : t.loadMore}
          </button>
        )}
      </>
    )}
  </div>
);
}