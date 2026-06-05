import { supabase } from "./supabase";

export async function getQuestions(
  offset = 0,
  limit = 10
) {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return {
    questions: data ?? [],
    hasMore: (data?.length ?? 0) === limit,
  };
}

export async function searchQuestions(
  query: string,
  limit = 10
) {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .ilike("body", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}