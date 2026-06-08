import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user_fingerprint } = await req.json();
  const questionId = params.id;

  if (!user_fingerprint) {
    return NextResponse.json({ error: 'Missing fingerprint' }, { status: 400 });
  }

  // Check existing vote
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_fingerprint', user_fingerprint)
    .maybeSingle();

  if (existing) {
    await supabase.from('votes').delete().eq('id', existing.id);
    return NextResponse.json({ action: 'removed' });
  } else {
    await supabase
      .from('votes')
      .insert({ question_id: questionId, user_fingerprint });
    return NextResponse.json({ action: 'added' });
  }
}