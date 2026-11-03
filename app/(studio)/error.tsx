"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel stack">
      <h1>Couldn’t load this page.</h1>
      <p>
        Please try again. If the problem persists, check your access and
        database setup.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
