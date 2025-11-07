import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { analyses, recordings, sessions } from '@db/schema';
import { db } from '@/lib/db';
import { saveRecordingToBlob } from '@/lib/blob';
import { recordingFormSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data payload' }, { status: 415 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');

    if (!(fileEntry instanceof Blob)) {
      return NextResponse.json({ error: 'Missing audio file payload' }, { status: 400 });
    }

    const parsed = recordingFormSchema.parse(Object.fromEntries(formData));
    const now = new Date();

    let sessionId = parsed.sessionId;

    if (!sessionId && parsed.gender) {
      const [session] = await db
        .insert(sessions)
        .values({
          gender: parsed.gender,
          experienceLevel: parsed.experienceLevel,
          notes: parsed.notes,
          clientMetadata: parsed.clientMetadata,
          createdAt: now,
          updatedAt: now
        })
        .returning({ id: sessions.id });

      sessionId = session.id;
    } else if (sessionId) {
      await db
        .update(sessions)
        .set({
          experienceLevel: parsed.experienceLevel,
          notes: parsed.notes,
          clientMetadata: parsed.clientMetadata,
          updatedAt: now,
          ...(parsed.gender ? { gender: parsed.gender } : {})
        })
        .where(eq(sessions.id, sessionId));
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Unable to determine session. Provide an existing sessionId or include gender to initialise one.' },
        { status: 400 }
      );
    }

    const ensuredSessionId: string = sessionId;

    const blob = await saveRecordingToBlob(fileEntry, ensuredSessionId, parsed.step);

    const [record] = await db
      .insert(recordings)
      .values({
        sessionId: ensuredSessionId,
        step: parsed.step,
        blobUrl: blob.url,
        durationMs: parsed.durationMs,
        peakLevel: parsed.peakLevel,
        pitchStats: parsed.pitchStats ?? null,
        createdAt: now
      })
      .returning({ id: recordings.id, blobUrl: recordings.blobUrl });

    return NextResponse.json({
      sessionId,
      recordingId: record.id,
      blobUrl: record.blobUrl
    });
  } catch (error) {
    console.error('Failed to store recording', error);
    return NextResponse.json({ error: 'Failed to store recording' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId query parameter is required' }, { status: 400 });
  }

  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: {
        recordings: true,
        analyses: true
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Failed to load session', error);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}

