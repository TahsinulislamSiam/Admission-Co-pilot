/**
 * Postgres schema (Neon). Identity, ownership and status live in real columns
 * so they can be indexed and joined; the rich bilingual content that the UI
 * already consumes stays in `data` (jsonb), so the API returns the same shapes
 * the MSW mocks did.
 */
import { pgTable, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(), // stored lower-cased
  name: text('name').notNull(),
  nameEn: text('name_en'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('student'), // 'student' | 'admin'
  profile: jsonb('profile'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable(
  'sessions',
  {
    token: text('token').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)]
)

export const universities = pgTable(
  'universities',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(), // 'public' | 'private'
    published: boolean('published').notNull().default(true),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('universities_type_idx').on(t.type)]
)

export const questions = pgTable(
  'questions',
  {
    id: text('id').primaryKey(),
    subject: text('subject').notNull(),
    status: text('status').notNull().default('approved'),
    data: jsonb('data').notNull(),
  },
  (t) => [index('questions_status_idx').on(t.status)]
)

export const tests = pgTable('tests', {
  id: text('id').primaryKey(),
  data: jsonb('data').notNull(), // title, subject, durationSec, questionIds, ...
})

export const attempts = pgTable(
  'attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    testId: text('test_id')
      .notNull()
      .references(() => tests.id, { onDelete: 'cascade' }),
    data: jsonb('data').notNull(), // answers, labels, stats
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
  },
  (t) => [index('attempts_user_idx').on(t.userId)]
)

export const circulars = pgTable(
  'circulars',
  {
    id: text('id').primaryKey(),
    universityId: text('university_id').references(() => universities.id, {
      onDelete: 'set null',
    }),
    status: text('status').notNull().default('pending_review'),
    data: jsonb('data').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('circulars_status_idx').on(t.status)]
)

/**
 * Video lessons, added by an admin and grouped by subject (math, physics,
 * chemistry, ...) then topic ("Integration"). Only the YouTube URL is stored on
 * top of the plain columns; the rest of the record is editable metadata.
 */
export const videos = pgTable(
  'videos',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    subject: text('subject').notNull(), // 'math' | 'physics' | 'chemistry' | ...
    topic: text('topic').notNull().default(''),
    youtubeUrl: text('youtube_url').notNull(),
    youtubeId: text('youtube_id').notNull(), // 11-char id, used for the embed
    channel: text('channel'),
    addedBy: text('added_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('videos_subject_idx').on(t.subject)]
)

/**
 * In-app mailbox (admin <-> user). Not email: both parties read it inside the
 * app, so it works without SMTP credentials and is fully backed by the database.
 */
export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toUserId: text('to_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('messages_to_idx').on(t.toUserId),
    index('messages_from_idx').on(t.fromUserId),
  ]
)
