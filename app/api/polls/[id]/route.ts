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
  const { optionId } = await req.json();

  const { data: option } = await supabase
    .from("poll_options")
    .select("votes")
    .eq("id", optionId)
    .single();

  await supabase
    .from("poll_options")
    .update({
      votes: (option?.votes || 0) + 1,
    })
    .eq("id", optionId);

  return NextResponse.json({ success: true });
}
