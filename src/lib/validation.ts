import { z } from 'zod';

export const genderSchema = z.enum(['woman', 'man', 'nonbinary', 'prefer-not-to-say']);
export const stepSchema = z.enum(['speaking', 'song', 'range']);

export const pitchStatsSchema = z
  .object({
    min: z.number(),
    max: z.number(),
    median: z.number(),
    confidence: z.number().min(0).max(1)
  })
  .partial()
  .optional();

export const recordingFormSchema = z.object({
  sessionId: z.string().uuid().optional(),
  gender: genderSchema.optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  notes: z.string().max(800).optional(),
  step: stepSchema,
  patternId: z.string().max(32).optional(),
  durationMs: z.coerce.number().int().nonnegative().optional(),
  peakLevel: z.coerce.number().int().optional(),
  clientMetadata: z
    .string()
    .optional()
    .transform(value => {
      if (!value) return undefined;
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch (error) {
        console.error('Invalid JSON metadata', error);
        return undefined;
      }
    }),
  pitchStats: z
    .string()
    .optional()
    .transform(value => {
      if (!value) return undefined;
      try {
        return pitchStatsSchema.parse(JSON.parse(value));
      } catch (error) {
        console.error('Invalid pitch stats', error);
        return undefined;
      }
    })
});

export type RecordingFormInput = z.infer<typeof recordingFormSchema>;

