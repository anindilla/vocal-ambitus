# Vocal Ambitus

Responsive web experience that guides singers through a four-step vocal ambitus assessment. Users capture reference audio, the browser analyses pitch in real time, and the app surfaces a friendly range estimate with fallbacks when data is scarce.

## Features

- Guided four-step intake (profile, speech, song, range) with accessibility-first UI
- Real-time waveform + mic level feedback and “ma‑ma‑ma” pattern sweeps that rotate through multiple roots
- Gender-aware preset selector plus progress tracking to unlock the Finish button
- Automatic result generation with confidence score and graceful fallback if recordings are limited
- Admin/debug endpoint to review stored sessions

## Stack

- Next.js 14 App Router (TypeScript, React 18)
- Tailwind CSS for responsive UI
- Web Audio APIs (`MediaRecorder`, `AudioContext`) for capture & tone playback
- Drizzle ORM with a Postgres + object storage backend
- Vitest for unit and API-route tests

## Getting started

```bash
npm install
npm run dev
```

Launches the dev server on `http://localhost:3000`. The `/test` route exposes the guided assessment, `/result/[sessionId]` renders stored outcomes, and `/admin?token=...` offers a bare-bones session overview (guarded by `ADMIN_TOKEN`).

### Environment variables

Create a `.env.local` file with the credentials for your Postgres instance and object storage:

- `POSTGRES_URL`
- `BLOB_READ_WRITE_TOKEN` (or equivalent)
- `ADMIN_TOKEN` (optional; protects `/admin`)

When running locally without Blob/Postgres, you can stub API calls by skipping the “Save this take” step, but uploads will fail without credentials.

### Scripts

- `npm run dev` – Next.js dev server
- `npm run build` / `npm run start` – production build & serve
- `npm run lint` – ESLint (Next.js rules)
- `npm run test` – Vitest suite (`tests/`)
- `npm run format` – Format with Prettier

## Deployment

1. Provision your Postgres database + object storage bucket.
2. Set `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`, and optional `ADMIN_TOKEN` in your hosting provider’s environment.
3. Run `npx drizzle-kit push` once to apply the schema in `db/schema.ts`.
4. Deploy via your preferred CI/CD or hosting provider (`npm run build` must succeed).

## Roadmap ideas

- Enhance pitch analysis with windowed FFT & tracking confidence per take
- Provide progressive enhancement for browsers without MediaRecorder support
- Integrate email handoff of results and tailored warm-up routines

