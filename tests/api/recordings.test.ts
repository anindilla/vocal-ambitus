import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/recordings/route';
import { recordings, sessions } from '@db/schema';

const { insertMock, updateMock, querySessionsFindFirstMock, saveRecordingToBlobMock } = vi.hoisted(() => {
  return {
    insertMock: vi.fn(),
    updateMock: vi.fn(),
    querySessionsFindFirstMock: vi.fn(),
    saveRecordingToBlobMock: vi.fn()
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    insert: insertMock,
    update: updateMock,
    query: {
      sessions: {
        findFirst: querySessionsFindFirstMock
      }
    }
  }
}));

vi.mock('@/lib/blob', () => ({
  saveRecordingToBlob: saveRecordingToBlobMock
}));

const sessionReturningValue = [{ id: 'session-abc' }];
const recordingReturningValue = [{ id: 'recording-def', blobUrl: 'https://blob.local/recording.webm' }];

beforeEach(() => {
  vi.clearAllMocks();

  insertMock.mockImplementation((table: unknown) => ({
    values: vi.fn(() => ({
      returning: vi.fn(async () => (table === sessions ? sessionReturningValue : recordingReturningValue))
    }))
  }));

  updateMock.mockImplementation(() => ({
    set: vi.fn(() => ({
      where: vi.fn(async () => undefined)
    }))
  }));

  querySessionsFindFirstMock.mockResolvedValue(null);
  saveRecordingToBlobMock.mockResolvedValue({ url: 'https://blob.local/recording.webm' });
});

describe('POST /api/recordings', () => {
  it('stores a recording and returns identifiers', async () => {
    const formData = new FormData();
    formData.set('file', new Blob(['fake audio'], { type: 'audio/webm' }), 'take.webm');
    formData.set('gender', 'woman');
    formData.set('experienceLevel', 'beginner');
    formData.set('step', 'speaking');
    formData.set('durationMs', '5000');

    const request = new Request('http://localhost/api/recordings', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.sessionId).toBe('session-abc');
    expect(json.recordingId).toBe('recording-def');
    expect(json.blobUrl).toBe('https://blob.local/recording.webm');

    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(saveRecordingToBlobMock).toHaveBeenCalledOnce();
  });

  it('rejects missing file payloads', async () => {
    const formData = new FormData();
    formData.set('gender', 'man');
    formData.set('step', 'song');

    const request = new Request('http://localhost/api/recordings', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toMatch(/Missing audio file/i);
  });
});

