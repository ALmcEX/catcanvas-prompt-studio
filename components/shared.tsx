import Link from "next/link";
import type { Run } from "@/lib/chain";
import { date } from "@/lib/data";
export function Heading({
  title,
  description,
  kicker = "CATCANVAS / PROMPT STUDIO",
  children,
}: {
  title: string;
  description: string;
  kicker?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h1>
          {title}
          <span className="dot">.</span>
        </h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </header>
  );
}
export function Notices({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="notice error">
          {error.slice(0, 500)}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice === "deleted"
            ? "Removed. Existing run history is preserved."
            : notice === "reordered"
              ? "Step order updated."
              : "Changes saved."}
        </p>
      )}
    </>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <span aria-hidden>↗</span>
      <p>{children}</p>
    </div>
  );
}
export function History({ runs }: { runs: Run[] }) {
  if (!runs.length)
    return (
      <Empty>No runs yet. Run a chain to see its real outputs here.</Empty>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Chain</th>
            <th>Status</th>
            <th>Started · New York</th>
            <th>Steps</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>{run.snapshot.chain.name}</td>
              <td>
                <span className={`badge ${run.status}`}>{run.status}</span>
              </td>
              <td>{date(run.created_at)}</td>
              <td>
                {run.results.length} / {run.snapshot.steps.length}
              </td>
              <td>
                <Link className="text-link" href={`/runs/${run.id}`}>
                  View prompts & output ↗
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
