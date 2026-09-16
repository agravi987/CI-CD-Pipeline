import express from "express";
import cors from "cors";
import { pool } from "./db.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, message, created_at FROM messages ORDER BY created_at DESC LIMIT 50",
      );
      res.json(result.rows);
    } catch (err) {
      console.error("GET /api/messages failed:", err.message);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    const { name, message } = req.body ?? {};

    if (!name || !message) {
      return res.status(400).json({ error: "name and message are required" });
    }

    try {
      const result = await pool.query(
        "INSERT INTO messages (name, message) VALUES ($1, $2) RETURNING *",
        [name, message],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("POST /api/messages failed:", err.message);
      res.status(500).json({ error: "Database error" });
    }
  });

  return app;
}
