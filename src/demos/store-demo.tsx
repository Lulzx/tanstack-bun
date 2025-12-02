import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";

// Create a global store
interface AppState {
  count: number;
  user: { name: string; theme: "light" | "dark" } | null;
  notifications: string[];
}

const appStore = new Store<AppState>({
  count: 0,
  user: null,
  notifications: [],
});

export function StoreDemo() {
  // Subscribe to specific parts of the store
  const count = useStore(appStore, (state) => state.count);
  const user = useStore(appStore, (state) => state.user);
  const notifications = useStore(appStore, (state) => state.notifications);

  const increment = () => {
    appStore.setState((state) => ({ ...state, count: state.count + 1 }));
  };

  const decrement = () => {
    appStore.setState((state) => ({ ...state, count: state.count - 1 }));
  };

  const login = () => {
    appStore.setState((state) => ({
      ...state,
      user: { name: "John Doe", theme: "dark" },
    }));
    addNotification("Welcome back, John!");
  };

  const logout = () => {
    appStore.setState((state) => ({ ...state, user: null }));
    addNotification("You have been logged out");
  };

  const toggleTheme = () => {
    appStore.setState((state) => ({
      ...state,
      user: state.user
        ? { ...state.user, theme: state.user.theme === "dark" ? "light" : "dark" }
        : null,
    }));
  };

  const addNotification = (message: string) => {
    appStore.setState((state) => ({
      ...state,
      notifications: [...state.notifications, message],
    }));
    // Auto-remove after 3 seconds
    setTimeout(() => {
      appStore.setState((state) => ({
        ...state,
        notifications: state.notifications.slice(1),
      }));
    }, 3000);
  };

  return (
    <div>
      <h2>TanStack Store</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Framework-agnostic reactive state
      </p>

      <div className="card">
        <h3>Counter</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1rem 0" }}>
          <button
            onClick={decrement}
            style={{
              padding: "0.5rem 1rem",
              background: "#374151",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            -
          </button>
          <span style={{ fontSize: "2rem", fontWeight: "bold", minWidth: "3rem", textAlign: "center" }}>
            {count}
          </span>
          <button
            onClick={increment}
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="card">
        <h3>User State</h3>
        {user ? (
          <div style={{ margin: "1rem 0" }}>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Theme:</strong> {user.theme}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                onClick={toggleTheme}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#374151",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Toggle Theme
              </button>
              <button
                onClick={logout}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div style={{ margin: "1rem 0" }}>
            <p className="muted">Not logged in</p>
            <button
              onClick={login}
              style={{
                padding: "0.5rem 1rem",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "0.5rem",
              }}
            >
              Login
            </button>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {notifications.map((notification, i) => (
            <div
              key={i}
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              }}
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        Features: Global state, selectors, reactive updates
      </p>
    </div>
  );
}
