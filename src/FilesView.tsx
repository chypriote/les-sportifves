import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth";
import { DRIVE_FOLDER_ID } from "./config";
import { createFolder, isFolder, listFiles, trashFile, uploadFile, type DriveFile } from "./drive";

interface Crumb {
  id: string;
  name: string;
}

export function FilesView() {
  const { token } = useAuth();
  const [path, setPath] = useState<Crumb[]>([{ id: DRIVE_FOLDER_ID, name: "Files" }]);
  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const current = path[path.length - 1];

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      setFiles(await listFiles(token, current.id));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token, current.id]);

  useEffect(() => {
    setFiles(null);
    void reload();
  }, [reload]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) return null;

  return (
    <section>
      <div className="toolbar">
        <div className="crumbs">
          {path.map((c, i) => (
            <button key={c.id} disabled={i === path.length - 1} onClick={() => setPath(path.slice(0, i + 1))}>
              {c.name}
            </button>
          ))}
        </div>
        <button disabled={busy} onClick={() => input.current?.click()}>
          Upload
        </button>
        <button
          disabled={busy}
          onClick={() => {
            const name = prompt("Folder name");
            if (name?.trim()) void run(() => createFolder(token, current.id, name.trim()));
          }}
        >
          New folder
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            e.target.value = "";
            void run(async () => {
              for (const f of picked) await uploadFile(token, current.id, f);
            });
          }}
        />
      </div>
      {error && <p className="error">{error}</p>}
      {!files && !error && <p>Loading…</p>}
      {files && (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Modified</th>
                <th>Size</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td>
                    {isFolder(f) ? (
                      <button className="link" onClick={() => setPath([...path, { id: f.id, name: f.name }])}>
                        📁 {f.name}
                      </button>
                    ) : (
                      <a href={f.webViewLink} target="_blank" rel="noreferrer">
                        {f.name}
                      </a>
                    )}
                  </td>
                  <td>{new Date(f.modifiedTime).toLocaleDateString()}</td>
                  <td>{f.size ? `${Math.round(Number(f.size) / 1024)} KB` : ""}</td>
                  <td className="actions">
                    <button
                      className="danger"
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`Move "${f.name}" to the Drive trash?`)) void run(() => trashFile(token, f.id));
                      }}
                    >
                      Trash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {files.length === 0 && <p className="muted">This folder is empty.</p>}
        </div>
      )}
    </section>
  );
}
