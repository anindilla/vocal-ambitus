import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-12 text-center">
      <div className="max-w-2xl space-y-6">
        <span className="rounded-full border border-slate-800 px-4 py-1 text-sm uppercase tracking-wide text-slate-300">
          Vocal Ambitus Lab
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
          Discover your vocal range with confidence
        </h1>
        <p className="text-lg text-slate-300 sm:text-xl">
          A guided four-step assessment that listens to your speaking voice, favourite song, and targeted
          pitch checks to estimate your ambitus.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/test"
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Start assessment
        </Link>
        <Link
          href="#how-it-works"
          className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-base font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          Learn more
        </Link>
      </div>
      <section id="how-it-works" className="max-w-3xl space-y-8 border-t border-slate-800 pt-10 text-left">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">How the ambitus test works</h2>
        <ol className="space-y-6 text-slate-300">
          <li>
            <strong className="text-white">Step 1:</strong> Tell us how you identify so we can tailor the reference ranges.
          </li>
          <li>
            <strong className="text-white">Step 2:</strong> Record a snippet of your everyday speaking voice for baseline analysis.
          </li>
          <li>
            <strong className="text-white">Step 3:</strong> Share a short clip of a song you feel comfortable singing.
          </li>
          <li>
            <strong className="text-white">Step 4:</strong> Complete focused pitch checks as we play tones to explore your upper and lower limits.
          </li>
        </ol>
      </section>
    </main>
  );
}

