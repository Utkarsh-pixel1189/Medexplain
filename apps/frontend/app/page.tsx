import Marker from "@/components/Marker";
import StepCard from "@/components/StepCard";
import TiltImage from "@/components/TiltImage";
import ThemeSwitcher from "@/components/ThemeSwitcher";
const STEPS = [
  {
    n: "01",
    title: "Upload",
    body: "Drop in a scanned or digital PDF report — lab work, imaging, ECGs, or anything else your provider hands you.",
    icon: (
      <path d="M12 16V4M12 4L7 9M12 4l5 5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    n: "02",
    title: "Understand",
    body: "We extract the values that matter, check them against normal ranges, and lay out trends clearly.",
    icon: (
      <path d="M4 19V5m5 14V9m5 10V13m5 6V7" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    n: "03",
    title: "Ask",
    body: "Ask follow-up questions in plain language — answered directly from your own report, with sources cited.",
    icon: (
      <path d="M12 18h.01M8 21h8a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function HomePage() {
  return (
    <div className="space-y-5">
      <section className="text-center space-y-3">
        <h1 className="font-display font-bold text-3xl sm:text-5xl leading-[1.08] text-ink max-w-5xl mx-auto">
          Unlock <Marker>effortless</Marker> understanding of your medical reports.
        </h1>
        <p className="text-inkSoft max-w-2xl mx-auto leading-relaxed text-base">
          Upload a lab or imaging report as a PDF. Medexplain reads it, surfaces the
          values that matter, and answers your follow-up questions directly from
          your own report.
        </p>
      </section>

      <TiltImage />
      <ThemeSwitcher />

      <section className="flex flex-wrap gap-3 justify-center">
        <a
          href="/login"
          className="px-6 py-3 rounded-full bg-accent text-paper text-sm font-semibold transition-all hover:bg-accent-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Get started with an upload
        </a>
        <a
          href="/dashboard"
          className="px-6 py-3 rounded-full border-2 border-ink text-sm font-semibold text-ink transition-all hover:bg-ink hover:text-paper hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Go to dashboard
        </a>
      </section>

      <section className="grid sm:grid-cols-3 gap-5 pt-2">
        {STEPS.map((step) => (
          <StepCard key={step.n} n={step.n} title={step.title} body={step.body} icon={step.icon} />
        ))}
      </section>
    </div>
  );
}