import { put } from '@vercel/blob';

import { getEnv } from '@/lib/env';

export async function saveRecordingToBlob(
  file: Blob,
  sessionId: string,
  step: 'speaking' | 'song' | 'range'
) {
  const { BLOB_READ_WRITE_TOKEN } = getEnv();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `recordings/${sessionId}/${step}-${timestamp}.webm`;

  return put(fileName, file, {
    access: 'public',
    contentType: file.type || 'audio/webm',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true
  });
}

