import { supabase } from './supabase';

export type PollOption = {
  id: string;
  poll_id: string;
  label: string;
  votes_count: number;
};

export type Poll = {
  id: string;
  title: string;
  is_closed: boolean;
  created_at: string;
  options?: PollOption[];
  user_voted_option?: string | null;
};

// ── Fetch all polls + options + user's vote ──────────────
export async function fetchPolls(userFingerprint: string): Promise<Poll[]> {
  const { data: polls, error } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !polls) return [];

  const { data: options } = await supabase
    .from('poll_options')
    .select('*');

  const { data: myVotes } = await supabase
    .from('poll_votes')
    .select('poll_id, option_id')
    .eq('user_fingerprint', userFingerprint);

  return polls.map((p) => ({
    ...p,
    options: (options ?? []).filter((o) => o.poll_id === p.id),
    user_voted_option:
      (myVotes ?? []).find((v) => v.poll_id === p.id)?.option_id ?? null,
  }));
}

// ── Create poll + options ────────────────────────────────
export async function createPoll(title: string, optionLabels: string[]) {
  const { data: poll, error } = await supabase
    .from('polls')
    .insert({ title, is_closed: false })
    .select()
    .single();

  if (error || !poll) {
    console.error('createPoll error:', error);
    return null;
  }

  const opts = optionLabels.map((label) => ({
    poll_id: poll.id,
    label,
    votes_count: 0,
  }));

  await supabase.from('poll_options').insert(opts);
  return poll;
}

// ── Vote on a poll option ────────────────────────────────
export async function submitPollVote(
  pollId: string,
  optionId: string,
  prevOptionId: string | null,
  userFingerprint: string
) {
  // Remove old vote if switching
  if (prevOptionId) {
    await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_fingerprint', userFingerprint);

    await supabase.rpc('decrement_poll_option', { opt_id: prevOptionId });
  }

  await supabase.from('poll_votes').insert({
    poll_id: pollId,
    option_id: optionId,
    user_fingerprint: userFingerprint,
  });

  await supabase.rpc('increment_poll_option', { opt_id: optionId });
}

// ── Close a poll ─────────────────────────────────────────
export async function closePollById(pollId: string) {
  await supabase.from('polls').update({ is_closed: true }).eq('id', pollId);
}