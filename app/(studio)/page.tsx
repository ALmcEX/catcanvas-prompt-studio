import Link from "next/link";
import { chains, runs } from "@/lib/data";
import { Heading, History, Notices, Empty } from "@/components/shared";
import { createExample } from "@/app/actions";
import { Submit } from "@/components/forms";
export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const [all, history, p] = await Promise.all([chains(), runs(), searchParams]);
  return (
    <>
      <Heading
        title="One idea leads to another"
        description="Build a chain. See every prompt. Turn its final output into media."
      >
        <Link className="button" href="/chains?new=1">
          + Create chain
        </Link>
      </Heading>
      <Notices {...p} />
      <section className="stats">
        <div>
          <span>ACTIVE CHAINS</span>
          <strong>{all.length}</strong>
        </div>
        <div>
          <span>RECENT RUNS</span>
          <strong>{history.length}</strong>
        </div>
        <div>
          <span>RECENT MEDIA</span>
          <strong>
            {history.filter((r) => r.status === "succeeded").length}
          </strong>
        </div>
      </section>
      <section className="panel intro">
        <div>
          <p className="eyebrow">START WITH A SIMPLE CHAIN</p>
          <h2>Look. Find the joke. Write the caption.</h2>
          <p className="muted">
            Try a three-step image-to-caption workflow, then make every prompt
            your own.
          </p>
          <div className="flow">
            <span>01 · Describe</span>
            <b>→</b>
            <span>02 · Find the joke</span>
            <b>→</b>
            <span>03 · Five captions</span>
          </div>
        </div>
        <form action={createExample}>
          <Submit className="button secondary">Create example chain ↗</Submit>
        </form>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Your chains</h2>
          <Link className="text-link" href="/chains">
            View all ↗
          </Link>
        </div>
        {all.length ? (
          <div className="chain-grid">
            {all.slice(0, 4).map((c, index) => (
              <Link className="chain-card" key={c.id} href={`/chains/${c.id}`}>
                <span className="eyebrow">Prompt chain {index + 1}</span>
                <h3>{c.name} ↗</h3>
                <p className="muted">
                  {c.description ||
                    "Open this chain to view its full prompts and steps."}
                </p>
                <small>Saved revision {c.version + 1}</small>
              </Link>
            ))}
          </div>
        ) : (
          <Empty>Create a chain to start connecting prompts.</Empty>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Recent runs</h2>
          <Link className="text-link" href="/runs">
            View history ↗
          </Link>
        </div>
        <History runs={history.slice(0, 5)} />
      </section>
      <p className="muted footnote">
        Counts reflect up to 100 active chains and the latest 50 runs.
      </p>
    </>
  );
}
