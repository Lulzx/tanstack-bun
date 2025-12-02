import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

// Generate 10,000 items
const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i + 1}`,
  description: `This is the description for item number ${i + 1}`,
  value: Math.floor(Math.random() * 1000),
}));

export function VirtualDemo() {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div>
      <h2>TanStack Virtual</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Virtualize large lists efficiently
      </p>

      <div className="card">
        <p style={{ marginBottom: "1rem" }}>
          <strong>10,000 items</strong> - Only visible items are rendered
        </p>

        <div
          ref={parentRef}
          style={{
            height: "400px",
            overflow: "auto",
            background: "#262626",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = items[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                    padding: "0.5rem 1rem",
                    borderBottom: "1px solid #333",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {item.description}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#374151",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  >
                    ${item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
          <span className="muted">
            Rendered: <strong>{virtualizer.getVirtualItems().length}</strong> items
          </span>
          <span className="muted">
            Total: <strong>{items.length.toLocaleString()}</strong> items
          </span>
        </div>

        <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
          Features: Window virtualization, variable heights, overscan
        </p>
      </div>
    </div>
  );
}
