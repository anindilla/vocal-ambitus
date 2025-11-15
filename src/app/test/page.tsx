'use client';

import { useEffect, useMemo, useState } from 'react';

import { RecorderControls } from '@/components/RecorderControls';
import { StepNavigator } from '@/components/StepNavigator';
import type { RecorderStatus } from '@/hooks/useRecorder';
import { useRecorder } from '@/hooks/useRecorder';
import { useTonePlayer } from '@/hooks/useTonePlayer';
import { uploadRecording } from '@/lib/api/recordings';

type GenderIdentity = 'woman' | 'man' | 'nonbinary' | 'prefer-not-to-say';

type StepKey = 'profile' | 'speaking' | 'song' | 'range';
type RecordingStep = 'speaking' | 'song' | 'range';

const GENDER_COPY: Record<GenderIdentity, { label: string; description: string }> = {
  woman: {
    label: 'Woman',
    description: 'Soprano • Mezzo-soprano • Alto'
  },
  man: {
    label: 'Man',
    description: 'Tenor • Baritone • Bass'
  },
  nonbinary: {
    label: 'Non-binary',
    description: 'We keep the analysis flexible and preference-driven'
  },
  'prefer-not-to-say': {
    label: 'Prefer not to say',
    description: 'We will ask for preferred range outputs later'
  }
};

const STEP_ORDER: StepKey[] = ['profile', 'speaking', 'song', 'range'];

const RANGE_SEQUENCE = [
  { note: 'C3', frequency: 130.81 },
  { note: 'E3', frequency: 164.81 },
  { note: 'G3', frequency: 196.0 },
  { note: 'B3', frequency: 246.94 },
  { note: 'D4', frequency: 293.66 },
  { note: 'F4', frequency: 349.23 },
  { note: 'A4', frequency: 440.0 },
  { note: 'C5', frequency: 523.25 }
];

const CALIBRATION_TIPS = [
  {
    title: 'Allow mic access',
    detail: 'When prompted, accept microphone permission so we can capture your takes.'
  },
  {
    title: 'Balance your input',
    detail: 'Aim for the level meter to hover around 40–70% (green/amber). Red means clipping.'
  },
  {
    title: 'Use headphones if possible',
    detail: 'Headphones prevent the tone sweeps from feeding back into the mic.'
  }
];

export default function TestFlowPage() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [gender, setGender] = useState<GenderIdentity | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [notes, setNotes] = useState<string>('');
  const [rangeToneIndex, setRangeToneIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadingStep, setUploadingStep] = useState<RecordingStep | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedSteps, setUploadedSteps] = useState<Record<RecordingStep, boolean>>({
    speaking: false,
    song: false,
    range: false
  });

  const speakingRecorder = useRecorder();
  const songRecorder = useRecorder();
  const rangeRecorder = useRecorder();

  useEffect(() => {
    setUploadError(null);
  }, [currentStep]);

  useEffect(() => {
    setUploadedSteps(prev =>
      prev.speaking && speakingRecorder.status !== 'finished'
        ? { ...prev, speaking: false }
        : prev
    );
  }, [speakingRecorder.status]);

  useEffect(() => {
    setUploadedSteps(prev =>
      prev.song && songRecorder.status !== 'finished' ? { ...prev, song: false } : prev
    );
  }, [songRecorder.status]);

  useEffect(() => {
    setUploadedSteps(prev =>
      prev.range && rangeRecorder.status !== 'finished' ? { ...prev, range: false } : prev
    );
  }, [rangeRecorder.status]);

  const totalSteps = STEP_ORDER.length;
  const activeStep = STEP_ORDER[currentStep];

  const canProceed = useMemo(() => {
    switch (activeStep) {
      case 'profile':
        return Boolean(gender);
      case 'speaking':
        return speakingRecorder.status === 'finished' && uploadedSteps.speaking;
      case 'song':
        return songRecorder.status === 'finished' && uploadedSteps.song;
      case 'range':
        return rangeRecorder.status === 'finished' && uploadedSteps.range;
      default:
        return false;
    }
  }, [activeStep, gender, rangeRecorder.status, songRecorder.status, speakingRecorder.status, uploadedSteps]);

  const moveNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const movePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const recorderByStep: Record<RecordingStep, ReturnType<typeof useRecorder>> = {
    speaking: speakingRecorder,
    song: songRecorder,
    range: rangeRecorder
  };

  const handlePersistRecording = async (step: RecordingStep) => {
    const recorder = recorderByStep[step];

    if (!recorder.blob) {
      setUploadError('Record something before saving.');
      return;
    }

    if (!gender) {
      setUploadError('Please select how you identify before saving.');
      setCurrentStep(0);
      return;
    }

    setUploadingStep(step);
    setUploadError(null);

    try {
      const response = await uploadRecording({
        file: recorder.blob,
        metadata: {
          sessionId,
          gender,
          experienceLevel,
          notes,
          step,
          durationMs: Math.round(recorder.durationMs),
          peakLevel: Math.round(recorder.level * 100),
          clientMetadata: typeof navigator !== 'undefined' ? { userAgent: navigator.userAgent } : undefined
        }
      });

      setSessionId(response.sessionId);
      setUploadedSteps(prev => ({ ...prev, [step]: true }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to save recording.');
    } finally {
      setUploadingStep(null);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-5 pb-16 pt-20">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Vocal ambitus intake</h1>
        <p className="mx-auto max-w-2xl text-balance text-base text-slate-300 sm:text-lg">
          Follow the guided steps to capture the information and short recordings we need to estimate your range.
          You can review and re-record before sending anything to us.
        </p>
      </header>
      <CalibrateBanner />

      <section className="grid gap-6 rounded-3xl border border-slate-900 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 sm:grid-cols-[320px,1fr] sm:p-10">
        <aside className="flex flex-col gap-6" aria-label="Progress through the four steps">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Step overview</p>
            <ul className="mt-4 space-y-3">
              {STEP_ORDER.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                return (
                  <li
                    key={step}
                    className="flex items-start gap-3"
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`${STEP_COPY[step].title}${isComplete ? ' completed' : ''}${isActive ? ', current step' : ''}`}
                  >
                    <span
                      className={`mt-1 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                        isActive ? 'bg-emerald-400' : isComplete ? 'bg-emerald-700' : 'bg-slate-700'
                      }`}
                    />
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {STEP_COPY[step].title}
                      </p>
                      <p className="text-xs text-slate-400">{STEP_COPY[step].tagline}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <div className="flex flex-col gap-8">
          {activeStep === 'profile' ? (
            <ProfileStep
              gender={gender}
              onGenderChange={setGender}
              experienceLevel={experienceLevel}
              onExperienceChange={setExperienceLevel}
              notes={notes}
              onNotesChange={setNotes}
            />
          ) : null}
          {activeStep === 'speaking' ? (
            <SpeakingStep
              status={speakingRecorder.status}
              level={speakingRecorder.level}
              durationMs={speakingRecorder.durationMs}
              previewUrl={speakingRecorder.url}
              error={speakingRecorder.error}
              onStart={() => {
                void speakingRecorder.start();
              }}
              onStop={speakingRecorder.stop}
              onReset={speakingRecorder.reset}
              onSave={() => handlePersistRecording('speaking')}
              isUploading={uploadingStep === 'speaking'}
              isSaved={uploadedSteps.speaking}
              uploadError={uploadError}
            />
          ) : null}
          {activeStep === 'song' ? (
            <SongStep
              status={songRecorder.status}
              level={songRecorder.level}
              durationMs={songRecorder.durationMs}
              previewUrl={songRecorder.url}
              error={songRecorder.error}
              onStart={() => {
                void songRecorder.start();
              }}
              onStop={songRecorder.stop}
              onReset={songRecorder.reset}
              onSave={() => handlePersistRecording('song')}
              isUploading={uploadingStep === 'song'}
              isSaved={uploadedSteps.song}
              uploadError={uploadError}
            />
          ) : null}
          {activeStep === 'range' ? (
            <RangeStep
              status={rangeRecorder.status}
              level={rangeRecorder.level}
              durationMs={rangeRecorder.durationMs}
              previewUrl={rangeRecorder.url}
              error={rangeRecorder.error}
              onStart={() => {
                void rangeRecorder.start();
              }}
              onStop={rangeRecorder.stop}
              onReset={rangeRecorder.reset}
              toneIndex={rangeToneIndex}
              onAdvanceTone={() => setRangeToneIndex(prev => (prev + 1) % RANGE_SEQUENCE.length)}
              onSave={() => handlePersistRecording('range')}
              isUploading={uploadingStep === 'range'}
              isSaved={uploadedSteps.range}
              uploadError={uploadError}
            />
          ) : null}

          <StepNavigator
            currentStep={currentStep}
            totalSteps={totalSteps}
            canProceed={canProceed}
            onPrev={movePrev}
            onNext={() => {
              if (activeStep === 'range' && canProceed) {
                // Future: trigger submit action to store session and redirect to results
              }
              moveNext();
            }}
          />
        </div>
      </section>
    </main>
  );
}

const STEP_COPY: Record<StepKey, { title: string; tagline: string }> = {
  profile: {
    title: 'Tell us about yourself',
    tagline: 'Basic info to personalise the test'
  },
  speaking: {
    title: 'Warm up with your speaking voice',
    tagline: 'Get a baseline from everyday speech'
  },
  song: {
    title: 'Sing a song you love',
    tagline: 'Capture a comfortable musical phrase'
  },
  range: {
    title: 'Stretch your extremes',
    tagline: 'Call-and-response tones to map your ambitus'
  }
};

function ProfileStep({
  gender,
  onGenderChange,
  experienceLevel,
  onExperienceChange,
  notes,
  onNotesChange
}: {
  gender: GenderIdentity | null;
  onGenderChange: (value: GenderIdentity) => void;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  onExperienceChange: (value: 'beginner' | 'intermediate' | 'advanced') => void;
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Who should we tailor the test for?</h2>
        <p className="text-sm text-slate-300">
          Pick the option that best reflects how you’d like the reference ranges framed. We only use this to contextualise
          the labels in your recap.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(GENDER_COPY) as GenderIdentity[]).map(value => {
          const isActive = gender === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onGenderChange(value)}
              className={`flex flex-col gap-2 rounded-2xl border p-5 text-left transition ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400`}
              aria-pressed={isActive}
              aria-label={`Select ${GENDER_COPY[value].label} profile`}
            >
              <span className="text-base font-semibold text-white">{GENDER_COPY[value].label}</span>
              <span className="text-sm text-slate-300">{GENDER_COPY[value].description}</span>
            </button>
          );
        })}
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-200">How experienced are you with vocal training?</label>
        <div className="flex flex-wrap gap-3">
          {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
            <button
              key={level}
              type="button"
              onClick={() => onExperienceChange(level)}
              className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                experienceLevel === level
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-700 text-slate-200 hover:border-slate-500'
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400`}
              aria-pressed={experienceLevel === level}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-notes" className="block text-sm font-medium text-slate-200">
          Anything we should know? (optional)
        </label>
        <textarea
          id="profile-notes"
          rows={4}
          className="w-full resize-y rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-slate-950/30 focus:border-emerald-500 focus:outline-none"
          placeholder="Ex: I’m recovering from a cold, I usually sing alto in choir, etc."
          value={notes}
          onChange={event => onNotesChange(event.target.value)}
        />
      </div>
    </div>
  );
}

type StepRecorderProps = {
  status: RecorderStatus;
  level: number;
  durationMs: number;
  previewUrl: string | null;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSave: () => void;
  isUploading: boolean;
  isSaved: boolean;
  uploadError: string | null;
};

function SpeakingStep({
  status,
  level,
  durationMs,
  previewUrl,
  error,
  onStart,
  onStop,
  onReset,
  onSave,
  isUploading,
  isSaved,
  uploadError
}: StepRecorderProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Capture your speaking voice</h2>
        <p className="text-sm text-slate-300">
          Spend 20 seconds introducing yourself or describing your day. We use this to anchor your tessitura and median pitch.
        </p>
      </header>
      <ol className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
        <li>
          <strong className="text-white">Environment.</strong> Choose the quietest corner available and silence background music.
        </li>
        <li>
          <strong className="text-white">Distance.</strong> Keep 15–20 cm from the mic. Aim for the level meter to stay green/amber.
        </li>
        <li>
          <strong className="text-white">Retake freely.</strong> If you notice clipping (red), tap reset and try again.
        </li>
      </ol>
      <RecorderControls
        status={status}
        level={level}
        durationMs={durationMs}
        previewUrl={previewUrl}
        error={error}
        onStart={onStart}
        onStop={onStop}
        onReset={onReset}
        disabled={status === 'processing' || isUploading}
      />
      <RecordingActions onSave={onSave} isUploading={isUploading} isSaved={isSaved} uploadError={uploadError} />
    </div>
  );
}

function SongStep({
  status,
  level,
  durationMs,
  previewUrl,
  error,
  onStart,
  onStop,
  onReset,
  onSave,
  isUploading,
  isSaved,
  uploadError
}: StepRecorderProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Sing a comfortable melody</h2>
        <p className="text-sm text-slate-300">
          Choose a song or vocalise you love. Aim for 20–30 seconds that showcases both a gentle low and an effortless high.
        </p>
      </header>
      <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Helpful prompts</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Stick to a section you can repeat confidently.</li>
            <li>Include at least one phrase that climbs and one that descends.</li>
            <li>Hum the first bar before recording to settle pitch and tempo.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">What we analyse</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Average and median pitch compared to your speaking baseline.</li>
            <li>Pitch variance and the gap between the highest and lowest sustained tones.</li>
          </ul>
        </div>
      </div>
      <RecorderControls
        status={status}
        level={level}
        durationMs={durationMs}
        previewUrl={previewUrl}
        error={error}
        onStart={onStart}
        onStop={onStop}
        onReset={onReset}
        disabled={status === 'processing' || isUploading}
      />
      <RecordingActions onSave={onSave} isUploading={isUploading} isSaved={isSaved} uploadError={uploadError} />
    </div>
  );
}

function RangeStep({
  status,
  level,
  durationMs,
  previewUrl,
  error,
  onStart,
  onStop,
  onReset,
  toneIndex,
  onAdvanceTone,
  onSave,
  isUploading,
  isSaved,
  uploadError
}: StepRecorderProps & {
  toneIndex: number;
  onAdvanceTone: () => void;
}) {
  const { isPlaying, playTone } = useTonePlayer('triangle');
  const currentTone = RANGE_SEQUENCE[toneIndex];

  const handlePlay = async () => {
    const tone = RANGE_SEQUENCE[toneIndex];
    await playTone(tone.frequency, 1800);
    onAdvanceTone();
  };
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Call-and-response tone sweeps</h2>
        <p className="text-sm text-slate-300">
          We’ll play eight tones from low to high. Match each one with a sustained “ah” for ~4 seconds. If a pitch feels
          unsafe, skip it—your comfort matters.
        </p>
      </header>
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Upcoming sequence</h3>
            <p className="mt-1 text-sm text-slate-300">We’ll adjust dynamically after your first pass.</p>
            <p className="text-xs text-slate-500">Tip: wear headphones or lower speaker volume to avoid feedback.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void handlePlay();
            }}
            disabled={isPlaying}
            className="inline-flex items-center justify-center rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaying ? 'Playing…' : `Play ${currentTone.note}`}
          </button>
        </div>
        <ul className="flex flex-wrap gap-2 text-sm text-slate-300">
          {RANGE_SEQUENCE.map((tone, index) => (
            <li
              key={tone.note}
              className={`rounded-full px-3 py-1 ${
                index === toneIndex ? 'bg-emerald-500/20 text-emerald-100' : 'bg-slate-900/60'
              }`}
            >
              {tone.note}
            </li>
          ))}
        </ul>
      </div>
      <RecorderControls
        status={status}
        level={level}
        durationMs={durationMs}
        previewUrl={previewUrl}
        error={error}
        onStart={onStart}
        onStop={onStop}
        onReset={onReset}
        disabled={status === 'processing' || isUploading}
      />
      <RecordingActions onSave={onSave} isUploading={isUploading} isSaved={isSaved} uploadError={uploadError} />
    </div>
  );
}

function RecordingActions({
  onSave,
  isUploading,
  isSaved,
  uploadError
}: {
  onSave: () => void;
  isUploading: boolean;
  isSaved: boolean;
  uploadError: string | null;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isUploading}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-progress disabled:opacity-70"
        >
          {isUploading ? 'Saving take…' : isSaved ? 'Saved ✔' : 'Save this take'}
        </button>
        {isSaved ? (
          <span className="text-sm text-emerald-300" aria-live="polite">
            Saved and synced
          </span>
        ) : null}
      </div>
      {uploadError ? (
        <p className="text-sm text-rose-400" role="alert">
          {uploadError}
        </p>
      ) : null}
      {!isSaved ? (
        <p className="text-xs text-slate-400">
          Saving uploads the take securely to Vercel Blob, encrypts the URL, and links it to your session summary.
        </p>
      ) : null}
    </div>
  );
}

function CalibrateBanner() {
  return (
    <section
      aria-label="Calibration checklist"
      className="grid gap-4 rounded-3xl border border-slate-900 bg-slate-950/50 p-5 text-left sm:grid-cols-[220px,1fr]"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Calibration</p>
        <h2 className="mt-2 text-lg font-semibold text-white">3 quick reminders before you record</h2>
        <p className="mt-1 text-sm text-slate-300">Tick these boxes mentally to get the cleanest signal.</p>
      </div>
      <ul className="space-y-3 text-sm text-slate-200">
        {CALIBRATION_TIPS.map(tip => (
          <li key={tip.title} className="rounded-2xl border border-slate-900/70 bg-slate-900/40 px-4 py-3">
            <p className="font-semibold text-white">{tip.title}</p>
            <p className="text-slate-300">{tip.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

