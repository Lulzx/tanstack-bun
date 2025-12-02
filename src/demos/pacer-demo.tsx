import { useState, useCallback } from "react";
import { Throttler, Debouncer, RateLimiter, Queuer } from "@tanstack/pacer";

// Create instances
const throttler = new Throttler(
  (value: string) => console.log(`[Throttled] ${value}`),
  { wait: 500 }
);

const debouncer = new Debouncer(
  (value: string) => console.log(`[Debounced] ${value}`),
  { wait: 500 }
);

const rateLimiter = new RateLimiter(
  (value: string) => console.log(`[Rate Limited] ${value}`),
  { limit: 3, window: 2000 }
);

const queuer = new Queuer<string>(
  async (value) => {
    await new Promise((r) => setTimeout(r, 500));
    console.log(`[Queued] Processed: ${value}`);
    return value;
  },
  { concurrency: 2 }
);

export function PacerDemo() {
  const [throttleCount, setThrottleCount] = useState(0);
  const [throttleExecuted, setThrottleExecuted] = useState(0);
  const [debounceInput, setDebounceInput] = useState("");
  const [debounceOutput, setDebounceOutput] = useState("");
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [rateLimitBlocked, setRateLimitBlocked] = useState(0);
  const [queueItems, setQueueItems] = useState<string[]>([]);
  const [queueProcessed, setQueueProcessed] = useState<string[]>([]);

  const handleThrottle = useCallback(() => {
    setThrottleCount((c) => c + 1);
    const result = throttler.maybeExecute(`Click #${throttleCount + 1}`);
    if (result !== undefined) {
      setThrottleExecuted((c) => c + 1);
    }
  }, [throttleCount]);

  const handleDebounce = useCallback((value: string) => {
    setDebounceInput(value);
    debouncer.maybeExecute(value);
    // Update output after debounce
    setTimeout(() => {
      setDebounceOutput(value);
    }, 550);
  }, []);

  const handleRateLimit = useCallback(() => {
    setRateLimitCount((c) => c + 1);
    const result = rateLimiter.maybeExecute(`Request #${rateLimitCount + 1}`);
    if (result === undefined) {
      setRateLimitBlocked((c) => c + 1);
    }
  }, [rateLimitCount]);

  const addToQueue = useCallback(() => {
    const item = `Task-${Date.now().toString(36)}`;
    setQueueItems((items) => [...items, item]);
    queuer.addItem(item).then(() => {
      setQueueProcessed((p) => [...p, item]);
      setQueueItems((items) => items.filter((i) => i !== item));
    });
  }, []);

  return (
    <div>
      <h2>TanStack Pacer</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Rate limiting, debouncing, throttling, and queueing
      </p>

      <div className="card">
        <h3>Throttler</h3>
        <p className="muted" style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>
          Executes at most once per 500ms
        </p>
        <button
          onClick={handleThrottle}
          style={{
            padding: "0.5rem 1rem",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginRight: "1rem",
          }}
        >
          Click Fast!
        </button>
        <span className="muted">
          Clicks: <strong>{throttleCount}</strong> | Executed: <strong>{throttleExecuted}</strong>
        </span>
      </div>

      <div className="card">
        <h3>Debouncer</h3>
        <p className="muted" style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>
          Waits 500ms after last input before executing
        </p>
        <input
          type="text"
          value={debounceInput}
          onChange={(e) => handleDebounce(e.target.value)}
          placeholder="Type something..."
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "#262626",
            border: "1px solid #444",
            borderRadius: "6px",
            color: "white",
            marginBottom: "0.5rem",
          }}
        />
        <p className="muted">
          Debounced output: <strong>{debounceOutput || "(waiting...)"}</strong>
        </p>
      </div>

      <div className="card">
        <h3>Rate Limiter</h3>
        <p className="muted" style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>
          Max 3 requests per 2 seconds
        </p>
        <button
          onClick={handleRateLimit}
          style={{
            padding: "0.5rem 1rem",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginRight: "1rem",
          }}
        >
          Send Request
        </button>
        <span className="muted">
          Sent: <strong>{rateLimitCount}</strong> | Blocked: <strong style={{ color: "#ef4444" }}>{rateLimitBlocked}</strong>
        </span>
      </div>

      <div className="card">
        <h3>Queuer</h3>
        <p className="muted" style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>
          Concurrent queue with max 2 parallel tasks
        </p>
        <button
          onClick={addToQueue}
          style={{
            padding: "0.5rem 1rem",
            background: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginRight: "1rem",
          }}
        >
          Add Task
        </button>
        <div style={{ marginTop: "0.5rem" }}>
          <span className="muted">
            Pending: <strong>{queueItems.length}</strong> | Processed: <strong>{queueProcessed.length}</strong>
          </span>
          {queueItems.length > 0 && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
              Queue: {queueItems.join(", ")}
            </div>
          )}
        </div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        Features: Throttler, Debouncer, RateLimiter, Queuer
      </p>
    </div>
  );
}
