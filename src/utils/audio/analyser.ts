export function computeRmsLevel(buffer: Float32Array): number {
  if (buffer.length === 0) return 0;
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i];
    sumSquares += value * value;
  }
  const rms = Math.sqrt(sumSquares / buffer.length);
  return Math.min(1, rms / 0.5);
}

export function normaliseDecibels(decibels: number): number {
  const clamped = Math.max(-72, Math.min(-12, decibels));
  const normalised = (clamped + 72) / 60;
  return Number.isFinite(normalised) ? Math.max(0, Math.min(1, normalised)) : 0;
}

