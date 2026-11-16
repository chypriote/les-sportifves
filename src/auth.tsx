import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CLIENT_ID } from "./config";

const SCOPES =
  "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive openid email profile";

interface User {
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
  error: string | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}

// The access token lives in memory only. Access control is enforced by Google:
// a user can read or edit the sheet only if it is shared with their Google account.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useRef<google.accounts.oauth2.TokenClient | null>(null);
  const expiry = useRef(0);

  useEffect(() => {
    const init = () => {
      if (!window.google?.accounts) return false;
      client.current = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (res) => {
          if (res.error || !res.access_token) {
            setError(res.error_description ?? "Sign-in failed.");
            return;
          }
          try {
            const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${res.access_token}` },
            }).then((r) => r.json());
            expiry.current = Date.now() + Number(res.expires_in) * 1000;
            setUser({ email: info.email, name: info.name ?? info.email });
            setToken(res.access_token);
            setError(null);
          } catch {
            setError("Could not read your Google profile.");
          }
        },
        error_callback: (e) => setError(e.message ?? "Sign-in was cancelled."),
      });
      setReady(true);
      return true;
    };
    if (init()) return;
    const id = setInterval(() => init() && clearInterval(id), 100);
    return () => clearInterval(id);
  }, []);

  // Refresh a minute before expiry; an empty prompt re-uses the existing grant without a popup when possible.
  useEffect(() => {
    if (!token) return;
    const wait = Math.max(expiry.current - Date.now() - 60_000, 10_000);
    const id = setTimeout(() => client.current?.requestAccessToken({ prompt: "" }), wait);
    return () => clearTimeout(id);
  }, [token]);

  const signIn = useCallback(() => client.current?.requestAccessToken({ prompt: "select_account" }), []);
  const signOut = useCallback(() => {
    if (token) google.accounts.oauth2.revoke(token, () => {});
    setToken(null);
    setUser(null);
  }, [token]);

  return <AuthContext value={{ user, token, ready, error, signIn, signOut }}>{children}</AuthContext>;
}
