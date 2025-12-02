export { QueryDemo } from "./query-demo";
export { TableDemo } from "./table-demo";
export { FormDemo } from "./form-demo";
export { VirtualDemo } from "./virtual-demo";
export { StoreDemo } from "./store-demo";
export { PacerDemo } from "./pacer-demo";
export { ApiDemo } from "./api-demo";
export {
  SSRDemo,
  FullSSRPage,
  ClientOnlyPage,
  DataOnlyPage,
  StreamingPage,
} from "./ssr-demo";

// TanStack DB demo - DB requires sync backend setup, using placeholder
export function DBDemo() {
  return (
    <div>
      <h2>TanStack DB</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Reactive client store for building super fast apps on sync
      </p>

      <div className="card">
        <h3>About TanStack DB</h3>
        <p style={{ margin: "0.5rem 0" }}>
          TanStack DB is a reactive client store designed for sync-first applications.
          It requires a sync backend configuration for full functionality.
        </p>
        <ul style={{ marginTop: "1rem" }}>
          <li>SQL-like query builder</li>
          <li>Optimistic mutations</li>
          <li>Reactive subscriptions</li>
          <li>Local-first architecture</li>
          <li>Sync with backend databases</li>
        </ul>
        <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Note: Full demo requires sync backend configuration.
          See <code>@tanstack/db</code> documentation for setup.
        </p>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        Features: Collections, reactive queries, sync, optimistic updates
      </p>
    </div>
  );
}
