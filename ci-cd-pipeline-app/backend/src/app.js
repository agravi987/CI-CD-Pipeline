// ===========================================================================
// src/app.js — the Express app itself (BUT NOT the server!)
// ===========================================================================
// 🎯 WHAT THIS FILE DOES (plain English):
//   Builds the API and returns it. Routes:
//     GET  /api/health   → "am I alive?" (the pipeline health-checks this!)
//     GET  /api/messages → last 50 messages
//     POST /api/messages → save a new message
//
// 🧠 WHY IS IT A FUNCTION? (the single most important design choice)
//   We `export createApp()` instead of starting a server here. That lets the
//   tests (Milestone 5) build the app, listen on a random port, and test it —
//   WITHOUT ever starting your real server. The real server lives in
//   src/index.js. This separation is exactly what makes automated testing-
//   of-the-pipeline possible.
// ===========================================================================
import express from "express";
import cors from "cors";
import { pool } from "./db.js";

export function createApp() {
  const app = express();
  app.use(cors());                 // allow browsers from other origins to call us
  app.use(express.json());         // read JSON request bodies into req.body

  // GET /api/health — a tiny "is it up?" answer the pipeline uses to check us
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // GET /api/messages — newest 50 messages
  app.get("/api/messages", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, message, created_at FROM messages ORDER BY created_at DESC LIMIT 50",
      );
      res.json(result.rows);       // send the rows as JSON
    } catch (err) {
      console.error("GET /api/messages failed:", err.message);
      res.status(500).json({ error: "Database error" });
    }
  });

  // POST /api/messages — save a new message
  app.post("/api/messages", async (req, res) => {
    const { name, message } = req.body ?? {};   // pull fields out of the body

    if (!name || !message) {                    // validate: both required
      return res.status(400).json({ error: "name and message are required" });
    }

    try {
      // ⭐ Parameterized query: the $1/$2 placeholders are filled in safely by
      //    the database driver — NEVER by string-concatenating user input.
      //    This is how you prevent SQL injection.
      const result = await pool.query(
        "INSERT INTO messages (name, message) VALUES ($1, $2) RETURNING *",
        [name, message],
      );
      res.status(201).json(result.rows[0]);     // 201 = "created", send it back
    } catch (err) {
      console.error("POST /api/messages failed:", err.message);
      res.status(500).json({ error: "Database error" });
    }
  });

  return app;                     // hand the ready-built app to the caller
}