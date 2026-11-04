import { login } from "./actions";
import { Theme } from "@/components/theme";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <div className="login-appearance">
        <Theme />
      </div>
      <section className="login-art">
        <div className="brand">
          <span className="brand-mark">c.</span>CatCanvas
        </div>
        <div>
          <p className="eyebrow">A LITTLE STRUCTURE. MORE POSSIBILITY.</p>
          <h1>
            Good ideas
            <br />
            build on
            <br />
            each other<span className="dot">.</span>
          </h1>
          <p>
            Connect prompts. Follow the thought.
            <br />
            Make something worth sharing.
          </p>
        </div>
        <p className="workspace-label">PROMPT STUDIO / ASSIGNMENT 8</p>
      </section>
      <section className="login-panel">
        <p className="eyebrow">● PRIVATE WORKSPACE</p>
        <h2>Let’s connect the dots.</h2>
        <p className="muted">
          Sign in with your Google account to create prompt chains, inspect
          every prompt, and generate media.
        </p>
        {error && (
          <p className="notice error" role="alert">
            Sign-in could not be completed. Please try again.
          </p>
        )}
        <form action={login}>
          <button className="button">Continue with Google ↗</button>
        </form>
        <p className="muted">
          Access requires profiles.is_superadmin = true.
          <br />
          Signing in does not grant administrator access.
        </p>
      </section>
    </main>
  );
}
