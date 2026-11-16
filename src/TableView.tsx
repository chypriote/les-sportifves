import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { appendRow, deleteRow, loadTable, updateRow, type Table } from "./sheets";

// editing: a row index, "new", or null
type Editing = number | "new" | null;

export function TableView({ tab }: { tab: string }) {
  const { token } = useAuth();
  const [table, setTable] = useState<Table | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      setTable(await loadTable(token, tab));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token, tab]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Runs a write, then refreshes so the view always matches the sheet.
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      setEditing(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !table) return <p className="error">{error}</p>;
  if (!table || !token) return <p>Loading…</p>;

  const startEdit = (i: Editing) => {
    setDraft(i === "new" ? table.headers.map(() => "") : [...table.rows[i as number]]);
    setEditing(i);
  };

  const needle = filter.trim().toLowerCase();
  const visible = table.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !needle || row.some((c) => c.toLowerCase().includes(needle)));

  return (
    <section>
      <div className="toolbar">
        <input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button onClick={() => startEdit("new")}>Add row</button>
        <button onClick={() => void reload()}>Refresh</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="scroll">
        <table>
          <thead>
            <tr>
              {table.headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map(({ row, index }) => (
              <tr key={index}>
                {row.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
                <td className="actions">
                  <button onClick={() => startEdit(index)}>Edit</button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Delete this row from the sheet? This cannot be undone from here."))
                        void run(() => deleteRow(token, table.sheetId, index));
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="muted">No rows.</p>}
      </div>

      {editing !== null && (
        <dialog open>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(() =>
                editing === "new" ? appendRow(token, tab, draft) : updateRow(token, tab, editing, draft),
              );
            }}
          >
            <h2>{editing === "new" ? "Add row" : "Edit row"}</h2>
            {table.headers.map((h, i) => (
              <label key={h}>
                {h}
                <input value={draft[i] ?? ""} onChange={(e) => setDraft(draft.map((v, j) => (j === i ? e.target.value : v)))} />
              </label>
            ))}
            <div className="actions">
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={busy}>
                Save
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
}
