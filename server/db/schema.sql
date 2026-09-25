-- PostgreSQL Schema for Music Mantra (Swara Healing)
-- Compliant with TRD-swara-healing-web.md §8 and DPDP Act 2023 Data Minimisation

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  TEXT UNIQUE NOT NULL,
  created_at             TIMESTAMPTZ DEFAULT now(),
  locale                 TEXT DEFAULT 'en',
  reminder_time          TIME,
  disclaimer_accepted_at  TIMESTAMPTZ,
  consent_version        INTEGER DEFAULT 1
);

-- Programs table (one active per user)
CREATE TABLE IF NOT EXISTS programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  condition   TEXT NOT NULL CHECK (condition IN ('diabetes','thyroid','hypertension')),
  started_at  TIMESTAMPTZ DEFAULT now(),
  tuning      TEXT DEFAULT 'just',
  active      BOOLEAN DEFAULT true
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_index       INTEGER NOT NULL,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  sa_pc           TEXT,
  sa_hz           REAL,
  eval_accuracy   REAL,
  mean_accuracy   REAL,
  voiced_seconds  REAL,
  completed       BOOLEAN DEFAULT false,
  app_version     TEXT
);

-- Indexes for performant lookups
CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_program_id ON sessions(program_id);
