# Vocal Ambitus

Responsive web experience that guides singers through a four-step vocal ambitus assessment. Users capture reference audio, we run a lightweight pitch heuristic, persist takes to Vercel Blob, and surface a human-friendly range estimate backed by Vercel Postgres.

## Stack

- Next.js 14 App Router (TypeScript, React 18)
- Tailwind CSS for responsive UI
- Web Audio APIs (`MediaRecorder`, `AudioContext`) for capture & tone playback
- Drizzle ORM with Vercel Postgres + Vercel Blob storage
- Vitest for unit and API-route tests

## Getting started

```bash
npm install
npm run dev
```

Launches the dev server on `http://localhost:3000`. The `/test` route exposes the guided assessment, `/result/[sessionId]` renders stored outcomes, and `/admin?token=...` offers a bare-bones session overview (guarded by `ADMIN_TOKEN`).

### Environment variables

Create a `.env.local` file with:

```bash
POSTGRES_URL="postgres://..."           # Vercel Postgres connection string
BLOB_READ_WRITE_TOKEN="vercel_blob_rw"  # Token from Vercel Blob dashboard
ADMIN_TOKEN="optional-debug-token"      # Optional: protects /admin route
```

When running locally without Blob/Postgres, you can stub API calls by skipping the “Save this take” step, but uploads will fail without credentials.

### Scripts

- `npm run dev` – Next.js dev server
- `npm run build` / `npm run start` – production build & serve
- `npm run lint` – ESLint (Next.js rules)
- `npm run test` – Vitest suite (`tests/`)
- `npm run format` – Format with Prettier

## Deployment

1. Provision Vercel Postgres + Blob (Project Settings → Storage).
2. Set `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN` in Vercel project environment.
3. Optionally set `ADMIN_TOKEN` for the admin page.
4. Push to a Git repo linked to Vercel; `npm run build` must succeed.
5. After first deploy, run `npx drizzle-kit push` (or use Vercel migration workflow) to apply the schema in `db/schema.ts`.

## Roadmap ideas

- Enhance pitch analysis with windowed FFT & tracking confidence per take
- Provide progressive enhancement for browsers without MediaRecorder support
- Integrate email handoff of results and tailored warm-up routines

