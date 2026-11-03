/* eslint-disable @next/next/no-img-element -- Session-protected media intentionally bypasses the public image optimizer. */
import Link from "next/link";
import { runs, date } from "@/lib/data";
import { Heading, Empty } from "@/components/shared";
export default async function Media({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const p = await searchParams;
  const all = await runs();
  const choices = [
    ...new Map(all.map((r) => [r.chain_id, r.snapshot.chain.name])).entries(),
  ];
  const history = p.chain ? await runs(p.chain) : all;
  const media = history.filter(
    (r) => r.status === "succeeded" && r.output_path,
  );
  return (
    <>
      <Heading
        title="Generated media"
        description="PNG caption cards produced by your prompt chains. Open a run to inspect the exact prompts."
      />
      <form className="filter panel">
        <label>
          Filter by prompt chain
          <select name="chain" defaultValue={p.chain ?? ""}>
            <option value="">All chains</option>
            {choices.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary">Apply filter</button>
      </form>
      {media.length ? (
        <div className="media-grid">
          {media.map((r) => (
            <article className="panel media-card" key={r.id}>
              <Link href={`/runs/${r.id}`}>
                <img
                  src={`/api/media/${r.id}`}
                  alt={`PNG card from ${r.snapshot.chain.name}`}
                  loading="lazy"
                />
              </Link>
              <div className="stack">
                <h2>{r.snapshot.chain.name}</h2>
                <small className="muted">{date(r.created_at)}</small>
                <Link className="text-link" href={`/runs/${r.id}`}>
                  View prompts & run ↗
                </Link>
                <a href={`/api/media/${r.id}?download=1`} className="text-link">
                  Download PNG ↓
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty>
          No generated media for this selection yet. Run a chain to create a
          PNG.
        </Empty>
      )}
      <p className="muted footnote">
        Showing media from the latest 50 runs for the selected chain, or the
        latest 50 overall.
      </p>
    </>
  );
}
