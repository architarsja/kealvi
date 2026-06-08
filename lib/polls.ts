import { supabase } from "./supabase";

export async function getPolls() {
  const { data } = await supabase
    .from("questions")
    .select(`
      *,
      poll_options(*)
    `);

  return data;
}


export async function getPollOptions(pollId: string) {
  const { data, error } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", pollId);

  if (error) throw new Error(error.message);

  return data;
}

export async function votePoll(
  pollId: string,
  optionId: string,
  voterId: string
) {
  const { error } = await supabase
    .from("poll_votes")
    .insert({
      poll_id: pollId,
      option_id: optionId,
      voter_id: voterId,
    });

  if (error) throw new Error(error.message);

  return { success: true };
}