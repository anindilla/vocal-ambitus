import { midiToFrequency } from '@/utils/audio/pitch';

export type ToneProfile = 'feminine' | 'masculine';

export type PatternDefinition = {
  id: string;
  label: string;
  description: string;
  frequencies: number[];
};

const PATTERN_INTERVALS = [0, 2, 4, 2, 0];

const FEMININE_ROOTS = [60, 62, 65, 67];
const MASCULINE_ROOTS = [48, 50, 53, 55];

const PROFILE_META: Record<
  ToneProfile,
  {
    low: { label: string; description: string };
    high: { label: string; description: string };
  }
> = {
  feminine: {
    low: { label: 'Glow low', description: 'Gentle chest “ma” around middle C.' },
    high: { label: 'Float high', description: 'Soft head mix to show your upper shimmer.' }
  },
  masculine: {
    low: { label: 'Ground low', description: 'Relaxed chest “ma” that sits comfortably.' },
    high: { label: 'Reach high', description: 'Ease into your upper chest / mix without strain.' }
  }
};

export const PATTERN_VARIANT_COUNT = 4;

const buildPattern = (id: string, label: string, description: string, rootMidi: number): PatternDefinition => ({
  id,
  label,
  description,
  frequencies: PATTERN_INTERVALS.map(interval => midiToFrequency(rootMidi + interval))
});

export function getPatternSet(profile: ToneProfile, variant: number): PatternDefinition[] {
  const roots = profile === 'feminine' ? FEMININE_ROOTS : MASCULINE_ROOTS;
  const meta = PROFILE_META[profile];
  const rootIndex = variant % roots.length;
  const lowRoot = roots[rootIndex];
  const highRoot = roots[(rootIndex + 1) % roots.length] + 5;

  return [
    buildPattern(`${profile}-${variant}-low`, meta.low.label, meta.low.description, lowRoot),
    buildPattern(`${profile}-${variant}-high`, meta.high.label, meta.high.description, highRoot)
  ];
}

