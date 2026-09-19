// ===========================================================================
// src/index.js — the entry point (the ONLY file that actually STARTS the server)
// ===========================================================================
// 🎯 WHAT THIS FILE DOES (plain English):
//   index.js is the "turn it on" file. `npm start` runs this. It:
//     1. Makes sure the database table exists (initDb)
//     2. Builds the app (createApp)
//     3. Starts listening on a port
//
//   Compare with app.js: app.js CANNOT start a server by itself; it only
//   builds the app and returns it. That's intentional — it's what lets tests
//   import the app without a server. This file is the glue.
// ===========================================================================
import { initDb } from "./db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 3000;   // allow PORT env var, default 3000

async function start() {
  try {
    await initDb();                      // 1) ensure the messages table exists
    const app = createApp();             // 2) build the Express app
    app.listen(PORT, "0.0.0.0", () => {  // 3) start listening (0.0.0.0 = all interfaces)
      console.log(`✅ Backend listening on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    // Fail FAST at startup: if the DB is missing, don't serve a broken API.
    console.error("❌ Startup failed (is the database up?):", err.message);
    process.exit(1);                     // stop the process with a failure code
  }
}

start();                                 // run it