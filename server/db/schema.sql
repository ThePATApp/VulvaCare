-- =============================================================
-- Database tables. Safe to run many times (IF NOT EXISTS).
-- Runs automatically when the server starts, or with: npm run db:setup
-- Add your own tables at the bottom.
-- =============================================================

-- Community resources the agent can search (food, health, youth programs...)
CREATE TABLE IF NOT EXISTS resources (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  address      TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  website      TEXT NOT NULL DEFAULT '',
  hours        TEXT NOT NULL DEFAULT '',
  languages    TEXT NOT NULL DEFAULT 'English',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A privacy-friendly log: which skill answered, never what the person typed.
CREATE TABLE IF NOT EXISTS chat_logs (
  id         SERIAL PRIMARY KEY,
  skill      TEXT NOT NULL,
  routed_by  TEXT NOT NULL,
  flags      TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resources_category_idx ON resources (category);

-- One educational product check. user_input is the redacted text only.
CREATE TABLE IF NOT EXISTS product_checks (
  id                  BIGSERIAL PRIMARY KEY,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  input_type          VARCHAR(20) NOT NULL,
  user_input          TEXT NOT NULL,
  result              VARCHAR(20) NOT NULL,
  headline            TEXT NOT NULL,
  explanation         TEXT NOT NULL,
  flagged_ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  survey_answer       VARCHAR(10),
  response_time_ms    INTEGER
);
