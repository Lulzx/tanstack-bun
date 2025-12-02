import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
}

const data: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "active" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "User", status: "active" },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "Editor", status: "inactive" },
  { id: 4, name: "Diana Prince", email: "diana@example.com", role: "Admin", status: "active" },
  { id: 5, name: "Eve Wilson", email: "eve@example.com", role: "User", status: "inactive" },
  { id: 6, name: "Frank Miller", email: "frank@example.com", role: "Editor", status: "active" },
];

export function TableDemo() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: "id", header: "ID", size: 60 },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "role", header: "Role", size: 100 },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <span
              style={{
                padding: "0.2rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                background: status === "active" ? "#16a34a" : "#71717a",
                color: "white",
              }}
            >
              {status}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <h2>TanStack Table</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Headless UI for building tables
      </p>

      <div className="card">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search users..."
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1rem",
            background: "#262626",
            border: "1px solid #444",
            borderRadius: "6px",
            color: "white",
          }}
        />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        padding: "0.75rem",
                        textAlign: "left",
                        borderBottom: "1px solid #444",
                        cursor: header.column.getCanSort() ? "pointer" : "default",
                        userSelect: "none",
                        background: "#262626",
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && " ↑"}
                      {header.column.getIsSorted() === "desc" && " ↓"}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #333" }}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: "0.75rem" }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
          Features: Sorting, filtering, custom cell renderers
        </p>
      </div>
    </div>
  );
}
