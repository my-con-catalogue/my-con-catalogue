import { boolean, date, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  logoUrl: text('logo_url'),
  isUpcoming: boolean('is_upcoming').notNull().default(false),
  startDate: date('start_date'),
  endDate: date('end_date'),
  location: text('location'),
  instagram: text('instagram'),
  entryStatus: text('entry_status').notNull().default('TBA'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const artists = pgTable('artists', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  instagram: text('instagram'),
  bio: text('bio'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const catalogues = pgTable('catalogues', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull(),
  artistId: integer('artist_id').notNull(),
  booth: text('booth'),
  imageUrl: text('image_url'),
  fandoms: text('fandoms').array().notNull().default([]),
  merchTypes: text('merch_types').array().notNull().default([]),
  stampRally: boolean('stamp_rally').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Flat, easy-to-edit archive rows for Supabase Table Editor.
export const catalogueEntries = pgTable('catalogue_entries', {
  id: serial('id').primaryKey(),
  eventSlug: text('event_slug').notNull().references(() => events.slug, { onDelete: 'cascade' }),
  booth: text('booth_number').notNull(),
  artistName: text('artist_name').notNull(),
  artistInstagrams: text('artist_instagrams').array().notNull().default([]),
  fandoms: text('fandom_tags').array().notNull().default([]),
  merchTypes: text('merch_tags').array().notNull().default([]),
  stampRally: boolean('stamp_rally').notNull().default(false),
  instagramPosts: text('instagram_post_urls').array().notNull().default([]),
  catalogueFileUrls: text('catalogue_file_urls').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const stampRallies = pgTable('stamp_rallies', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  participants: text('participants').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const fanCafes = pgTable('fan_cafes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  fandom: text('fandom'),
  location: text('location'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  instagram: text('instagram'),
  instagramPostUrl: text('instagram_post_url'),
  startTime: text('start_time'),
  endTime: text('end_time'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const suggestions = pgTable('suggestions', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  socialMedia: text('social_media'),
  topic: text('topic').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const artistSubmissions = pgTable('artist_submissions', {
  id: serial('id').primaryKey(),
  submissionType: text('submission_type').notNull(),
  artistName: text('artist_name').notNull(),
  instagram: text('instagram').notNull(),
  email: text('email'),
  eventName: text('event_name').notNull(),
  booth: text('booth'),
  fandoms: text('fandoms'),
  merchTypes: text('merch_types'),
  catalogueUrl: text('catalogue_url'),
  catalogueFilePath: text('catalogue_file_path'),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const fanCafeSubmissions = pgTable('fan_cafe_submissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  socialPlatform: text('social_platform').notNull(),
  socialAccount: text('social_account').notNull(),
  fandom: text('fandom').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
