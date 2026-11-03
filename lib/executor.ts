import {
  resolvePrompt,
  validateSteps,
  type Step,
  type StepResult,
} from "./chain";
export type InputImage = { data: Uint8Array; mimeType: string };
export type Generate = (input: {
  prompt: string;
  model: string;
  image?: InputImage;
}) => Promise<string>;
export async function executeChain({
  steps,
  input,
  image,
  generate,
  onStep,
}: {
  steps: Step[];
  input: string;
  image?: InputImage;
  generate: Generate;
  onStep: (results: StepResult[]) => Promise<void>;
}): Promise<StepResult[]> {
  validateSteps(steps);
  const results: StepResult[] = [];
  for (const step of steps) {
    const prompt = resolvePrompt(step, steps, results, input);
    const start = Date.now();
    const attempt: StepResult = {
      id: step.id,
      name: step.name,
      prompt,
      output: "",
      model: step.model,
      duration_ms: 0,
      status: "running",
    };
    results.push(attempt);
    await onStep([...results]);
    try {
      const output = await generate({
        prompt,
        model: step.model,
        image: step.use_image ? image : undefined,
      });
      if (!output.trim() || output.length > 16000)
        throw new Error("The model returned empty or oversized output.");
      Object.assign(attempt, {
        output,
        duration_ms: Date.now() - start,
        status: "succeeded",
      });
    } catch (error) {
      Object.assign(attempt, {
        status: "failed",
        error: error instanceof Error ? error.message : "Model request failed.",
        duration_ms: Date.now() - start,
      });
      await onStep([...results]);
      throw error;
    }
    await onStep([...results]);
  }
  return results;
}
