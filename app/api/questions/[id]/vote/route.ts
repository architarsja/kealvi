import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for inserts (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { voterId } = await req.json();
  const questionId = params.id; // ✅ comes from URL

  if (!questionId) {
    return NextResponse.json({ error: "questionId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("polls")
    .insert([
      {
        question_id: questionId, // ✅ required column
        voter_id: voterId,
      },
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
