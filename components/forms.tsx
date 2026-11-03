"use client";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function Submit({
  children,
  className = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={disabled || pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}
export function RunForm({
  chainId,
  disabled,
}: {
  chainId: string;
  disabled: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const form = event.currentTarget;
        const data = new FormData(form);
        const file = data.get("image");
        if (file instanceof File && file.size > 4194304) {
          setError("Upload an image under 4 MB.");
          return;
        }
        setBusy(true);
        try {
          const response = await fetch("/api/run", {
            method: "POST",
            body: data,
          });
          const result = await response.json();
          if (!response.ok || !result.id)
            throw Error(result.error || "Could not start the chain.");
          router.push(`/runs/${result.id}`);
          router.refresh();
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Could not connect. Check run history before retrying.",
          );
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="chain_id" value={chainId} />
      <label>
        Initial input
        <textarea
          name="input"
          required
          maxLength={4000}
          rows={3}
          placeholder="Describe your idea or what you want the chain to do."
          disabled={busy}
        />
      </label>
      <label>
        Optional image
        <input
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
        />
      </label>
      <p className="muted">
        PNG, JPEG or WebP · Max 4 MB. Image-enabled steps receive this image.
        The final text and optional image become a downloadable PNG caption
        card.
      </p>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <button className="button" disabled={disabled || busy}>
        {busy ? "Running chain…" : "Run chain & generate PNG ↗"}
      </button>
      {busy && (
        <p role="status" className="notice">
          Running steps in order. This can take a few minutes. Keep this tab
          open; completed outputs are saved in Run history.
        </p>
      )}
      <small className="muted">
        PNG cards show up to 1,200 characters; the full text remains in run
        details. One active run and up to 10 runs per hour.
      </small>
    </form>
  );
}
