'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { computeRmsLevel } from '@/utils/audio/analyser';

export type RecorderStatus = 'idle' | 'recording' | 'processing' | 'finished' | 'error';

export type UseRecorderOptions = {
  mimeType?: string;
  analyserFftSize?: number;
};

export type RecorderReturn = {
  status: RecorderStatus;
  level: number;
  durationMs: number;
  error: string | null;
  blob: Blob | null;
  url: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
};

export function useRecorder({ mimeType = 'audio/webm', analyserFftSize = 2048 }: UseRecorderOptions = {}): RecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [level, setLevel] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef(0);
  const startTimestampRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanup = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    analyserRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());

    mediaRecorderRef.current = null;
    streamRef.current = null;
    analyserRef.current = null;
    audioContextRef.current = null;
    frameRef.current = 0;
    startTimestampRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cleanup();
    if (url) {
      URL.revokeObjectURL(url);
    }
    setStatus('idle');
    setLevel(0);
    setDurationMs(0);
    setError(null);
    setBlob(null);
    setUrl(null);
    chunksRef.current = [];
  }, [cleanup, url]);

  useEffect(() => () => cleanup(), [cleanup]);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const updateVisuals = useCallback(() => {
    if (!analyserRef.current) return;
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    setLevel(prev => {
      const next = computeRmsLevel(buffer);
      return Number.isFinite(next) ? next : prev;
    });

    if (startTimestampRef.current) {
      const now = performance.now();
      setDurationMs(now - startTimestampRef.current);
    }

    frameRef.current = requestAnimationFrame(updateVisuals);
  }, []);

  const start = useCallback(async () => {
    try {
      if (status === 'recording') return;
      setError(null);
      setStatus('processing');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      chunksRef.current = [];
      recorder.ondataavailable = event => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        setStatus(prev => (prev === 'error' ? prev : 'processing'));
        const fullBlob = new Blob(chunksRef.current, { type: mimeType });
        setBlob(fullBlob);
        const objectUrl = URL.createObjectURL(fullBlob);
        setUrl(objectUrl);
        setStatus(prev => (prev === 'error' ? prev : 'finished'));
      };

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = analyserFftSize;
      analyserRef.current = analyser;
      source.connect(analyser);

      recorder.start();
      startTimestampRef.current = performance.now();
      setDurationMs(0);
      setLevel(0);
      setStatus('recording');
      updateVisuals();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to access microphone';
      setError(message);
      setStatus('error');
      cleanup();
    }
  }, [cleanup, mimeType, analyserFftSize, status, updateVisuals]);

  const stop = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (status !== 'recording') return;
    const startedAt = startTimestampRef.current;
    if (startedAt) {
      setDurationMs(performance.now() - startedAt);
    }
    setStatus('processing');
    mediaRecorderRef.current.stop();
    cleanup();
  }, [cleanup, status]);

  return {
    status,
    level,
    durationMs,
    error,
    blob,
    url,
    start,
    stop,
    reset
  };
}

