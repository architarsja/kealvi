// Feature 0, Beat 2 — questions live in a variable on the server, shared by
// every browser that hits this route. Seeded with two so the list isn't empty.
// Restart the dev server and they're gone: server memory forgets too.
let questions = [
  { id: "1", body: "How do I deploy to Vercel?" },
  { id: "2", body: "What's the difference between server and client components?" },
];

export async function GET() {
  return Response.json(questions);
}

export async function POST(req: Request) {
  const { body } = await req.json();
  const question = { id: crypto.randomUUID(), body };
  questions = [question, ...questions];
  return Response.json(question);
}
