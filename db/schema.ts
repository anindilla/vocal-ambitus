import { relations, sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender_identity', ['woman', 'man', 'nonbinary', 'prefer-not-to-say']);
export const stepEnum = pgEnum('recording_step', ['speaking', 'song', 'range']);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  gender: genderEnum('gender').notNull(),
  experienceLevel: text('experience_level').notNull().default('beginner'),
  notes: text('notes'),
  clientMetadata: jsonb('client_metadata').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const recordings = pgTable('recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  step: stepEnum('step').notNull(),
  patternId: text('pattern_id'),
  blobUrl: text('blob_url').notNull(),
  durationMs: integer('duration_ms'),
  peakLevel: integer('peak_level'),
  pitchStats: jsonb('pitch_stats').$type<{
    min?: number;
    max?: number;
    median?: number;
    confidence?: number;
  } | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  voiceCategory: text('voice_category'),
  rangeSummary: jsonb('range_summary').$type<{
    lowestMidi: number;
    highestMidi: number;
    detectedCategory: string | null;
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const sessionRelations = relations(sessions, ({ many }) => ({
  recordings: many(recordings),
  analyses: many(analyses)
}));

export const recordingRelations = relations(recordings, ({ one }) => ({
  session: one(sessions, {
    fields: [recordings.sessionId],
    references: [sessions.id]
  })
}));

export const analysisRelations = relations(analyses, ({ one }) => ({
  session: one(sessions, {
    fields: [analyses.sessionId],
    references: [sessions.id]
  })
}));

export type Session = typeof sessions.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;

