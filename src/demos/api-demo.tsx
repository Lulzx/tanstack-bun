import { useState, useCallback } from "react";

interface Post {
  id: number;
  title: string;
  author: string;
  views: number;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

export function ApiDemo() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [newPost, setNewPost] = useState({ title: "", author: "" });
  const [loading, setLoading] = useState("");
  const [response, setResponse] = useState<string>("");

  const fetchHealth = useCallback(async () => {
    setLoading("health");
    const res = await fetch("/api/health");
    const data = await res.json();
    setHealth(data);
    setResponse(JSON.stringify(data, null, 2));
    setLoading("");
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading("posts");
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.data);
    setResponse(JSON.stringify(data, null, 2));
    setLoading("");
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading("users");
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.data);
    setResponse(JSON.stringify(data, null, 2));
    setLoading("");
  }, []);

  const createPost = useCallback(async () => {
    if (!newPost.title || !newPost.author) return;
    setLoading("create");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    });
    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
    setNewPost({ title: "", author: "" });
    setLoading("");
    fetchPosts();
  }, [newPost, fetchPosts]);

  const deletePost = useCallback(async (id: number) => {
    setLoading(`delete-${id}`);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setResponse(`Deleted post ${id}`);
    setLoading("");
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div>
      <h2>API Routes</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        REST endpoints alongside your frontend
      </p>

      <div className="card">
        <h3>Health Check</h3>
        <p className="muted" style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>
          <code>GET /api/health</code>
        </p>
        <button
          onClick={fetchHealth}
          disabled={loading === "health"}
          style={{
            padding: "0.5rem 1rem",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading === "health" ? "Loading..." : "Check Health"}
        </button>
        {health && (
          <div style={{ marginTop: "0.5rem" }}>
            <span className="badge">{health.status}</span>
            <span className="muted" style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
              {health.timestamp}
            </span>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Posts API</h3>
        <p className="muted" style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>
          <code>GET/POST /api/posts</code> | <code>GET/PUT/DELETE /api/posts/:id</code>
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            onClick={fetchPosts}
            disabled={!!loading}
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading === "posts" ? "Loading..." : "List Posts"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Title"
            value={newPost.title}
            onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
            style={{
              padding: "0.5rem",
              background: "#262626",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "white",
              flex: 1,
            }}
          />
          <input
            type="text"
            placeholder="Author"
            value={newPost.author}
            onChange={(e) => setNewPost((p) => ({ ...p, author: e.target.value }))}
            style={{
              padding: "0.5rem",
              background: "#262626",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "white",
              width: "120px",
            }}
          />
          <button
            onClick={createPost}
            disabled={!newPost.title || !newPost.author || !!loading}
            style={{
              padding: "0.5rem 1rem",
              background: newPost.title && newPost.author ? "#16a34a" : "#374151",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: newPost.title && newPost.author && !loading ? "pointer" : "not-allowed",
            }}
          >
            Create
          </button>
        </div>

        {posts.length > 0 && (
          <div style={{ fontSize: "0.9rem" }}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem",
                  background: "#262626",
                  borderRadius: "4px",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <strong>{post.title}</strong>
                  <span className="muted" style={{ marginLeft: "0.5rem" }}>
                    by {post.author}
                  </span>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={loading === `delete-${post.id}`}
                  style={{
                    padding: "0.25rem 0.5rem",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Users API</h3>
        <p className="muted" style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>
          <code>GET/POST /api/users</code> | <code>GET/PUT/DELETE /api/users/:id</code>
        </p>

        <button
          onClick={fetchUsers}
          disabled={!!loading}
          style={{
            padding: "0.5rem 1rem",
            background: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "wait" : "pointer",
            marginBottom: "1rem",
          }}
        >
          {loading === "users" ? "Loading..." : "List Users"}
        </button>

        {users.length > 0 && (
          <div style={{ fontSize: "0.9rem" }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem",
                  background: "#262626",
                  borderRadius: "4px",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <strong>{user.name}</strong>
                  <span className="muted" style={{ marginLeft: "0.5rem" }}>
                    {user.email}
                  </span>
                </div>
                <span
                  style={{
                    padding: "0.125rem 0.5rem",
                    background: user.role === "admin" ? "#dc2626" : "#2563eb",
                    color: "white",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                  }}
                >
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {response && (
        <div className="card">
          <h3>Last Response</h3>
          <pre
            style={{
              background: "#262626",
              padding: "1rem",
              borderRadius: "6px",
              overflow: "auto",
              fontSize: "0.85rem",
              maxHeight: "200px",
            }}
          >
            {response}
          </pre>
        </div>
      )}

      <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        Features: REST endpoints, path params, CRUD operations
      </p>
    </div>
  );
}
