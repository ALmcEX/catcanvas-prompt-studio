import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { Nav } from "@/components/nav";
import { Theme } from "@/components/theme";
export const dynamic = "force-dynamic";
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user } = await requireAdmin();
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Administrator";
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          CatCanvas
        </Link>
        <p className="workspace-label">PROMPT STUDIO</p>
        <Nav />
        <div className="sidebar-bottom">
          <div className="identity">
            <div>
              <strong>{name}</strong>
              <small>Superadmin</small>
            </div>
            <form action={logout}>
              <button aria-label="Sign out" title="Sign out">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            WORKSPACE <span className="muted">/</span> Prompt Studio
          </span>
          <div className="topbar-actions">
            <span className="verified">● Google session verified</span>
            <Theme />
          </div>
        </header>
        <main className="content">{children}</main>
        <footer>
          CATCANVAS / FROM ONE IDEA TO THE NEXT <span>{user.email}</span>
        </footer>
      </div>
    </div>
  );
}
