import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import type { Analysis, Recording, Session } from '@db/schema';
import { classifyVocalRange, type ClassificationResult } from '@/utils/vocalClassify';

const FALLBACK_RANGES: Record<
  Session['gender'],
  { category: ClassificationResult['category']; range: { min: number; max: number } }
> = {
  woman: { category: 'mezzo', range: { min: 60, max: 72 } },
  man: { category: 'baritone', range: { min: 48, max: 60 } },
  nonbinary: { category: 'alto', range: { min: 55, max: 69 } },
  'prefer-not-to-say': { category: 'mezzo', range: { min: 58, max: 70 } }
};

type SessionPayload = {
  session: Session & {
    recordings: Recording[];
    analyses: Analysis[];
  };
};

async function fetchSession(sessionId: string): Promise<SessionPayload['session']> {
  const requestHeaders = headers();
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');

  if (!host) {
    throw new Error('Unable to determine host for fetching session data');
  }

  const baseUrl = `${protocol}://${host}`;
  const response = await fetch(`${baseUrl}/api/recordings?sessionId=${sessionId}`, {
    cache: 'no-store'
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error('Failed to load session');
  }

  const payload = (await response.json()) as SessionPayload;
  return payload.session;
}

export default async function ResultPage({ params }: { params: { sessionId: string } }) {
  const session = await fetchSession(params.sessionId);
  const pitchValues = session.recordings
    .flatMap(recording => {
      if (!recording.pitchStats) return [] as number[];
      const { min, max, median } = recording.pitchStats;
      return [min, max, median].filter((value): value is number => typeof value === 'number');
    })
    .filter(value => Number.isFinite(value));

  const lowestMidi = pitchValues.length ? Math.min(...pitchValues) : null;
  const highestMidi = pitchValues.length ? Math.max(...pitchValues) : null;
  const speakingMedian = session.recordings.find(record => record.step === 'speaking')?.pitchStats?.median ?? undefined;

  const hasPitchData = lowestMidi !== null && highestMidi !== null;
  const classification = hasPitchData
    ? {
        ...classifyVocalRange({
          lowestMidi: lowestMidi!,
          highestMidi: highestMidi!,
          speakingMedian,
          preferredGrouping: session.gender
        }),
        source: 'analysis' as const
      }
    : buildFallbackClassification(session.gender);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-5 py-16">
      <header className="space-y-3 text-center">
        <span className="text-sm uppercase tracking-[0.2em] text-emerald-400">Your ambitus insight</span>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          {classification.source === 'analysis'
            ? `Likely ${classification.category}`
            : `Early estimate: ${classification.category}`}
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-base text-slate-300 sm:text-lg">
          {classification.source === 'analysis' ? (
            <>
              Based on the pitches captured we estimate your most comfortable tessitura sits within{' '}
              <strong className="text-emerald-200">{classification.category}</strong> territory. Confidence level:{' '}
              {(classification.confidence * 100).toFixed(0)}%.
            </>
          ) : (
            <>
              We didn’t capture enough info for a confident verdict, so this is a low-confidence starting guess. Run
              another pass to tighten the range.
            </>
          )}
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-[2fr,1fr]">
        <article className="space-y-6 rounded-3xl border border-slate-900 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/30">
          <h2 className="text-xl font-semibold text-white">Session summary</h2>
          <dl className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Session ID</dt>
              <dd className="font-mono text-xs text-slate-200">{session.id}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Preferred grouping</dt>
              <dd className="capitalize text-slate-200">{session.gender.replace(/-/g, ' ')}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Suggested range</dt>
              <dd className="text-slate-200">
                MIDI {classification.suggestedRange.min} – {classification.suggestedRange.max}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">
                {classification.source === 'analysis' ? 'Coverage of captures' : 'Confidence'}
              </dt>
              <dd className="text-slate-200">
                {classification.source === 'analysis'
                  ? `${(classification.coverage * 100).toFixed(0)}%`
                  : 'Low – gather more takes'}
              </dd>
            </div>
            {session.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-slate-400">Notes</dt>
                <dd className="whitespace-pre-wrap text-slate-200">{session.notes}</dd>
              </div>
            ) : null}
          </dl>
        </article>

        <aside className="space-y-4 rounded-3xl border border-slate-900 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Next suggestions</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Warm up with lip trills before tackling your upper extremes.</li>
            <li>Record an ascending and descending arpeggio to refine our detection.</li>
            <li>Compare the range with your teacher or trusted partner.</li>
          </ul>
          <Link
            href="/test"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Run another pass
          </Link>
        </aside>
      </section>

      <section className="rounded-3xl border border-slate-900 bg-slate-950/50 p-6 text-center">
        <p className="text-sm text-slate-300">
          Want a cleaner estimate? Re-run the test and add an extra sweep or two so we can tighten the math.
        </p>
      </section>
    </main>
  );
}

function buildFallbackClassification(gender: Session['gender']) {
  const fallback = FALLBACK_RANGES[gender] ?? FALLBACK_RANGES['prefer-not-to-say'];
  return {
    category: fallback.category,
    confidence: 0.2,
    coverage: 0,
    voiceCategory: null,
    suggestedRange: fallback.range,
    source: 'fallback' as const
  };
}

