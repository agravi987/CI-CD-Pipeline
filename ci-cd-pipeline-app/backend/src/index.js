import { initDb } from "./db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initDb();
    const app = createApp();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Backend listening on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed (is the database up?):", err.message);
    process.exit(1);
  }
}

start();
