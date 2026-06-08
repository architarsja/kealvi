"use client";

import { useState } from "react";

// Define proper types
interface Option {
  id: string;
  option_text: string;
  votes: number;
}

interface Question {
  id: string;
  title: string;
  title_ta?: string;
  title_hi?: string;
}

interface PollCardProps {
  question: Question;
  options: Option[];
  language: string;
}

export default function PollCard({ question, options, language }: PollCardProps) {
  const [selected, setSelected] = useState("");

  async function vote(optionId: string) {
    setSelected(optionId);

    await fetch(`/api/polls/${question.id}`, {
      method: "POST",
      body: JSON.stringify({ optionId }),
    });
  }

  const totalVotes = options.reduce((sum, op) => sum + op.votes, 0);

  return (
    <div className="border rounded p-4 shadow">
      <h2 className="font-bold text-lg mb-4">
        {language === "ta"
          ? question.title_ta || question.title
          : language === "hi"
          ? question.title_hi || question.title
          : question.title}
      </h2>

      {options.map((option) => {
        const percent =
          totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);

        return (
          <button
            key={option.id}
            onClick={() => vote(option.id)}
            className={`w-full p-2 border rounded mb-2 ${
              selected === option.id ? "bg-blue-500 text-white" : ""
            }`}
          >
            {option.option_text}
            <div>
              {option.votes} votes ({percent}%)
            </div>
          </button>
        );
      })}

      <p className="mt-3">Total Votes: {totalVotes}</p>
    </div>
  );
}
