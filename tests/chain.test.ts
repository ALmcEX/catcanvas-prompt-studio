import { describe, it, expect } from "vitest";
import {
  validateSteps,
  resolvePrompt,
  validateInput,
  type Step,
  type StepResult,
} from "../lib/chain";
const a = "aa880000-0000-4000-8000-000000000001",
  b = "aa880000-0000-4000-8000-000000000002";
const steps: Step[] = [
  {
    id: a,
    position: 1,
    name: "Describe",
    prompt: "Describe {{input}}",
    model: "gemini-3.1-flash-lite",
    use_image: true,
  },
  {
    id: b,
    position: 2,
    name: "Caption",
    prompt: `Use {{previous}} and {{step:${a}}}`,
    model: "gemini-3.1-flash-lite",
    use_image: false,
  },
];
describe("prompt dependencies", () => {
  it("accepts prior step references", () =>
    expect(() => validateSteps(steps)).not.toThrow());
  it("rejects reordered forward references", () =>
    expect(() => validateSteps([steps[1], steps[0]])).toThrow(/earlier/));
  it("rejects unknown and malformed placeholders", () => {
    for (const prompt of ["{{secret}}", "{{input", "{{step:bad}}"])
      expect(() => validateSteps([{ ...steps[0], prompt }])).toThrow();
  });
  it("substitutes once and preserves provider output literally", () => {
    const results: StepResult[] = [
      {
        id: a,
        name: "Describe",
        prompt: "Describe cat",
        output: "literal {{input}}",
        model: "test",
        duration_ms: 1,
      },
    ];
    expect(resolvePrompt(steps[1], steps, results, "cat")).toBe(
      "Use literal {{input}} and literal {{input}}",
    );
  });
  it("uses initial input for previous in the first step", () =>
    expect(
      resolvePrompt({ ...steps[0], prompt: "{{previous}}" }, steps, [], "cat"),
    ).toBe("cat"));
  it("rejects absent step outputs", () =>
    expect(() => resolvePrompt(steps[1], steps, [], "cat")).toThrow(/output/));
  it("limits count and prompt length", () => {
    expect(() =>
      validateSteps(Array.from({ length: 13 }, () => steps[0])),
    ).toThrow();
    expect(() =>
      validateSteps([{ ...steps[0], prompt: "x".repeat(8001) }]),
    ).toThrow();
  });
  it("validates user input", () => {
    expect(validateInput(" cat ")).toBe("cat");
    for (const value of ["", {}, "x".repeat(4001)])
      expect(() => validateInput(value)).toThrow();
  });
});
