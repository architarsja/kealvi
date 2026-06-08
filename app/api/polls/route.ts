import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { title, question, options } = await req.json();

  if (!title || !question || !Array.isArray(options)) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: poll, error: pollError } = await supabase
  .from("polls")
  .insert({
    title,
    question_id: question, // ✅ use the actual question id
  })
  .select()
  .single();

  if (pollError || !poll) {
    return Response.json(
      { error: pollError?.message },
      { status: 500 }
    );
  }

  const optionRows = options
    .filter((o: string) => o?.trim())
    .map((o: string) => ({
      poll_id: poll.id,
      option_text: o.trim(),
    }));

  const { error: optionError } = await supabase
    .from("poll_options")
    .insert(optionRows);

  if (optionError) {
    return Response.json(
      { error: optionError.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true, poll });
}