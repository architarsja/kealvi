import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("polls")
    .select(
      `
      *,
      poll_options (*)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json({
    polls: data || [],
  });
}

export async function POST(req: Request) {
  try {
    const {
      title,
      question,
      options,
    } = await req.json();

    if (
      !title ||
      !question ||
      !options ||
      !Array.isArray(options) ||
      options.length < 2
    ) {
      return Response.json(
        {
          error:
            "Title, question and at least 2 options are required",
        },
        { status: 400 }
      );
    }

    const { data: poll, error: pollError } =
      await supabase
        .from("polls")
        .insert({
          title,
          question,
        })
        .select()
        .single();

    if (pollError) {
      console.error(
        "Poll Error:",
        pollError
      );

      return Response.json(
        { error: pollError.message },
        { status: 500 }
      );
    }

    const optionRows = options
      .filter(
        (option: string) =>
          option &&
          option.trim() !== ""
      )
      .map((option: string) => ({
        poll_id: poll.id,
        option_text: option.trim(),
      }));

    const {
      error: optionError,
    } = await supabase
      .from("poll_options")
      .insert(optionRows);

    if (optionError) {
      console.error(
        "Option Error:",
        optionError
      );

      return Response.json(
        { error: optionError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      poll,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Failed to create poll",
      },
      { status: 500 }
    );
  }
}