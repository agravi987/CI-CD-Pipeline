-- ===========================================================================
-- database/init.sql — the schema Postgres runs on its FIRST boot
-- ===========================================================================
-- 🎯 WHAT THIS FILE DOES (plain English):
--   Docker mounts this file into a fresh Postgres container. Postgres runs it
--   ONCE, the first time, creating the "messages" table — so the backend has
--   somewhere to store the message-wall posts.
--
--   (Same table is also created by backend/src/db.js at startup — belt and
--   braces, so the app works even if this file never ran.)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS messages (      -- make the table unless it exists
  id SERIAL PRIMARY KEY,                   -- auto-increments: 1, 2, 3 ...
  name VARCHAR(100) NOT NULL,              -- who posted (max 100 chars, required)
  message TEXT NOT NULL,                   -- the message itself (required)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- when it was posted (auto-set)
);