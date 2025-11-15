'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { RecorderControls } from '@/components/RecorderControls';
import { StepNavigator } from '@/components/StepNavigator';
import type { RecorderStatus } from '@/hooks/useRecorder';
import { useRecorder } from '@/hooks/useRecorder';
import { useTonePlayer } from '@/hooks/useTonePlayer';
import { uploadRecording } from '@/lib/api/recordings';
import { PATTERN_VARIANT_COUNT, getPatternSet, ToneProfile, PatternDefinition } from '@/constants/tonePatterns';

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

const RANGE_REQUIRED_TAKES = 3;

const DEFAULT_PROFILE_BY_GENDER: Record<GenderIdentity, ToneProfile> = {
  woman: 'feminine',
  man: 'masculine',
  nonbinary: 'feminine',
  'prefer-not-to-say': 'feminine'
};

export default function TestFlowPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [gender, setGender] = useState<GenderIdentity | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [notes, setNotes] = useState<string>('');
  const initialProfile: ToneProfile = gender ? DEFAULT_PROFILE_BY_GENDER[gender] : 'feminine';
  const [toneProfile, setToneProfile] = useState<ToneProfile>(initialProfile);
  const [patternVariant, setPatternVariant] = useState(() => Math.floor(Math.random() * PATTERN_VARIANT_COUNT));
  const patternSet = useMemo(() => getPatternSet(toneProfile, patternVariant), [toneProfile, patternVariant]);
  const [profileLocked, setProfileLocked] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState<string>(patternSet[0].id);
  const [rangeSavedCount, setRangeSavedCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadingStep, setUploadingStep] = useState<RecordingStep | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [uploadedSteps, setUploadedSteps] = useState<Record<Exclude<RecordingStep, 'range'>, boolean>>({
    speaking: false,
    song: false
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
    if (gender && !profileLocked) {
      const mapped = DEFAULT_PROFILE_BY_GENDER[gender];
      setToneProfile(mapped);
      setPatternVariant(Math.floor(Math.random() * PATTERN_VARIANT_COUNT));
    }
  }, [gender, profileLocked]);

  useEffect(() => {
    setSelectedPatternId(patternSet[0].id);
  }, [patternSet]);

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
        return rangeSavedCount >= RANGE_REQUIRED_TAKES;
      default:
        return false;
    }
  }, [activeStep, gender, rangeSavedCount, songRecorder.status, speakingRecorder.status, uploadedSteps]);

  const moveNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const movePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleFinish = async () => {
    if (!sessionId) {
      setUploadError('Save at least one take before finishing.');
      return;
    }
    setIsFinishing(true);
    try {
      router.push(`/result/${sessionId}`);
    } finally {
      setIsFinishing(false);
    }
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

    if (step === 'range' && !selectedPatternId) {
      setUploadError('Pick a pattern before saving this take.');
      return;
    }

    setUploadingStep(step);
    setUploadError(null);

    try {
      const response = await uploadRecording({
        file: recorder.blob,
        metadata: {
          sessionId,
          gender: gender ?? undefined,
          experienceLevel,
          notes,
          step,
          patternId: step === 'range' ? selectedPatternId : undefined,
          durationMs: Math.round(recorder.durationMs),
          peakLevel: Math.round(recorder.level * 100),
          clientMetadata: typeof navigator !== 'undefined' ? { userAgent: navigator.userAgent } : undefined
        }
      });

      setSessionId(response.sessionId);
      if (step === 'range') {
        setRangeSavedCount(prev => prev + 1);
        setPatternVariant(prev => (prev + 1) % PATTERN_VARIANT_COUNT);
      } else {
        setUploadedSteps(prev => ({ ...prev, [step]: true }));
      }
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
      <PrepStrip />

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
              onSave={() => handlePersistRecording('range')}
              isUploading={uploadingStep === 'range'}
              isSaved={false}
              uploadError={uploadError}
              toneProfile={toneProfile}
              onToneProfileChange={profile => {
                setToneProfile(profile);
                setProfileLocked(true);
                setPatternVariant(Math.floor(Math.random() * PATTERN_VARIANT_COUNT));
              }}
              patterns={patternSet}
              selectedPatternId={selectedPatternId}
              onSelectPattern={setSelectedPatternId}
              rangeSavedCount={rangeSavedCount}
              requiredTakes={RANGE_REQUIRED_TAKES}
            />
          ) : null}

          <StepNavigator
            currentStep={currentStep}
            totalSteps={totalSteps}
            canProceed={canProceed}
            isSubmitting={isFinishing}
            onPrev={movePrev}
            onNext={() => {
              if (activeStep === 'range' && canProceed) {
                void handleFinish();
                return;
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
      <StepInfoList
        heading="Light checklist"
        items={[
          'Pick the quietest corner you can and mute everything else.',
          'Stay ~15 cm from the mic; keep the meter green/amber.',
          'Reset and redo if you hear clipping or background noise.'
        ]}
      />
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
      <StepInfoList
        heading="Make it comfortable"
        items={[
          'Loop a chorus you can sing on autopilot.',
          'Include one phrase that climbs and one that falls.',
          'Hum the first bar before you start to settle pitch and tempo.'
        ]}
      />
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
  onSave,
  isUploading,
  uploadError,
  toneProfile,
  onToneProfileChange,
  patterns,
  selectedPatternId,
  onSelectPattern,
  rangeSavedCount,
  requiredTakes
}: StepRecorderProps & {
  toneProfile: ToneProfile;
  onToneProfileChange: (profile: ToneProfile) => void;
  patterns: PatternDefinition[];
  selectedPatternId: string | null;
  onSelectPattern: (patternId: string) => void;
  rangeSavedCount: number;
  requiredTakes: number;
}) {
  const { playTone } = useTonePlayer('triangle');
  const [patternPlayingId, setPatternPlayingId] = useState<string | null>(null);

  const handlePlayPattern = async (pattern: PatternDefinition) => {
    if (patternPlayingId) return;
    setPatternPlayingId(pattern.id);
    for (const frequency of pattern.frequencies) {
      await playTone(frequency, 420);
    }
    setPatternPlayingId(null);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Call-and-response tone sweeps</h2>
        <p className="text-sm text-slate-300">
          Instead of single notes, mimic these short “ma ma ma” patterns. They tell us how your voice glides between
          nearby pitches without strain.
        </p>
      </header>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-200">Tone focus</p>
          <div className="flex flex-wrap gap-2">
            {(['feminine', 'masculine'] as ToneProfile[]).map(profile => {
              const isActive = toneProfile === profile;
              return (
                <button
                  key={profile}
                  type="button"
                  onClick={() => onToneProfileChange(profile)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {profile === 'feminine' ? 'Brighter' : 'Deeper'}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-slate-400">Switch anytime—pick whatever range feels the most natural right now.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {patterns.map(pattern => {
          const isSelected = selectedPatternId === pattern.id;
          return (
            <div
              key={pattern.id}
              className={`rounded-2xl border p-4 ${
                isSelected ? 'border-emerald-400 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{pattern.label}</p>
                  <p className="text-xs text-slate-400">{pattern.description}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100 disabled:opacity-50"
                  onClick={() => {
                    void handlePlayPattern(pattern);
                  }}
                  disabled={patternPlayingId !== null && patternPlayingId !== pattern.id}
                >
                  {patternPlayingId === pattern.id ? 'Playing…' : 'Play'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => onSelectPattern(pattern.id)}
                className={`mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold ${
                  isSelected ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {isSelected ? 'Selected pattern' : 'Use this pattern'}
              </button>
            </div>
          );
        })}
      </div>

      <RangeProgress completed={rangeSavedCount} required={requiredTakes} />

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
      <RecordingActions onSave={onSave} isUploading={isUploading} isSaved={false} uploadError={uploadError} />
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
        <p className="text-xs text-slate-400">Saving keeps the take tied to this session recap—re-record anytime.</p>
      ) : null}
    </div>
  );
}

function RangeProgress({ completed, required }: { completed: number; required: number }) {
  const clamped = Math.min(completed, required);
  const percentage = Math.min(100, (clamped / required) * 100);
  return (
    <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>Takes saved</span>
        <span className="font-semibold text-white">
          {clamped}/{required}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-slate-500">Aim for a low pass, a high pass, and one extra for safety.</p>
    </div>
  );
}

function StepInfoList({ heading, items }: { heading?: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      {heading ? <p className="text-sm font-semibold text-slate-200">{heading}</p> : null}
      <ul className="mt-2 space-y-2 text-sm text-slate-300">
        {items.map(item => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrepStrip() {
  return (
    <section
      aria-label="Session preparation"
      className="grid gap-3 rounded-3xl border border-slate-900 bg-slate-950/50 p-5 text-left sm:grid-cols-3"
    >
      {PREP_ITEMS.map(item => (
        <div key={item.title} className="rounded-2xl border border-slate-900/60 bg-slate-950/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">{item.title}</p>
          <p className="mt-1 text-sm text-slate-200">{item.detail}</p>
        </div>
      ))}
    </section>
  );
}

