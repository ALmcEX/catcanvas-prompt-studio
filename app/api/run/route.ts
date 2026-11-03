import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  validateInput,
  uuidPattern,
  type Run,
  type StepResult,
} from "@/lib/chain";
import { executeChain } from "@/lib/executor";
import { generate } from "@/lib/provider";
import { normalizeImage, renderMedia } from "@/lib/media";
import { dbMessage } from "@/lib/data";
export const maxDuration = 300;
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const { client, user } = await requireAdmin();
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length") ?? 0) > 5 * 1024 * 1024)
    return NextResponse.json(
      { error: "The upload is too large." },
      { status: 413 },
    );
  let run: Run | undefined;
  let results: StepResult[] = [];
  try {
    if (!process.env.GEMINI_API_KEY)
      throw Error("Generation is not configured. Contact the project owner.");
    const form = await request.formData();
    const cid = form.get("chain_id");
    if (typeof cid !== "string" || !uuidPattern.test(cid))
      throw Error("Choose a valid chain.");
    const input = validateInput(form.get("input"));
    const file = form.get("image");
    let image: Buffer | undefined;
    if (file instanceof File && file.size) {
      if (file.size > 4194304) throw Error("Upload an image under 4 MB.");
      image = await normalizeImage(Buffer.from(await file.arrayBuffer()));
    }
    const { data, error } = await client.rpc("studio_begin_run", {
      p_chain_id: cid,
      p_input: input,
      p_has_image: !!image,
    });
    if (error) throw Error(dbMessage(error));
    run = data as Run;
    const record = async (
      status: string,
      error: string | null = null,
      path: string | null = null,
    ) => {
      const { error: e } = await client.rpc("studio_run_progress", {
        p_run: run!.id,
        p_results: results,
        p_status: status,
        p_error: error,
        p_output_path: path,
      });
      if (e) throw Error("Could not save run progress.");
    };
    await executeChain({
      steps: run.snapshot.steps,
      input,
      image: image ? { data: image, mimeType: "image/png" } : undefined,
      generate,
      onStep: async (next) => {
        results = next;
        await record("running");
      },
    });
    const media = await renderMedia(
      run.snapshot.chain.name,
      results.at(-1)!.output,
      image,
    );
    const path = `${user.id}/${run.id}/output.png`;
    const { error: uploadError } = await client.storage
      .from("prompt-studio-media")
      .upload(path, media, { contentType: "image/png", upsert: false });
    if (uploadError)
      throw Error(
        "The chain finished, but its PNG could not be saved. Outputs are retained below.",
      );
    await record("succeeded", null, path);
    return NextResponse.json({ id: run.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed. Try again.";
    if (run) {
      await client.rpc("studio_run_progress", {
        p_run: run.id,
        p_results: results,
        p_status: "failed",
        p_error: message,
        p_output_path: null,
      });
      return NextResponse.json({ id: run.id });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
