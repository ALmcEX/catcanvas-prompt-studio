import Link from "next/link";
import { notFound } from "next/navigation";
import { chain, runs } from "@/lib/data";
import { uuidPattern, MODEL } from "@/lib/chain";
import {
  saveChain,
  deleteChain,
  saveStep,
  deleteStep,
  moveStep,
} from "@/app/actions";
import { Heading, History, Notices } from "@/components/shared";
import { Submit, RunForm } from "@/components/forms";
function Fields({
  id,
  version,
  stepId,
}: {
  id: string;
  version: number;
  stepId?: string;
}) {
  return (
    <>
      <input type="hidden" name="chain_id" value={id} />
      <input type="hidden" name="version" value={version} />
      {stepId && <input type="hidden" name="step_id" value={stepId} />}
    </>
  );
}
export default async function ChainPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const [data, history, p] = await Promise.all([
    chain(id),
    runs(id),
    searchParams,
  ]);
  if (!data) notFound();
  const { chain: c, steps } = data;
  return (
    <>
      <Link className="text-link back" href="/chains">
        ← All prompt chains
      </Link>
      <Heading
        title={c.name}
        description={
          c.description || "Build this workflow one prompt at a time."
        }
      />
      <Notices {...p} />
      {c.deleted_at ? (
        <p className="notice">
          This chain was deleted. Its saved runs and prompt snapshots remain
          available below.
        </p>
      ) : (
        <>
          <section className="panel">
            <details>
              <summary className="create-summary">
                Chain settings · Version {c.version + 1}
              </summary>
              <form action={saveChain} className="stack form-width">
                <Fields id={id} version={c.version} />
                <label>
                  Name
                  <input
                    name="name"
                    defaultValue={c.name}
                    maxLength={120}
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    name="description"
                    defaultValue={c.description}
                    maxLength={2000}
                  />
                </label>
                <Submit>Save chain</Submit>
              </form>
            </details>
          </section>
          <section className="panel variable-guide">
            <h2>How prompts connect</h2>
            <p>
              Write a complete prompt for each step. Use these variables to
              include input or earlier outputs:
            </p>
            <div className="variable-list">
              <code>{"{{input}}"}</code>
              <span>Initial input from the run form</span>
              <code>{"{{previous}}"}</code>
              <span>Previous step output; initial input in the first step</span>
              <code>{"{{step:STEP_ID}}"}</code>
              <span>
                A specific earlier step’s output (copy its reference below)
              </span>
            </div>
            <p className="muted">
              Steps run from top to bottom. Reordering or deleting a referenced
              step is blocked if it would break a prompt.
            </p>
          </section>
          <div className="section-heading">
            <h2>
              Chain steps <span className="muted">{steps.length} / 12</span>
            </h2>
            <span className="muted">Full prompt content is shown below</span>
          </div>
          {steps.map((step, index) => (
            <article className="panel step" key={step.id}>
              <div className="step-header">
                <span className="step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2>{step.name}</h2>
                  <small className="muted">
                    {step.model}
                    {step.use_image
                      ? " · Includes uploaded image when provided"
                      : " · Text"}
                  </small>
                </div>
                <div className="move-controls">
                  {(["up", "down"] as const).map((direction) => (
                    <form key={direction} action={moveStep}>
                      <Fields id={id} version={c.version} stepId={step.id} />
                      <input type="hidden" name="direction" value={direction} />
                      <button
                        className="icon-button"
                        disabled={
                          direction === "up"
                            ? index === 0
                            : index === steps.length - 1
                        }
                        aria-label={`Move ${step.name} ${direction}`}
                        title={`Move ${direction}`}
                      >
                        {direction === "up" ? "↑" : "↓"}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
              <p className="eyebrow">FULL PROMPT TEMPLATE</p>
              <pre className="prompt">{step.prompt}</pre>
              <p className="reference">
                Reference this output: <code>{`{{step:${step.id}}}`}</code>
              </p>
              <details className="edit-details">
                <summary>Edit step & prompt</summary>
                <form action={saveStep} className="stack">
                  <Fields id={id} version={c.version} stepId={step.id} />
                  <label>
                    Step name
                    <input
                      name="name"
                      defaultValue={step.name}
                      required
                      maxLength={120}
                    />
                  </label>
                  <label>
                    Complete prompt
                    <textarea
                      className="prompt-editor"
                      name="prompt"
                      defaultValue={step.prompt}
                      required
                      maxLength={8000}
                      rows={7}
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      name="use_image"
                      defaultChecked={step.use_image}
                    />
                    Include the uploaded image when one is provided
                  </label>
                  <p className="muted">Model: {MODEL}</p>
                  <Submit>Save step</Submit>
                </form>
              </details>
              <details className="danger-details">
                <summary>Delete this step</summary>
                <form action={deleteStep} className="stack">
                  <Fields id={id} version={c.version} stepId={step.id} />
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      name="confirmation"
                      value="yes"
                      required
                    />
                    Remove this step from future runs. Previous run snapshots
                    stay available.
                  </label>
                  <Submit className="button danger">Delete step</Submit>
                </form>
              </details>
            </article>
          ))}
          {steps.length < 12 && (
            <section className="panel">
              <details open={!steps.length}>
                <summary className="create-summary">
                  + Add a prompt chain step
                </summary>
                <form action={saveStep} className="stack">
                  <Fields id={id} version={c.version} />
                  <label>
                    Step name
                    <input
                      name="name"
                      required
                      maxLength={120}
                      placeholder="e.g. Find the visual joke"
                    />
                  </label>
                  <label>
                    Complete prompt
                    <textarea
                      className="prompt-editor"
                      name="prompt"
                      required
                      maxLength={8000}
                      rows={6}
                      placeholder="Write a short, funny caption based on: {{previous}}"
                    />
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" name="use_image" />
                    Include the uploaded image when one is provided
                  </label>
                  <p className="muted">Model: {MODEL}</p>
                  <Submit>Add step</Submit>
                </form>
              </details>
            </section>
          )}
          <section className="panel run-panel">
            <p className="eyebrow">BRING THIS CHAIN TO LIFE</p>
            <h2>Run & generate media</h2>
            {!steps.length && (
              <p className="notice">Add at least one step first.</p>
            )}
            <RunForm chainId={id} disabled={!steps.length} />
          </section>
        </>
      )}
      <section className="panel">
        <div className="section-heading">
          <h2>Runs for this chain</h2>
          <Link className="text-link" href={`/media?chain=${id}`}>
            View generated media ↗
          </Link>
        </div>
        <History runs={history} />
        <p className="muted footnote">
          Latest 50 runs. Each keeps the exact prompts used at that time.
        </p>
      </section>
      {!c.deleted_at && (
        <section className="panel">
          <details className="danger-details">
            <summary>Delete prompt chain</summary>
            <form action={deleteChain} className="stack form-width">
              <Fields id={id} version={c.version} />
              <p>
                Remove the chain from the active list. Existing media and run
                history remain available.
              </p>
              <label>
                Type DELETE to confirm
                <input
                  name="confirmation"
                  required
                  pattern="DELETE"
                  autoComplete="off"
                />
              </label>
              <Submit className="button danger">Delete chain</Submit>
            </form>
          </details>
        </section>
      )}
    </>
  );
}
