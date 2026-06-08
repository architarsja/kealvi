import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { title, question, options } = await req.json();

  // 1. Validate input
  if (!title || !question || !options?.length) {
    return Response.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  // 2. Create poll
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      title,
      question,
    })
    .select()
    .single();

  if (pollError || !poll) {
    console.log("Poll Error:", pollError);

    return Response.json(
      { error: pollError?.message || "Poll creation failed" },
      { status: 500 }
    );
  }

  // 3. IMPORTANT FIX → poll.id must exist
  if (!poll.id) {
    return Response.json(
      { error: "Poll ID missing after insert" },
      { status: 500 }
    );
  }

  // 4. Insert options (THIS IS WHERE YOUR ERROR HAPPENS)
  const optionRows = options
    .filter((opt: string) => opt?.trim())
    .map((opt: string) => ({
      poll_id: poll.id, // MUST MATCH DB COLUMN NAME
      option_text: opt.trim(),
    }));

  const { error: optionError } = await supabase
    .from("poll_options")
    .insert(optionRows);

  if (optionError) {
    console.log("Option Error:", optionError);

    return Response.json(
      { error: optionError.message },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    poll,
  });
}