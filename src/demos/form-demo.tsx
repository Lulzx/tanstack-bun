import { useForm } from "@tanstack/react-form";

export function FormDemo() {
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      age: 0,
      subscribe: false,
    },
    onSubmit: async ({ value }) => {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 500));
      alert(`Form submitted!\n${JSON.stringify(value, null, 2)}`);
    },
  });

  const inputStyle = {
    width: "100%",
    padding: "0.5rem",
    background: "#262626",
    border: "1px solid #444",
    borderRadius: "6px",
    color: "white",
    marginTop: "0.25rem",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "1rem",
  };

  return (
    <div>
      <h2>TanStack Form</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Type-safe form state management
      </p>

      <div className="card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="firstName"
            validators={{
              onChange: ({ value }) =>
                value.length < 2 ? "First name must be at least 2 characters" : undefined,
            }}
          >
            {(field) => (
              <label style={labelStyle}>
                <span>First Name</span>
                <input
                  style={inputStyle}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="John"
                />
                {field.state.meta.errors.length > 0 && (
                  <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </label>
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <label style={labelStyle}>
                <span>Last Name</span>
                <input
                  style={inputStyle}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Doe"
                />
              </label>
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                value && !value.includes("@") ? "Invalid email address" : undefined,
            }}
          >
            {(field) => (
              <label style={labelStyle}>
                <span>Email</span>
                <input
                  style={inputStyle}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="john@example.com"
                />
                {field.state.meta.errors.length > 0 && (
                  <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </label>
            )}
          </form.Field>

          <form.Field name="age">
            {(field) => (
              <label style={labelStyle}>
                <span>Age</span>
                <input
                  style={inputStyle}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
              </label>
            )}
          </form.Field>

          <form.Field name="subscribe">
            {(field) => (
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
                <span>Subscribe to newsletter</span>
              </label>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: canSubmit ? "#2563eb" : "#374151",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  width: "100%",
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            )}
          </form.Subscribe>
        </form>

        <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
          Features: Field validation, form state, type-safe values
        </p>
      </div>
    </div>
  );
}
