import { supabase } from './supabase';

export type Question = {
  id: string;
  body: string;
  is_pinned: boolean;
  is_answered: boolean;
  session_id: string;
  created_at: string;
  vote_count?: number;
  user_voted?: boolean;
};

// ── Fetch all questions with vote counts ─────────────────
export async function fetchQuestions(userFingerprint: string): Promise<Question[]> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !questions) return [];

  const { data: allVotes } = await supabase
    .from('votes')
    .select('question_id, user_fingerprint');

  const votes = allVotes ?? [];

  return questions.map((q) => ({
    ...q,
    vote_count: votes.filter((v) => v.question_id === q.id).length,
    user_voted: votes.some(
      (v) => v.question_id === q.id && v.user_fingerprint === userFingerprint
    ),
  }));
}

// ── Add a question ───────────────────────────────────────
export async function addQuestion(body: string, sessionId: string) {
  const { error } = await supabase.from('questions').insert({
    body,
    session_id: sessionId,
    is_pinned: false,
    is_answered: false,
  });
  if (error) console.error('addQuestion error:', error);
}

// ── Toggle pin ───────────────────────────────────────────
export async function togglePinQuestion(id: string, current: boolean) {
  await supabase.from('questions').update({ is_pinned: !current }).eq('id', id);
}