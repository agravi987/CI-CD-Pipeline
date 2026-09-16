import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.js";

const app = createApp();
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));

function baseUrl() {
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

after(() => server.close());

test("GET /api/health returns ok", async () => {
  const res = await fetch(`${baseUrl()}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
  assert.equal(typeof body.uptime, "number");
});

test("POST /api/messages without body returns 400", async () => {
  const res = await fetch(`${baseUrl()}/api/messages`, { method: "POST" });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /name and message are required/);
});

test("POST /api/messages with missing fields returns 400", async () => {
  const res = await fetch(`${baseUrl()}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "test" }),
  });
  assert.equal(res.status, 400);
});
