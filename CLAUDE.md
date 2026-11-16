# Football Admin

Frontend-only React 19 + Vite + TypeScript app: a login and UI in front of an association's Google Sheet (and optionally a Drive folder). No backend, no database. The browser calls the Google Sheets/Drive APIs directly with the signed-in member's OAuth token, so Google sharing settings are the access control.

## Commands

- `npm run dev` — Vite dev server on http://localhost:5173
- `npm run typecheck` — `tsc -b` (there is no test suite or linter; run this after changes)
- `npm run build` — typecheck + production build into `dist/`

## Layout

- `src/config.ts` — env vars and the `TABS` list (one entry per sheet tab; row 1 of each tab holds headers)
- `src/auth.tsx` — Google Identity Services sign-in and token handling
- `src/sheets.ts` / `src/drive.ts` — thin REST clients for the Sheets and Drive APIs
- `src/App.tsx`, `TableView.tsx`, `FilesView.tsx` — UI (sheet tabs, Files tab)

## Environment

Copy `.env.example` to `.env` (gitignored): `VITE_GOOGLE_CLIENT_ID`, `VITE_SPREADSHEET_ID`, optional `VITE_DRIVE_FOLDER_ID` (enables the Files tab). Never commit `.env`. All `VITE_*` values are bundled into the client, so never put secrets in them.

## Conventions

- Keep it backend-free; don't add servers or stored credentials.
- Don't add per-member allowlists in code; access is managed by sharing the sheet/folder.
- Branches and PRs follow the global branch-naming and PR issue-linking rules.
