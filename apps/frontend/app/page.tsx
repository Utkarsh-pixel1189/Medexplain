export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Understand your medical reports</h1>
      <p className="text-gray-600 max-w-2xl">
        Upload a lab or imaging report as a PDF. Medexplain extracts the key
        values, shows trends over time, and lets you ask follow-up questions
        answered directly from your own report — always with a reminder to
        confirm with your physician.
      </p>
      <div className="flex gap-3">
        <a href="/login" className="px-4 py-2 rounded bg-brand-600 text-white text-sm">
          Get started
        </a>
        <a href="/dashboard" className="px-4 py-2 rounded border text-sm">
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
