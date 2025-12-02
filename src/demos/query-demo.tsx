import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Simulated API
const fakeTodos = [
  { id: 1, text: "Learn TanStack Query", done: true },
  { id: 2, text: "Build with Bun", done: false },
  { id: 3, text: "Deploy to production", done: false },
];

async function fetchTodos() {
  await new Promise((r) => setTimeout(r, 500));
  return [...fakeTodos];
}

async function addTodo(text: string) {
  await new Promise((r) => setTimeout(r, 300));
  const newTodo = { id: Date.now(), text, done: false };
  fakeTodos.push(newTodo);
  return newTodo;
}

export function QueryDemo() {
  const [newTodo, setNewTodo] = useState("");
  const queryClient = useQueryClient();

  const { data: todos, isLoading, error } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const mutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setNewTodo("");
    },
  });

  return (
    <div>
      <h2>TanStack Query</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Powerful async state management
      </p>

      <div className="card">
        <h3>Todo List (with caching)</h3>

        <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a todo..."
            style={{
              flex: 1,
              padding: "0.5rem",
              background: "#262626",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "white",
            }}
          />
          <button
            onClick={() => mutation.mutate(newTodo)}
            disabled={!newTodo || mutation.isPending}
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              opacity: !newTodo || mutation.isPending ? 0.5 : 1,
            }}
          >
            {mutation.isPending ? "Adding..." : "Add"}
          </button>
        </div>

        {isLoading && <p>Loading todos...</p>}
        {error && <p style={{ color: "#ef4444" }}>Error: {String(error)}</p>}

        {todos && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  padding: "0.5rem",
                  background: "#262626",
                  marginBottom: "0.5rem",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ opacity: todo.done ? 0.5 : 1, textDecoration: todo.done ? "line-through" : "none" }}>
                  {todo.text}
                </span>
                {todo.done && <span className="badge" style={{ background: "#16a34a", fontSize: "0.7rem" }}>Done</span>}
              </li>
            ))}
          </ul>
        )}

        <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
          Features: useQuery, useMutation, cache invalidation
        </p>
      </div>
    </div>
  );
}
