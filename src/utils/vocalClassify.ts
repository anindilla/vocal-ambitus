import { midiToVoiceCategory, type VoiceCategory } from '@/utils/audio/pitch';

type GenderGrouping = 'woman' | 'man' | 'nonbinary' | 'prefer-not-to-say';

type Category = 'soprano' | 'mezzo' | 'alto' | 'tenor' | 'baritone' | 'bass';

type RangeDefinition = {
  category: Category;
  min: number;
  max: number;
};

const FEMALE_RANGES: RangeDefinition[] = [
  { category: 'soprano', min: 60, max: 84 },
  { category: 'mezzo', min: 57, max: 81 },
  { category: 'alto', min: 52, max: 76 }
];

const MALE_RANGES: RangeDefinition[] = [
  { category: 'tenor', min: 48, max: 72 },
  { category: 'baritone', min: 44, max: 68 },
  { category: 'bass', min: 38, max: 62 }
];

const ALL_RANGES: RangeDefinition[] = [...FEMALE_RANGES, ...MALE_RANGES];

export type ClassificationInput = {
  lowestMidi: number;
  highestMidi: number;
  speakingMedian?: number;
  preferredGrouping: GenderGrouping;
};

export type ClassificationResult = {
  category: Category;
  confidence: number;
  coverage: number;
  voiceCategory?: VoiceCategory | null;
  suggestedRange: { min: number; max: number };
};

export function classifyVocalRange({
  lowestMidi,
  highestMidi,
  speakingMedian,
  preferredGrouping
}: ClassificationInput): ClassificationResult {
  const candidateRanges = getCandidateRanges(preferredGrouping);

  const scored = candidateRanges
    .map(definition => ({
      definition,
      coverage: coverageScore(definition, lowestMidi, highestMidi),
      proximity: speakingMedian ? proximityScore(definition, speakingMedian) : baselineProximity(definition, lowestMidi, highestMidi),
      fitPenalty: fitPenalty(definition, lowestMidi, highestMidi)
    }))
    .map(entry => ({
      ...entry,
      score: entry.coverage * 0.8 + entry.proximity * 0.2 - entry.fitPenalty * 0.4
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0] ?? {
    definition: candidateRanges[0],
    coverage: 0,
    proximity: 0,
    fitPenalty: 0,
    score: 0
  };

  const voiceCategory = midiToVoiceCategory([lowestMidi, highestMidi]);

  const confidence = Math.min(1, Math.max(0, top.score));

  return {
    category: top.definition.category,
    confidence,
    coverage: top.coverage,
    voiceCategory,
    suggestedRange: { min: top.definition.min, max: top.definition.max }
  };
}

function getCandidateRanges(grouping: GenderGrouping): RangeDefinition[] {
  if (grouping === 'woman') return FEMALE_RANGES;
  if (grouping === 'man') return MALE_RANGES;
  return ALL_RANGES;
}

function coverageScore(definition: RangeDefinition, lowestMidi: number, highestMidi: number): number {
  const span = Math.max(1, highestMidi - lowestMidi);
  const overlapStart = Math.max(definition.min, lowestMidi);
  const overlapEnd = Math.min(definition.max, highestMidi);
  const overlap = Math.max(0, overlapEnd - overlapStart);
  return Math.max(0, Math.min(1, overlap / span));
}

function proximityScore(definition: RangeDefinition, median: number): number {
  const centre = (definition.min + definition.max) / 2;
  const distance = Math.abs(centre - median);
  return Math.max(0, 1 - distance / 12);
}

function baselineProximity(definition: RangeDefinition, lowestMidi: number, highestMidi: number): number {
  const centre = (definition.min + definition.max) / 2;
  const spanMidpoint = lowestMidi + (highestMidi - lowestMidi) / 2;
  const distance = Math.abs(centre - spanMidpoint);
  return Math.max(0, 1 - distance / 12);
}

function fitPenalty(definition: RangeDefinition, lowestMidi: number, highestMidi: number): number {
  const lowPenalty = Math.max(0, definition.min - lowestMidi);
  const highPenalty = Math.max(0, highestMidi - definition.max);
  return Math.min(1, (lowPenalty + highPenalty) / 12);
}

