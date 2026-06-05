import { supabase } from "./supabase";

export async function getQuestions(
  offset = 0,
  limit = 10
) {
  const { data: questions, error } = await supabase
    .from("questions")
    .select(`
      *,
      votes(count)
    `)
    .order("created_at", {
      ascending: false,
    })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const formatted =
    questions?.map((q: any) => ({
      ...q,
      votes: q.votes?.[0]?.count ?? 0,
    })) ?? [];

  return {
    questions: formatted,
    hasMore: formatted.length === limit,
  };
}

export async function searchQuestions(
  query: string,
  limit = 10
) {
  const { data: questions, error } = await supabase
    .from("questions")
    .select(`
      *,
      votes(count)
    `)
    .ilike("body", `%${query}%`)
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (
    questions?.map((q: any) => ({
      ...q,
      votes: q.votes?.[0]?.count ?? 0,
    })) ?? []
  );
}