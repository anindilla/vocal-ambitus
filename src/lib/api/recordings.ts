'use client';

import type { RecordingFormInput } from '@/lib/validation';

type UploadRecordingArgs = {
  file: Blob;
  metadata: Omit<RecordingFormInput, 'sessionId'> & { sessionId?: string | null };
};

export async function uploadRecording({ file, metadata }: UploadRecordingArgs) {
  const formData = new FormData();
  formData.set('file', file, `recording-${metadata.step}.webm`);

  Object.entries(metadata).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'object') {
      formData.set(key, JSON.stringify(value));
    } else {
      formData.set(key, String(value));
    }
  });

  const response = await fetch('/api/recordings', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorJson = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(errorJson.error ?? 'Failed to upload recording');
  }

  return (await response.json()) as {
    sessionId: string;
    recordingId: string;
    blobUrl: string;
  };
}

