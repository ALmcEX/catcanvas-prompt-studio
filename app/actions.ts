"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { chain, dbMessage } from "@/lib/data";
import { MODEL, validateSteps, uuidPattern } from "@/lib/chain";
const value = (f: FormData, k: string) =>
  typeof f.get(k) === "string" ? String(f.get(k)) : "";
async function mutation(
  id: string | null,
  version: number | null,
  action: string,
  data: Record<string, unknown>,
) {
  const { client } = await requireAdmin();
  const { data: result, error } = await client.rpc("studio_mutate", {
    p_chain_id: id,
    p_version: version,
    p_action: action,
    p_data: data,
  });
  if (error) throw Error(dbMessage(error));
  revalidatePath("/", "layout");
  return result as { id: string; version: number };
}
function revision(f: FormData) {
  const n = Number(value(f, "version"));
  if (!Number.isSafeInteger(n) || n < 0 || !value(f, "version"))
    throw Error("Reload this page before saving.");
  return n;
}
function id(f: FormData) {
  const id = value(f, "chain_id");
  if (!uuidPattern.test(id)) throw Error("Invalid chain.");
  return id;
}
function fail(path: string, error: unknown): never {
  redirect(
    `${path}?error=${encodeURIComponent(error instanceof Error ? error.message : "The operation failed.")}`,
  );
}
export async function saveChain(f: FormData) {
  await requireAdmin();
  let target = "/";
  try {
    const existing = value(f, "chain_id");
    target = existing ? `/chains/${existing}` : "/";
    const name = value(f, "name").trim(),
      description = value(f, "description").trim();
    if (!name || name.length > 120 || description.length > 2000)
      throw Error(
        "Enter a chain name up to 120 characters and a description up to 2,000.",
      );
    const result = await mutation(
      existing ? id(f) : null,
      existing ? revision(f) : null,
      existing ? "update" : "create",
      { name, description },
    );
    target = `/chains/${result.id}`;
  } catch (error) {
    fail(target, error);
  }
  redirect(`${target}?notice=saved`);
}
export async function deleteChain(f: FormData) {
  await requireAdmin();
  const cid = id(f);
  try {
    if (value(f, "confirmation") !== "DELETE")
      throw Error("Type DELETE to remove this chain.");
    await mutation(cid, revision(f), "delete", {});
  } catch (error) {
    fail(`/chains/${cid}`, error);
  }
  redirect("/?notice=deleted");
}
export async function saveStep(f: FormData) {
  await requireAdmin();
  const cid = id(f);
  try {
    const current = await chain(cid);
    if (!current || current.chain.deleted_at) throw Error("Chain not found.");
    const sid = value(f, "step_id");
    if (sid && !uuidPattern.test(sid)) throw Error("Invalid step.");
    const step = {
      id: sid || randomUUID(),
      position: current.steps.length + 1,
      name: value(f, "name").trim(),
      prompt: value(f, "prompt"),
      model: MODEL,
      use_image: value(f, "use_image") === "on",
    };
    const next = sid
      ? current.steps.map((s) =>
          s.id === sid ? { ...step, position: s.position } : s,
        )
      : [...current.steps, step];
    validateSteps(next);
    await mutation(cid, revision(f), sid ? "update_step" : "add_step", {
      ...step,
      id: sid || undefined,
    });
  } catch (error) {
    fail(`/chains/${cid}`, error);
  }
  redirect(`/chains/${cid}?notice=saved`);
}
export async function deleteStep(f: FormData) {
  await requireAdmin();
  const cid = id(f);
  try {
    if (value(f, "confirmation") !== "yes")
      throw Error("Confirm step deletion.");
    await mutation(cid, revision(f), "delete_step", {
      id: value(f, "step_id"),
    });
  } catch (error) {
    fail(`/chains/${cid}`, error);
  }
  redirect(`/chains/${cid}?notice=deleted`);
}
export async function moveStep(f: FormData) {
  await requireAdmin();
  const cid = id(f);
  try {
    const current = await chain(cid);
    if (!current) throw Error("Chain not found.");
    const ids = current.steps.map((s) => s.id),
      index = ids.indexOf(value(f, "step_id"));
    const direction = value(f, "direction");
    if (index < 0 || !["up", "down"].includes(direction))
      throw Error("Invalid reorder.");
    const next = index + (direction === "up" ? -1 : 1);
    if (next < 0 || next >= ids.length)
      throw Error("This step is already at the edge.");
    [ids[index], ids[next]] = [ids[next], ids[index]];
    await mutation(cid, revision(f), "reorder", { ids });
  } catch (error) {
    fail(`/chains/${cid}`, error);
  }
  redirect(`/chains/${cid}?notice=reordered`);
}
export async function createExample() {
  await requireAdmin();
  let target = "/";
  try {
    const c = await mutation(null, null, "create", {
      name: "Image to funny captions",
      description:
        "Describe an uploaded image, find its visual joke, and write five short captions. The final output becomes a downloadable PNG.",
    });
    target = `/chains/${c.id}`;
    const prompts = [
      {
        name: "Describe the image",
        prompt:
          "Describe the uploaded image in concrete, visible detail. If no image is provided, describe the scene in the initial input. Initial input: {{input}}",
        use_image: true,
      },
      {
        name: "Find the joke",
        prompt:
          "Find one funny, relatable observation based on this description. Keep it kind and specific. Return only the observation. Description: {{previous}}",
        use_image: false,
      },
      {
        name: "Write five captions",
        prompt:
          "Write five distinct, short, funny captions inspired by this observation. Use a numbered list, at most 12 words per caption. Observation: {{previous}}",
        use_image: false,
      },
    ];
    for (let i = 0; i < prompts.length; i++)
      await mutation(c.id, i, "add_step", prompts[i]);
  } catch (error) {
    fail(target, error);
  }
  redirect(target);
}
