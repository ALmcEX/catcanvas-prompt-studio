export type Step = {
  id: string;
  position: number;
  name: string;
  prompt: string;
  model: string;
  use_image: boolean;
};
export type StepResult = {
  id: string;
  name: string;
  prompt: string;
  output: string;
  model: string;
  duration_ms: number;
};
export type Chain = {
  id: string;
  name: string;
  description: string;
  version: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};
export type Run = {
  id: string;
  chain_id: string;
  created_by: string;
  input: string;
  has_image: boolean;
  status: "running" | "succeeded" | "failed";
  snapshot: { chain: Chain; steps: Step[] };
  results: StepResult[];
  error: string | null;
  output_path: string | null;
  created_at: string;
  finished_at: string | null;
};
export const MODEL = "gemini-3.1-flash-lite";
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateInput(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    [...value.trim()].length > 4000
  )
    throw new Error("Enter an input between 1 and 4,000 characters.");
  return value.trim();
}
function tokens(prompt: string) {
  const found = [...prompt.matchAll(/\{\{([^{}]+)\}\}/g)].map((m) => m[1]);
  if (
    prompt.replace(/\{\{([^{}]+)\}\}/g, "").includes("{{") ||
    prompt.replace(/\{\{([^{}]+)\}\}/g, "").includes("}}")
  )
    throw new Error("Close each prompt variable with }}.");
  return found;
}
export function validateSteps(steps: Step[]): void {
  if (!steps.length || steps.length > 12)
    throw new Error("A chain needs between 1 and 12 steps.");
  const seen = new Set<string>();
  for (const step of steps) {
    if (
      !uuidPattern.test(step.id) ||
      seen.has(step.id) ||
      !step.name.trim() ||
      step.name.length > 120 ||
      !step.prompt.trim() ||
      [...step.prompt].length > 8000 ||
      step.model !== MODEL
    )
      throw new Error("Check the step name, prompt length and model.");
    for (const token of tokens(step.prompt)) {
      if (token === "input" || token === "previous") continue;
      if (!token.startsWith("step:") || !uuidPattern.test(token.slice(5)))
        throw new Error(`Unknown prompt variable: {{${token}}}`);
      if (!seen.has(token.slice(5)))
        throw new Error("A prompt can only reference an earlier step.");
    }
    seen.add(step.id);
  }
}
export function resolvePrompt(
  step: Step,
  steps: Step[],
  results: StepResult[],
  input: string,
): string {
  const index = steps.findIndex((s) => s.id === step.id);
  const prompt = step.prompt.replace(
    /\{\{([^{}]+)\}\}/g,
    (_, token: string) => {
      if (token === "input") return input;
      const id =
        token === "previous"
          ? index === 0
            ? null
            : steps[index - 1].id
          : token.slice(5);
      if (token === "previous" && id === null) return input;
      const result = results.find((r) => r.id === id);
      if (!result) throw new Error("A required step output is missing.");
      return result.output;
    },
  );
  if (prompt.length > 40000)
    throw new Error(
      "The expanded prompt is too long. Shorten an earlier output or the template.",
    );
  return prompt;
}
