// ===========================================================================
// src/App.jsx — the message wall UI (the whole frontend)
// ===========================================================================
// 🎯 WHAT THIS FILE DOES (plain English):
//   Draws the page and talks to the backend with three API calls:
//     GET  /api/health   → updates the little status pills
//     GET  /api/messages → fills the feed with existing messages
//     POST /api/messages → saves a new message when you press "Post"
//
//   The React pattern to remember: `useState` holds UI data, `useEffect`
//   loads data when the page first shows, every render is a function of state.
//
// LINE-BY-LINE: comments mark the important parts; the rest is plain styling.
// ===========================================================================
import { useState, useEffect } from "react";
import "./App.css";

const STACK = [   // the tech chips shown in the footer
  { name: "React", icon: "⚛️" },
  { name: "Nginx", icon: "🌐" },
  { name: "Node.js", icon: "⚡" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "Docker", icon: "🐳" },
];

// Turn "John Doe" → "JD" for the little avatar circle
function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Pick a stable color for each name (same name → same color)
function avatarColor(name) {
  let hash = 0;
  for (const ch of name) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  }
  return `hsl(${hash} 55% 42%)`;
}

// Show times as friendly text: "5 minutes ago"
function timeAgo(iso) {
  const date = new Date(iso);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (abs >= size) {
      const value = Math.round(seconds / size);
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        value,
        unit,
      );
    }
  }
  return "just now";
}

// Full date+time version (shown when you hover a timestamp)
function absoluteTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// A tiny pill: Frontend · Nginx / Backend · Node / Database · Postgres
function StatusPill({ label, icon, state }) {
  return (
    <span className={`status-pill ${state}`}>
      <span className="dot" aria-hidden="true" />
      <span>
        {icon} {label}
      </span>
    </span>
  );
}

export default function App() {
  // ---- STATE: everything the UI shows, stored in one place each ----
  const [messages, setMessages] = useState([]);   // the feed items
  const [name, setName] = useState("");           // "Your name" form field
  const [message, setMessage] = useState("");     // "Your message" form field
  const [loading, setLoading] = useState(true);   // skeleton while first load
  const [sending, setSending] = useState(false);  // disable button while posting
  const [error, setError] = useState("");         // error banner text ("" = none)
  const [apiStatus, setApiStatus] = useState("checking"); // ok / down / checking

  // Load messages again (used by the page AND after posting)
  const loadMessages = async () => {
    try {
      const res = await fetch("/api/messages");   // GET the feed
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setMessages(await res.json());
      setError("");
    } catch {
      setError("Could not reach the API. Is the backend running?");
    }
  };

  // ---- EFFECT: runs once, the moment the page appears ----
  useEffect(() => {
    let active = true;   // remember this page is "mounted" (React StrictMode safety)

    async function fetchMessages() {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        if (active) {
          setMessages(data);
          setError("");
        }
      } catch {
        if (active)
          setError("Could not reach the API. Is the backend running?");
      } finally {
        if (active) setLoading(false);   // hide the skeleton either way
      }
    }

    async function fetchHealth() {
      try {
        const res = await fetch("/api/health");   // ask the backend "alive?"
        if (active) setApiStatus(res.ok ? "ok" : "down");
      } catch {
        if (active) setApiStatus("down");
      }
    }

    fetchMessages();
    fetchHealth();

    return () => {
      active = false;   // clean up if the page unmounts early
    };
  }, []);               // [] = "only run ONCE on first render", not again

  // ---- Submit handler: what happens when you press "Post" ----
  async function handleSubmit(e) {
    e.preventDefault();                       // don't reload the page
    if (!name.trim() || !message.trim()) return;   // ignore empty posts
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",                       // send a NEW message
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) throw new Error("Request failed");
      setName("");                            // clear the form
      setMessage("");
      await loadMessages();                   // refresh the feed so it shows up
    } catch {
      setError("Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  const canPost = name.trim() && message.trim() && !sending;  // enable button?

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-badge" aria-hidden="true">
          🐳
        </div>
        <h1>
          Container <span className="accent">Inbox - by Ravi Agrahari</span>
        </h1>
        <p className="tagline">
          A full-stack message wall — React → Node.js → PostgreSQL, every part
          running inside Docker.
        </p>
        <div className="status-strip" aria-label="Stack status">
          <StatusPill label="Frontend · Nginx" icon="🎨" state="ok" />
          <StatusPill label="Backend · Node" icon="⚡" state={apiStatus} />
          <StatusPill label="Database · Postgres" icon="🐘" state={apiStatus} />
        </div>
      </header>

      <main>
        {/* The compose form: name + message + Post button */}
        <form
          className="compose"
          onSubmit={handleSubmit}
          aria-label="Post a message"
        >
          <div className="compose-top">
            <label className="field">
              <span className="field-label">Your name</span>
              <input
                type="text"
                placeholder="e.g. Docker Fan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoComplete="off"
              />
            </label>
            <button
              type="submit"
              className="post-btn"
              disabled={!canPost}
              aria-busy={sending}
            >
              {sending ? "Posting…" : "Post"}
            </button>
          </div>
          <label className="field">
            <span className="field-label">Your message</span>
            <textarea
              placeholder="Say something nice to the stack…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </label>
        </form>

        {/* Error banner (shown only when something went wrong) */}
        {error && (
          <div className="banner error" role="alert">
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* The feed: skeleton → empty state → messages */}
        <section className="feed">
          <div className="feed-head">
            <h2>Messages</h2>
            <span className="count">{messages.length} total</span>
          </div>

          {loading ? (
            <div className="skeleton-list" aria-label="Loading messages">
              {[0, 1, 2].map((i) => (
                <div className="skeleton" key={i}>
                  <span className="skeleton-avatar" />
                  <div className="skeleton-lines">
                    <span className="skeleton-line short" />
                    <span className="skeleton-line" />
                  </div>
                </div>
              ))}
            </div>
          ) : !error && messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                🕊️
              </div>
              <h3>No messages yet</h3>
              <p>Send the first one above — it will show up here instantly.</p>
            </div>
          ) : (
            <ul className="messages">
              {messages.map((m) => (
                <li key={m.id} className="message">
                  <span
                    className="avatar"
                    style={{ backgroundColor: avatarColor(m.name) }}
                    aria-hidden="true"
                  >
                    {initials(m.name) || "?"}
                  </span>
                  <div className="message-body">
                    <div className="message-meta">
                      <strong>{m.name}</strong>
                      <time
                        dateTime={m.created_at}
                        title={absoluteTime(m.created_at)}
                      >
                        {timeAgo(m.created_at)}
                      </time>
                    </div>
                    <p className="message-text">{m.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">
        <p className="footer-label">Powered by</p>
        <div className="chips">
          {STACK.map((s) => (
            <span key={s.name} className="chip">
              <span aria-hidden="true">{s.icon}</span> {s.name}
            </span>
          ))}
        </div>
        <p className="footer-note">
          🐳 The whole stack starts with <code>docker compose up</code>
        </p>
      </footer>
    </div>
  );
}