"use client";

import { useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const router = useRouter();

  return (
    <select
      onChange={(e) =>
        router.push(`/${e.target.value}`)
      }
      className="border p-2 rounded"
    >
      <option value="en">
        English
      </option>

      <option value="ta">
        Tamil
      </option>

      <option value="hi">
        Hindi
      </option>
    </select>
  );
}