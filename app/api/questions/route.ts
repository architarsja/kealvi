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

  // Translate to English
const resEn = await fetch(
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" +
    encodeURIComponent(body)
);

const enData = await resEn.json();
const english = enData[0].map((t: any) => t[0]).join("");

// Translate to Tamil
const resTa = await fetch(
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ta&dt=t&q=" +
    encodeURIComponent(body)
);

const taData = await resTa.json();
const tamil = taData[0].map((t: any) => t[0]).join("");

// Translate to Hindi
const resHi = await fetch(
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=" +
    encodeURIComponent(body)
);

const hiData = await resHi.json();
const hindi = hiData[0].map((t: any) => t[0]).join("");

const { data, error } = await supabase
  .from("questions")
  .insert({
    body:english,
    body_en: english,
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