import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-12 px-6 py-16 text-center">
      <div className="max-w-3xl space-y-6">
        <span className="rounded-full border border-emerald-500/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
          Vocal Ambitus Lab
        </span>
        <h1 className="text-balance text-4xl font-semibold leading-tight text-white sm:text-6xl">
          Discover your true vocal range with guided listening and instant feedback
        </h1>
        <p className="text-lg text-slate-300 sm:text-xl">
          We combine real-time pitch detection, call-and-response tone sweeps, and context about how you identify to estimate
          whether you sit closer to soprano, alto, tenor, baritone, or bass. You own the recordings—we just help analyse them.
        </p>
      </div>

      <div className="flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-slate-900 bg-slate-950/40 p-5 text-left sm:flex-row sm:items-center sm:text-center">
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Before you start</p>
          <p className="mt-2 text-base text-slate-200">
            Find a quiet space, connect a mic + speakers or headphones, and set aside about 8 minutes.
          </p>
        </div>
        <dl className="grid flex-1 gap-4 text-sm text-slate-300 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-100">What you’ll need</dt>
            <dd>Browser mic access, speakers/headphones, and a short song snippet.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What you’ll get</dt>
            <dd>Saved takes, immediate range hints, and tailored tips in your recap.</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/test"
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-7 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          aria-label="Start the guided ambitus test"
        >
          Start the guided test
        </Link>
        <Link
          href="#how-it-works"
          className="inline-flex items-center justify-center rounded-full border border-slate-700 px-7 py-3 text-base font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          See the four steps
        </Link>
      </div>

      <section id="how-it-works" className="w-full max-w-4xl space-y-8 border-t border-slate-800 pt-10 text-left">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-300">How it works</p>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Four lightweight steps</h2>
          </div>
          <p className="text-sm text-slate-400">Re-record or reset any step before sending.</p>
        </div>
        <ol className="grid gap-4 text-slate-200 sm:grid-cols-2">
          {[
            {
              title: 'Tailor the reference ranges',
              description: 'Share how you identify and your comfort level with vocal training so we can frame the results.'
            },
            {
              title: 'Baseline speech check',
              description: 'Speak for ~20 seconds. We detect your median speaking pitch and overall tessitura.'
            },
            {
              title: 'Comfort song snippet',
              description: 'Sing a chorus or vocalise you love. We look at the highs, lows, and pitch variance.'
            },
            {
              title: 'Tone sweeps',
              description: 'Do a call-and-response with 6–8 tones to map your upper and lower boundaries.'
            }
          ].map((item, index) => (
            <li key={item.title} className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5">
              <p className="text-sm font-semibold text-emerald-300">Step {index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

