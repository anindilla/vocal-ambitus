import { describe, expect, it } from 'vitest';

import { classifyVocalRange } from '@/utils/vocalClassify';

describe('classifyVocalRange', () => {
  it('classifies a soprano profile for high tessitura', () => {
    const result = classifyVocalRange({
      lowestMidi: 64,
      highestMidi: 84,
      speakingMedian: 69,
      preferredGrouping: 'woman'
    });

    expect(result.category).toBe('soprano');
    expect(result.confidence).toBeGreaterThan(0.4);
  });

  it('falls back to baritone for mid male range', () => {
    const result = classifyVocalRange({
      lowestMidi: 45,
      highestMidi: 63,
      speakingMedian: 52,
      preferredGrouping: 'man'
    });

    expect(result.category).toBe('baritone');
    expect(result.coverage).toBeGreaterThan(0.3);
  });

  it('considers all categories for nonbinary preference', () => {
    const result = classifyVocalRange({
      lowestMidi: 55,
      highestMidi: 74,
      preferredGrouping: 'nonbinary'
    });

    expect(['alto', 'tenor', 'mezzo']).toContain(result.category);
  });
});

