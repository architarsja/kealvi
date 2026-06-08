"use client";

import { useRouter } from "next/navigation";

export default function SortFilter() {
  const router = useRouter();

  function handleSortChange(sort: string) {
    router.push(`/?sort=${sort}`);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleSortChange("latest")}
        className="border px-3 py-1 rounded"
      >
        Latest
      </button>
      <button
        onClick={() => handleSortChange("mostVoted")}
        className="border px-3 py-1 rounded"
      >
        Most Voted
      </button>
    </div>
  );
}
