import "server-only";
import { requireAdmin } from "./auth";
import type { Chain, Step, Run } from "./chain";
export function dbMessage(error: { code?: string; message?: string }) {
  if (error.code === "40001")
    return "This chain changed in another tab. Reload and try again.";
  const text = error.message ?? "";
  if (
    /^(A chain|A prompt|Run limit|Add at least|Chain not found|Reorder must|A chain is already)/.test(
      text,
    )
  )
    return text;
  return "The change could not be saved. Check the fields and try again.";
}
export async function chains() {
  const { client } = await requireAdmin();
  const { data, error } = await client
    .from("studio_chains")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error)
    throw Error("Could not load chains. Verify the database migration.");
  return data as Chain[];
}
export async function chain(id: string) {
  const { client } = await requireAdmin();
  const { data, error } = await client
    .from("studio_chains")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw Error("Could not load the chain.");
  if (!data) return null;
  const { data: steps, error: stepError } = await client
    .from("studio_steps")
    .select("*")
    .eq("chain_id", id)
    .order("position");
  if (stepError) throw Error("Could not load chain steps.");
  return { chain: data as Chain, steps: steps as Step[] };
}
export async function runs(chainId?: string) {
  const { client } = await requireAdmin();
  let query = client
    .from("studio_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (chainId) query = query.eq("chain_id", chainId);
  const { data, error } = await query;
  if (error) throw Error("Could not load run history.");
  return data as Run[];
}
export async function run(id: string) {
  const { client } = await requireAdmin();
  const { data, error } = await client
    .from("studio_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw Error("Could not load this run.");
  return data as Run | null;
}
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
