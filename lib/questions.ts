import { supabase } from "./supabase";

export async function getQuestions(
  offset = 0,
  limit = 10
) {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const questionsWithVotes = await Promise.all(
    (questions || []).map(async (question) => {
      const { count } = await supabase
        .from("votes")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("question_id", question.id);

      return {
        ...question,
        votes: count || 0,
      };
    })
  );

  return {
    questions: questionsWithVotes,
    hasMore: questionsWithVotes.length === limit,
  };
}

export async function searchQuestions(
  query: string,
  limit = 10
) {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .ilike("body", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const questionsWithVotes = await Promise.all(
    (questions || []).map(async (question) => {
      const { count } = await supabase
        .from("votes")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("question_id", question.id);

      return {
        ...question,
        votes: count || 0,
      };
    })
  );

  return questionsWithVotes;
}