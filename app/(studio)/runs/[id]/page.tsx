/* eslint-disable @next/next/no-img-element -- Protected media must use the authenticated route without public optimizer caching. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { run, date } from "@/lib/data";
import { uuidPattern } from "@/lib/chain";
import { Heading } from "@/components/shared";
import { RefreshRun } from "@/components/refresh-run";
export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const data = await run(id);
  if (!data) notFound();
  return (
    <>
      <Link className="text-link back" href={`/chains/${data.chain_id}`}>
        ← {data.snapshot.chain.name}
      </Link>
      <Heading
        title="Follow the thought"
        description={`Run started ${date(data.created_at)} · Chain version ${data.snapshot.chain.version + 1}`}
      />
      <div className="run-meta">
        <span className={`badge ${data.status}`}>{data.status}</span>
        <span>
          {data.results.length} / {data.snapshot.steps.length} steps completed
        </span>
        {data.has_image && <span>Image input included</span>}
      </div>
      {data.status === "running" && (
        <>
          <RefreshRun />
          <p className="notice" role="status">
            This run is still active or was interrupted. Completed step outputs
            are retained. After five minutes without progress, starting a new
            run marks it as interrupted.
          </p>
        </>
      )}
      {data.error && (
        <p role="alert" className="notice error">
          {data.error}
        </p>
      )}
      <section className="panel">
        <h2>Initial input</h2>
        <pre className="prompt">{data.input}</pre>
      </section>
      {data.status === "succeeded" && data.output_path && (
        <section className="panel">
          <div className="section-heading">
            <h2>Generated media</h2>
            <a
              className="button secondary"
              href={`/api/media/${id}?download=1`}
            >
              Download PNG ↓
            </a>
          </div>
          <img
            className="generated-image"
            src={`/api/media/${id}`}
            alt={`Generated caption card from ${data.snapshot.chain.name}`}
          />
          <p className="muted footnote">
            PNG uses the final output, up to 1,200 characters. Complete outputs
            appear below.
          </p>
        </section>
      )}
      <div className="section-heading">
        <h2>Step prompts & outputs</h2>
        <span className="muted">Saved execution snapshot</span>
      </div>
      {data.snapshot.steps.map((step, index) => {
        const result = data.results.find((r) => r.id === step.id);
        return (
          <article className="panel" key={step.id}>
            <div className="step-header">
              <span className="step-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2>{step.name}</h2>
                <p className="muted">
                  {step.model}
                  {result
                    ? ` · ${result.duration_ms.toLocaleString()} ms`
                    : data.status === "failed"
                      ? " · Not completed"
                      : " · Waiting"}
                </p>
              </div>
            </div>
            <p className="eyebrow">SAVED PROMPT TEMPLATE</p>
            <pre className="prompt">{step.prompt}</pre>
            {result ? (
              <>
                <p className="eyebrow">ACTUAL PROMPT SENT TO THE MODEL</p>
                <pre className="prompt">{result.prompt}</pre>
                <p className="eyebrow">MODEL OUTPUT</p>
                <pre className="prompt output">{result.output}</pre>
              </>
            ) : (
              <p className="muted">
                No completed output was recorded for this step.
              </p>
            )}
          </article>
        );
      })}
    </>
  );
}
