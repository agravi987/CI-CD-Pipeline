// ===========================================================================
// src/app.test.js — UNIT tests (no database needed)
// ===========================================================================
// 🎯 WHAT THIS FILE DOES (plain English):
//   Proves the API logic works WITHOUT Postgres. It builds the app via
//   createApp(), listens on a random free port, and uses Node's built-in
//   fetch to poke the endpoints. Three tests:
//     1. GET  /api/health  → should return 200 + {status:"ok"}
//     2. POST without a body → should return 400
//     3. POST with a body missing fields → should return 400
//
//   No Jest/Mocha — this ships inside Node 22 (`node --test`). Zero extra deps.
//
// LINE-BY-LINE: read the `//` comments below.
// ===========================================================================
import { test, before, after } from "node:test";   // Node's built-in test runner
import assert from "node:assert/strict";            // Node's built-in assertions
import { createApp } from "./app.js";               // the app we want to test

const app = createApp();                          // build the app (no server started yet)
const server = app.listen(0, "127.0.0.1");        // port 0 = "pick any free port"
await new Promise((resolve) => server.once("listening", resolve));  // wait until it's up

function baseUrl() {                              // easy helper for fetch URLs
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

after(() => server.close());                      // tidy up: close the server when done

test("GET /api/health returns ok", async () => {
  const res = await fetch(`${baseUrl()}/api/health`);
  assert.equal(res.status, 200);                  // must answer 200
  const body = await res.json();
  assert.equal(body.status, "ok");                // body must say status: "ok"
  assert.equal(typeof body.uptime, "number");     // uptime must be a number
});

test("POST /api/messages without body returns 400", async () => {
  const res = await fetch(`${baseUrl()}/api/messages`, { method: "POST" });
  assert.equal(res.status, 400);                  // 400 = "bad request" (missing data)
  const body = await res.json();
  assert.match(body.error, /name and message are required/);   // correct error message
});

test("POST /api/messages with missing fields returns 400", async () => {
  const res = await fetch(`${baseUrl()}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "test" }),       // only "name", no "message"
  });
  assert.equal(res.status, 400);                  // still a bad request
});