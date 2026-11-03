import "server-only";
import { MODEL } from "./chain";
import type { Generate } from "./executor";
export const generate: Generate = async ({ prompt, model, image }) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    throw new Error("Generation is not configured. Contact the project owner.");
  if (model !== MODEL) throw new Error("Unsupported model.");
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(18000),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                ...(image
                  ? [
                      {
                        inlineData: {
                          mimeType: image.mimeType,
                          data: Buffer.from(image.data).toString("base64"),
                        },
                      },
                    ]
                  : []),
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.8 },
        }),
      },
    );
  } catch {
    throw new Error(
      "The model request timed out or could not connect. Try again.",
    );
  }
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Provider quota reached. Try again later."
        : `The model request failed (HTTP ${response.status}).`,
    );
  const raw = await response.text();
  if (raw.length > 250000) throw new Error("The model response was too large.");
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error("The model returned an invalid response.");
  }
  const candidate = body.candidates?.[0];
  if (body.promptFeedback?.blockReason || candidate?.finishReason !== "STOP")
    throw new Error(
      "The model did not finish a usable response. Revise the prompt or try again.",
    );
  const output = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts
        .filter(
          (p: { thought?: boolean; text?: unknown }) =>
            !p.thought && typeof p.text === "string",
        )
        .map((p: { text: string }) => p.text)
        .join("")
    : "";
  if (!output.trim() || output.length > 16000)
    throw new Error("The model returned empty or oversized output.");
  return output.trim();
};
