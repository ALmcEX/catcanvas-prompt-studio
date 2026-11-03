import { it, expect } from "vitest";
import { executeChain } from "../lib/executor";
import { MODEL, type Step, type StepResult } from "../lib/chain";
const steps: Step[] = [
  {
    id: "aa880000-0000-4000-8000-000000000001",
    position: 1,
    name: "Describe",
    prompt: "Describe {{input}}",
    model: MODEL,
    use_image: true,
  },
  {
    id: "aa880000-0000-4000-8000-000000000002",
    position: 2,
    name: "Caption",
    prompt: "Caption {{previous}}",
    model: MODEL,
    use_image: false,
  },
];
it("executes in order, passes image only when requested, records actual prompts", async () => {
  const calls: string[] = [];
  const image = { data: new Uint8Array([1]), mimeType: "image/png" };
  const results = await executeChain({
    steps,
    input: "cat",
    image,
    generate: async (args) => {
      calls.push(args.prompt);
      expect(args.image).toBe(calls.length === 1 ? image : undefined);
      return calls.length === 1 ? "sleepy cat" : "Coffee first.";
    },
    onStep: async () => {},
  });
  expect(calls).toEqual(["Describe cat", "Caption sleepy cat"]);
  expect(results[1].prompt).toBe("Caption sleepy cat");
  expect(results[1].output).toBe("Coffee first.");
});
it("retains finished steps and never calls subsequent steps after a failure", async () => {
  let calls = 0;
  let saved: StepResult[] = [];
  await expect(
    executeChain({
      steps,
      input: "cat",
      generate: async () => {
        if (++calls === 2) throw Error("Provider unavailable");
        return "description";
      },
      onStep: async (results) => {
        saved = results;
      },
    }),
  ).rejects.toThrow("Provider unavailable");
  expect(calls).toBe(2);
  expect(saved).toHaveLength(1);
  expect(saved[0].output).toBe("description");
});
it("rejects empty output", async () => {
  await expect(
    executeChain({
      steps,
      input: "cat",
      generate: async () => "",
      onStep: async () => {},
    }),
  ).rejects.toThrow(/empty/);
});
