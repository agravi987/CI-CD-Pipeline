// ===========================================================================
// src/db.test.js — INTEGRATION tests (need a real PostgreSQL database)
// ===========================================================================
// 🎯 WHAT THIS FILE DOES (plain English):
//   Proves the app works WITH a real database — table gets created, messages
//   can be saved and read back. Three tests:
//     1. initDb creates the messages table
//     2. GET /api/messages shows [] before anything is posted
//     3. POST then GET → the message comes back (a "round-trip")
//
// 🧠 THE SKIP TRICK (this is the cool part for CI):
//   `const skip = !process.env.DB_HOST` — if DB_HOST is NOT set, all three
//   tests SKIP themselves silently. So:
//     • locally with no DB → they skip (unit tests still pass)
//     • locally WITH a Postgres container → they run for real
//     • in CI → GitHub starts Postgres and sets DB_HOST → they run for real
//   One file, two modes, zero configuration. 🎩
//
// LINE-BY-LINE: read the `//` comments below.
// ===========================================================================
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, initDb } from "./db.js";

const skip = !process.env.DB_HOST;    // have DB env vars? run. If not, skip.

test("initDb creates messages table", { skip }, async () => {
  await initDb();                                   // create the table
  const res = await pool.query(
    "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages')",
  );
  assert.equal(res.rows[0].exists, true);           // the table must now exist
});

test("GET /api/messages returns empty array when no rows", { skip }, async () => {
  const { createApp } = await import("./app.js");
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");        // fresh app on a free port
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const port = server.address().port;
    await pool.query("DELETE FROM messages");       // start from a clean table
    const res = await fetch(`http://127.0.0.1:${port}/api/messages`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));                 // body must be an array
    assert.equal(body.length, 0);                   // ...and empty
  } finally {
    server.close();                                 // always close, even on failure
  }
});

test("POST + GET round-trip", { skip }, async () => {
  const { createApp } = await import("./app.js");
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const port = server.address().port;
    await pool.query("DELETE FROM messages");       // start clean
    const postRes = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "CI", message: "pipeline works" }),
    });
    assert.equal(postRes.status, 201);              // 201 = created
    const getRes = await fetch(`http://127.0.0.1:${port}/api/messages`);
    const messages = await getRes.json();
    assert.equal(messages.length, 1);               // exactly one message now
    assert.equal(messages[0].name, "CI");           // and it's the one we posted
  } finally {
    server.close();
  }
});

after(() => pool.end());          // close the DB connection pool at the end