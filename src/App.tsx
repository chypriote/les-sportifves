import { useState } from "react";
import { useAuth } from "./auth";
import { CLIENT_ID, DRIVE_FOLDER_ID, SPREADSHEET_ID, TABS } from "./config";
import { FilesView } from "./FilesView";
import { TableView } from "./TableView";

const FILES_TAB = "__files__";

export function App() {
  const { user, ready, error, signIn, signOut } = useAuth();
  const [tab, setTab] = useState(TABS[0].name);

  if (!CLIENT_ID || !SPREADSHEET_ID) {
    return (
      <main className="center">
        <h1>Setup needed</h1>
        <p>
          Set <code>VITE_GOOGLE_CLIENT_ID</code> and <code>VITE_SPREADSHEET_ID</code> in <code>.env</code>. See the README.
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="center">
        <h1>Football Admin</h1>
        <p>Sign in with the Google account that has access to the association sheet.</p>
        <button onClick={signIn} disabled={!ready}>
          Sign in with Google
        </button>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  return (
    <div className="layout">
      <header>
        <strong>Football Admin</strong>
        <nav>
          {[...TABS, ...(DRIVE_FOLDER_ID ? [{ name: FILES_TAB, label: "Files" }] : [])].map((t) => (
            <button key={t.name} className={t.name === tab ? "active" : ""} onClick={() => setTab(t.name)}>
              {t.label}
            </button>
          ))}
        </nav>
        <span className="who">
          {user.email} <button onClick={signOut}>Sign out</button>
        </span>
      </header>
      <main>
        {tab === FILES_TAB ? <FilesView /> : <TableView key={tab} tab={tab} />}
      </main>
    </div>
  );
}
