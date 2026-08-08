import Marker from "@/components/Marker";
import SketchDivider from "@/components/SketchDivider";
import HeroSketch from "@/components/HeroSketch";

const STEPS = [
  { n: "01", title: "Upload", body: "Drop in a scanned or digital PDF report — lab work, imaging, ECGs, anything." },
  { n: "02", title: "Understand", body: "We extract the key values and trends, and lay them out clearly." },
  { n: "03", title: "Ask", body: "Ask follow-up questions in plain language, answered straight from your report." },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center space-y-8">
        <h1 className="font-display font-bold text-4xl sm:text-6xl leading-[1.05] text-ink max-w-3xl mx-auto">
          Unlock <Marker>effortless</Marker> understanding of your medical reports.
        </h1>
        <p className="text-inkSoft max-w-xl mx-auto leading-relaxed text-lg">
          Upload a lab or imaging report as a PDF. Medexplain reads it, surfaces the
          values that matter, and answers your follow-up questions directly from
          your own report.
        </p>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <a href="/login" className="px-6 py-3.5 rounded-full bg-sage text-paper text-sm font-semibold hover:bg-sage-dark transition-colors">
            Get started with an upload
          </a>
          <a href="/dashboard" className="px-6 py-3.5 rounded-full border-2 border-ink text-sm font-semibold text-ink hover:bg-ink hover:text-paper transition-colors">
            Go to dashboard
          </a>
        </div>
      </section>

      <SketchDivider />

      <section className="pt-4">
        <HeroSketch />
      </section>

      <section className="grid sm:grid-cols-3 gap-8 pt-8">
        {STEPS.map((step) => (
          <div key={step.n} className="space-y-2">
            <span className="font-display font-bold text-2xl text-sage">{step.n}</span>
            <h3 className="font-display font-bold text-lg text-ink">{step.title}</h3>
            <p className="text-sm text-inkSoft leading-relaxed">{step.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}