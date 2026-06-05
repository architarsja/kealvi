"use client";

import { useState } from "react";

export default function PollCard({
  question,
  options,
}: any) {
  const [selected, setSelected] = useState("");

  async function vote(optionId: string) {
    setSelected(optionId);

    await fetch(`/api/polls/${question.id}`, {
      method: "POST",
      body: JSON.stringify({
        optionId,
      }),
    });
  }

  const totalVotes = options.reduce(
    (sum: number, op: any) => sum + op.votes,
    0
  );

  return (
    <div className="border rounded p-4 shadow">
      <h2 className="font-bold text-lg mb-4">
        {question.title}
      </h2>

      {options.map((option: any) => {
        const percent =
          totalVotes === 0
            ? 0
            : Math.round(
                (option.votes / totalVotes) * 100
              );

        return (
          <button
            key={option.id}
            onClick={() => vote(option.id)}
            className={`w-full p-2 border rounded mb-2 ${
              selected === option.id
                ? "bg-blue-500 text-white"
                : ""
            }`}
          >
            {option.option_text}

            <div>
              {option.votes} votes ({percent}%)
            </div>
          </button>
        );
      })}

      <p className="mt-3">
        Total Votes: {totalVotes}
      </p>
    </div>
  );
}