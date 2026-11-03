import { runs } from "@/lib/data";
import { Heading, History } from "@/components/shared";
export default async function Runs() {
  const history = await runs();
  return (
    <>
      <Heading
        title="Run history"
        description="The exact prompts, intermediate outputs and final media from your latest 50 runs."
      />
      <section className="panel">
        <History runs={history} />
      </section>
    </>
  );
}
