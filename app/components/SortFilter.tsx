"use client";

import { useRouter } from "next/navigation";

export default function SortFilter() {
  const router = useRouter();

  return (
    <select
      onChange={(e) =>
        router.push(`/?sort=${e.target.value}`)
      }
      className="border p-2 rounded"
    >
      <option value="latest">
        Latest
      </option>

      <option value="votes">
        Most Voted
      </option>
    </select>
  );
}