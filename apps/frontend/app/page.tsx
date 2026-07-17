import PulseLine from "@/components/PulseLine";

const STEPS = [
  { n: "01", title: "Upload", body: "Drop in a scanned or digital PDF report — lab work, imaging, ECGs, anything." },
  { n: "02", title: "Understand", body: "We extract the key values and trends, and lay them out clearly." },
  { n: "03", title: "Ask", body: "Ask follow-up questions in plain language, answered straight from your report." },
];

export default function HomePage() {
  return (
    <div className="space-y-24">
      <section className="space-y-8">
        <p className="font-mono text-xs tracking-widest text-sage uppercase">Upload · Understand · Ask</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] text-ink max-w-2xl">
          Your medical report, explained in plain language.
        </h1>
        <p className="text-inkSoft max-w-xl leading-relaxed">
          Upload a lab or imaging report as a PDF. Medexplain reads it, surfaces the
          values that matter, and answers your follow-up questions directly from
          your own report — always with a reminder to confirm with your physician.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a href="/login" className="px-5 py-2.5 rounded-full bg-sage text-paper text-sm font-medium hover:bg-sage-dark transition-colors">
            Get started
          </a>
          <a href="/dashboard" className="px-5 py-2.5 rounded-full border border-mist text-sm font-medium text-ink hover:border-sage transition-colors">
            Go to dashboard
          </a>
        </div>
        <PulseLine animate className="w-full h-12 text-pulse mt-6" />
      </section>

      <section className="grid sm:grid-cols-3 gap-8 border-t border-mist pt-12">
        {STEPS.map((step) => (
          <div key={step.n} className="space-y-2">
            <span className="font-mono text-xs text-pulse">{step.n}</span>
            <h3 className="font-display text-lg text-ink">{step.title}</h3>
            <p className="text-sm text-inkSoft leading-relaxed">{step.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}