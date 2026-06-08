import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // ✅ no await needed

  const { data, error } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ poll: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { voterId } = await req.json();
  const pollId = params.id;

  if (!pollId) {
    return NextResponse.json({ error: "pollId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("polls")
    .insert([
      {
        question_id: pollId, // or `id: pollId` depending on your schema
        voter_id: voterId,
      },
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
