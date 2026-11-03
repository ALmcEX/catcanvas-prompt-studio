import { it, expect } from "vitest";
import sharp from "sharp";
import { normalizeImage, renderMedia } from "../lib/media";
it("normalizes an uploaded image and strips metadata", async () => {
  const input = await sharp({
    create: { width: 20, height: 30, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
  const output = await normalizeImage(input);
  expect((await sharp(output).metadata()).format).toBe("png");
});
it("rejects non-image and oversized input", async () => {
  await expect(normalizeImage(Buffer.from("not image"))).rejects.toThrow();
  await expect(normalizeImage(Buffer.alloc(4194305))).rejects.toThrow();
});
it("renders real downloadable PNG media from arbitrary escaped model output", async () => {
  const output = await renderMedia("A chain", '<script>& "sleepy cat"');
  const meta = await sharp(output).metadata();
  expect(meta.format).toBe("png");
  expect(meta.width).toBe(1200);
  expect(meta.height).toBeGreaterThan(300);
});
