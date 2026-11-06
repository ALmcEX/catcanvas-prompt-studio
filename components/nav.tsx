"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Studio navigation">
      <Link href="/" aria-current={path === "/" ? "page" : undefined}>
        Overview
      </Link>
      <details open={path.startsWith("/chains")}>
        <summary>Prompt chains</summary>
        <div className="subnav">
          <Link
            href="/chains"
            aria-current={path.startsWith("/chains") ? "page" : undefined}
          >
            All prompt chains
          </Link>
          <Link href="/chains?new=1">Create a chain</Link>
        </div>
      </details>
      <details open={path.startsWith("/runs") || path.startsWith("/media")}>
        <summary>Results</summary>
        <div className="subnav">
          <Link
            href="/runs"
            aria-current={path.startsWith("/runs") ? "page" : undefined}
          >
            Run history
          </Link>
          <Link
            href="/media"
            aria-current={path.startsWith("/media") ? "page" : undefined}
          >
            Generated media
          </Link>
        </div>
      </details>
    </nav>
  );
}
