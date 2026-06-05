import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { optionId } = await req.json();

  const { data } = await supabase
    .from("poll_options")
    .select("votes")
    .eq("id", optionId)
    .single();

  await supabase
    .from("poll_options")
    .update({
      votes: data!.votes + 1
    })
    .eq("id", optionId);

  return NextResponse.json({
    success: true,
  });
}