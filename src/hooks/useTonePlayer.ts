'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Waveform = OscillatorType;

export function useTonePlayer(defaultWave: Waveform = 'sine') {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback(async () => {
    if (audioContextRef.current) return audioContextRef.current;
    const context = new AudioContext();
    audioContextRef.current = context;
    return context;
  }, []);

  const playTone = useCallback(
    async (frequency: number, durationMs = 1500, waveform: Waveform = defaultWave) => {
      const context = await ensureContext();
      if (context.state === 'suspended') await context.resume();

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = waveform;
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.001;

      oscillator.connect(gain);
      gain.connect(context.destination);

      const now = context.currentTime;
      const rampUp = 0.02;
      const sustainTime = durationMs / 1000 - rampUp * 2;
      gain.gain.exponentialRampToValueAtTime(0.5, now + rampUp);
      gain.gain.setValueAtTime(0.5, now + rampUp + sustainTime);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

      oscillator.start(now);
      oscillator.stop(now + durationMs / 1000);
      setIsPlaying(true);

      await new Promise<void>(resolve => {
        const handleEnded = () => {
          setIsPlaying(false);
          oscillator.removeEventListener('ended', handleEnded);
          resolve();
        };
        oscillator.addEventListener('ended', handleEnded);
      });
    },
    [defaultWave, ensureContext]
  );

  const stop = useCallback(async () => {
    if (!audioContextRef.current) return;
    await audioContextRef.current.close();
    audioContextRef.current = null;
    setIsPlaying(false);
  }, []);

  useEffect(() => () => {
    void stop();
  }, [stop]);

  return { isPlaying, playTone, stop };
}

