'use client';

import { useMemo } from 'react';

type RecorderStatus = 'idle' | 'recording' | 'processing' | 'finished' | 'error';

const statusCopy: Record<RecorderStatus, string> = {
  idle: 'Ready to record. Press start and speak naturally.',
  recording: 'Recording… tap stop when you are done.',
  processing: 'Processing… please wait.',
  finished: 'Captured. You can preview or re-record.',
  error: 'Permission or device error—check your mic settings.'
};

export type RecorderControlsProps = {
  status: RecorderStatus;
  durationMs?: number;
  level?: number;
  previewUrl?: string | null;
  error?: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset?: () => void;
  disabled?: boolean;
};

export function RecorderControls({
  status,
  durationMs,
  level = 0,
  previewUrl,
  error,
  onStart,
  onStop,
  onReset,
  disabled
}: RecorderControlsProps) {
  const isRecording = status === 'recording';
  const actionLabel = isRecording ? 'Stop recording' : 'Start recording';

  const formattedDuration = useMemo(() => {
    if (typeof durationMs !== 'number') return null;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }, [durationMs]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-950/40">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200" aria-live="polite">
          {statusCopy[status]}
        </span>
        {formattedDuration ? <span className="text-xs text-slate-400">{formattedDuration}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 rounded-full bg-slate-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(1, Math.max(0, level)) * 100)}
          aria-label="Live microphone level"
        >
          <div
            className={`h-full rounded-full transition-[width,background-color] ${
              level > 0.75 ? 'bg-rose-500' : level > 0.4 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(1, Math.max(0, level)) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-400">
          Mic level
          <span className="sr-only"> {Math.round(Math.min(1, Math.max(0, level)) * 100)} percent</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
            isRecording ? 'bg-rose-500 text-rose-50 hover:bg-rose-400' : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
          } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
          onClick={isRecording ? onStop : onStart}
          disabled={disabled}
          aria-disabled={disabled}
          aria-pressed={isRecording}
        >
          {actionLabel}
        </button>
        {onReset ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
            onClick={onReset}
            disabled={disabled || status === 'recording'}
            aria-disabled={disabled || status === 'recording'}
          >
            Reset take
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {previewUrl ? (
        <audio controls className="w-full rounded-xl bg-slate-950/80">
          <source src={previewUrl} />
          Your browser does not support the audio element.
        </audio>
      ) : null}
    </div>
  );
}

