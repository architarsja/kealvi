import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { optionId } = await req.json();

  const { data, error } = await supabase
    .from("poll_options")
    .select("votes")
    .eq("id", optionId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Option not found" },
      { status: 404 }
    );
  }

  const { error: updateError } = await supabase
    .from("poll_options")
    .update({
      votes: (data.votes ?? 0) + 1,
    })
    .eq("id", optionId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    pollId: id,
  });
}