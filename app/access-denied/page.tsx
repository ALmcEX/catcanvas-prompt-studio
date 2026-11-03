import { logout } from "@/app/login/actions";
import { Theme } from "@/components/theme";
export default function AccessDenied() {
  return (
    <main className="access-page">
      <p className="eyebrow">CATCANVAS / PRIVATE WORKSPACE</p>
      <h1>This studio is for admins.</h1>
      <p>
        Your Google account does not have administrator access.
        <br />
        Ask the project owner to review profiles.is_superadmin.
      </p>
      <form action={logout}>
        <button className="button">Sign out & use another account ↗</button>
      </form>
      <Theme />
    </main>
  );
}
