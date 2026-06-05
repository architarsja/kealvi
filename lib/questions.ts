import { supabase } from "./supabase";

export async function getQuestions(
  sort = "latest"
) {
  let query = supabase
    .from("questions")
    .select("*");

  if (sort === "votes") {
    query = query.order(
      "votes",
      { ascending: false }
    );
  } else {
    query = query.order(
      "created_at",
      { ascending: false }
    );
  }

  const { data } = await query;

  return data;
}