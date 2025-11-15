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

      <section className="grid w-full max-w-4xl gap-4 rounded-3xl border border-slate-900 bg-slate-950/50 p-6 text-left sm:grid-cols-3">
        {[
          { title: 'Prep', detail: 'Quiet corner · mic permission · 8 minutes' },
          { title: 'What you’ll need', detail: 'Browser + mic, headphones or speakers, favourite chorus' },
          { title: 'What you’ll get', detail: 'Saved takes, instant range hints, recap with next steps' }
        ].map(item => (
          <div key={item.title} className="space-y-1 rounded-2xl border border-slate-900/80 bg-slate-950/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">{item.title}</p>
            <p className="text-sm text-slate-200">{item.detail}</p>
          </div>
        ))}
      </section>

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

      <section id="how-it-works" className="w-full max-w-4xl space-y-6 border-t border-slate-900 pt-10 text-left">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Flow</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Four quick checkpoints</h2>
          <p className="text-sm text-slate-400">Re-record anything. Nothing leaves your browser until you save.</p>
        </div>
        <ol className="grid gap-3 text-slate-200 sm:grid-cols-4">
          {[
            { title: 'Profile', description: 'Tell us how you identify + experience level.' },
            { title: 'Speak', description: '20s natural speech → baseline pitch.' },
            { title: 'Sing', description: 'Favourite chorus spanning comfy lows/highs.' },
            { title: 'Sweep', description: 'Call-and-response tones to map extremes.' }
          ].map((item, index) => (
            <li key={item.title} className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Step {index + 1}</p>
              <h3 className="mt-1 text-base font-semibold tracking-tight text-white">{item.title}</h3>
              <p className="text-xs text-slate-400">{item.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

