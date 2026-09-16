import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, initDb } from "./db.js";

const skip = !process.env.DB_HOST;

test("initDb creates messages table", { skip }, async () => {
  await initDb();
  const res = await pool.query(
    "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages')",
  );
  assert.equal(res.rows[0].exists, true);
});

test("GET /api/messages returns empty array when no rows", { skip }, async () => {
  const { createApp } = await import("./app.js");
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const port = server.address().port;
    await pool.query("DELETE FROM messages");
    const res = await fetch(`http://127.0.0.1:${port}/api/messages`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 0);
  } finally {
    server.close();
  }
});

test("POST + GET round-trip", { skip }, async () => {
  const { createApp } = await import("./app.js");
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const port = server.address().port;
    await pool.query("DELETE FROM messages");
    const postRes = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "CI", message: "pipeline works" }),
    });
    assert.equal(postRes.status, 201);
    const getRes = await fetch(`http://127.0.0.1:${port}/api/messages`);
    const messages = await getRes.json();
    assert.equal(messages.length, 1);
    assert.equal(messages[0].name, "CI");
  } finally {
    server.close();
  }
});

after(() => pool.end());
