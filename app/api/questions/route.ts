import { supabase } from "@/lib/supabase";
import { getQuestions, searchQuestions } from "@/lib/questions";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (q) {
    const questions = await searchQuestions(q, PAGE_SIZE);

    return Response.json({
      questions,
      hasMore: false,
    });
  }

  const offset = Number(searchParams.get("offset") ?? 0);

  const { questions, hasMore } =
    await getQuestions(offset, PAGE_SIZE);

  return Response.json({
    questions,
    hasMore,
  });
}

export async function POST(req: Request) {
  const { body, author } = await req.json();

  const res = await fetch(
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ta&dt=t&q=" +
    encodeURIComponent(body)
);

  const taData = await res.json();
  const tamil = taData[0].map((t: any) => t[0]).join("");

  const res2 = await fetch(
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=" +
    encodeURIComponent(body)
);

  const hiData = await res2.json();
  const hindi = hiData[0].map((t: any) => t[0]).join("");

  // ADD THESE LINES HERE
  console.log("English:", body);
  console.log("Tamil:", tamil);
  console.log("Hindi:", hindi);

  const { data, error } = await supabase
    .from("questions")
    .insert({
      body,
      body_ta: tamil,
      body_hi: hindi,
      author,
    })
    .select()
    .single();

  if (error) {
    console.log("Supabase Error:", error);

    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json(data);
}