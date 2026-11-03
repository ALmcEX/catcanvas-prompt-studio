import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uuidPattern } from "@/lib/chain";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { client } = await requireAdmin();
  const { id } = await params;
  if (!uuidPattern.test(id)) return new Response("Not found", { status: 404 });
  const { data: run } = await client
    .from("studio_runs")
    .select("output_path,status")
    .eq("id", id)
    .maybeSingle();
  if (!run?.output_path || run.status !== "succeeded")
    return new Response("Not found", { status: 404 });
  const { data, error } = await client.storage
    .from("prompt-studio-media")
    .download(run.output_path);
  if (error || !data) return new Response("Media unavailable", { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${request.nextUrl.searchParams.has("download") ? "attachment" : "inline"}; filename="prompt-chain-${id}.png"`,
    },
  });
}
