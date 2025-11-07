const MIN_SAMPLES = 1024;
const GOOD_ENOUGH_CORRELATION = 0.9;

export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  if (buffer.length < MIN_SAMPLES) return null;

  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i];
    rms += value * value;
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return null;

  let r1 = 0;
  let r2 = buffer.length - 1;
  const threshold = 0.2;
  for (let i = 0; i < buffer.length / 2; i += 1) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < buffer.length / 2; i += 1) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) {
      r2 = buffer.length - i;
      break;
    }
  }

  const cropped = buffer.slice(r1, r2);
  const size = cropped.length;

  let bestOffset = -1;
  let bestCorrelation = 0;
  let foundGoodCorrelation = false;

  for (let offset = MIN_SAMPLES; offset < size; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < size - offset; i += 1) {
      correlation += cropped[i] * cropped[i + offset];
    }
    correlation /= size - offset;

    if (correlation > GOOD_ENOUGH_CORRELATION && correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
      foundGoodCorrelation = true;
    } else if (foundGoodCorrelation) {
      const shift = (bestCorrelation - correlation) / bestCorrelation;
      return sampleRate / (bestOffset + shift);
    }
  }

  if (bestOffset > -1) {
    return sampleRate / bestOffset;
  }

  return null;
}

export function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440);
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const VOICE_LABELS = [
  { key: 'bass', range: [40, 52] },
  { key: 'baritone', range: [48, 60] },
  { key: 'tenor', range: [52, 64] },
  { key: 'alto', range: [55, 67] },
  { key: 'mezzo', range: [60, 72] },
  { key: 'soprano', range: [65, 77] }
] as const;

export type VoiceCategory = (typeof VOICE_LABELS)[number]['key'];

export function midiToVoiceCategory(midiValues: number[]): VoiceCategory | null {
  if (!midiValues.length) return null;
  const min = Math.min(...midiValues);
  const max = Math.max(...midiValues);

  const bestFit = VOICE_LABELS.find(({ range }) => min >= range[0] - 2 && max <= range[1] + 2);
  return bestFit?.key ?? null;
}

