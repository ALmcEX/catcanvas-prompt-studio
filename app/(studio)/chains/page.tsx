import Link from "next/link";
import { chains } from "@/lib/data";
import { saveChain, createExample } from "@/app/actions";
import { Submit } from "@/components/forms";
import { Heading, Notices, Empty } from "@/components/shared";
export default async function Chains({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    q?: string;
    error?: string;
    notice?: string;
  }>;
}) {
  const [all, p] = await Promise.all([chains(), searchParams]);
  const filtered = all.filter((c) =>
    `${c.name} ${c.description}`
      .toLowerCase()
      .includes((p.q ?? "").toLowerCase()),
  );
  return (
    <>
      <Heading
        title="Prompt chains"
        description="Open a chain to see every step and the complete prompt it uses."
      />
      <Notices {...p} />
      <section className="panel">
        <details open={p.new === "1"}>
          <summary className="create-summary">+ Create a prompt chain</summary>
          <form action={saveChain} className="stack form-width">
            <label>
              Chain name
              <input
                name="name"
                required
                maxLength={120}
                placeholder="Give this workflow a name"
              />
            </label>
            <label>
              Description
              <textarea name="description" maxLength={2000} rows={3} />
            </label>
            <Submit>Create chain</Submit>
          </form>
        </details>
      </section>
      <div className="list-toolbar">
        <form className="search">
          <input
            name="q"
            defaultValue={p.q}
            placeholder="Search chains"
            aria-label="Search chains"
          />
          <button className="button secondary">Search</button>
        </form>
        <form action={createExample}>
          <Submit className="button secondary">Create example chain ↗</Submit>
        </form>
      </div>
      {filtered.length ? (
        <div className="chain-grid">
          {filtered.map((c) => (
            <Link href={`/chains/${c.id}`} key={c.id} className="chain-card">
              <span className="eyebrow">PROMPT CHAIN</span>
              <h2>{c.name} ↗</h2>
              <p className="muted">{c.description || "No description yet."}</p>
              <small>Version {c.version + 1} · View full prompts</small>
            </Link>
          ))}
        </div>
      ) : (
        <Empty>No matching chains. Create one above or try the example.</Empty>
      )}
      <p className="muted footnote">
        Showing up to 100 recently updated active chains.
      </p>
    </>
  );
}
