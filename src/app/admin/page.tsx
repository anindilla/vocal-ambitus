import Link from 'next/link';
import { notFound } from 'next/navigation';

import { db } from '@/lib/db';

export const revalidate = 0;

export default async function AdminPage({ searchParams }: { searchParams: { token?: string } }) {
  const requiredToken = process.env.ADMIN_TOKEN;
  if (requiredToken && searchParams.token !== requiredToken) {
    notFound();
  }

  const sessions = await db.query.sessions.findMany({
    orderBy: (sessions, { desc }) => desc(sessions.createdAt),
    with: {
      recordings: true,
      analyses: true
    }
  });

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-5 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Admin / Session overview</h1>
        <p className="text-sm text-slate-400">
          Debugging dashboard listing the most recent sessions, recordings, and derived analyses.
        </p>
      </header>

      <section className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400">No sessions have been recorded yet.</p>
        ) : (
          sessions.map(session => (
            <article key={session.id} className="space-y-3 rounded-3xl border border-slate-900 bg-slate-950/50 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Session {session.id.slice(0, 8)}</h2>
                  <p className="text-xs text-slate-400">
                    {new Date(session.createdAt ?? '').toLocaleString()} • {session.gender}
                  </p>
                </div>
                <Link
                  href={`/result/${session.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  View result page
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span>{session.recordings.length} recordings</span>
                <span>{session.analyses.length} analyses</span>
                {session.notes ? <span>Notes captured</span> : null}
              </div>
              <div className="grid gap-2 text-xs text-slate-300">
                {session.recordings.map(recording => (
                  <div key={recording.id} className="rounded-2xl border border-slate-900 bg-slate-900/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold capitalize text-slate-100">{recording.step}</span>
                      <span>{recording.durationMs ? `${Math.round(recording.durationMs / 1000)}s` : '—'}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-slate-400">
                      <span>ID {recording.id.slice(0, 8)}</span>
                      {recording.pitchStats ? (
                        <span>
                          Pitch span {recording.pitchStats.min} – {recording.pitchStats.max}
                        </span>
                      ) : (
                        <span>Pitch pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

