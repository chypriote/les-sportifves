# Football Admin

A frontend-only web app (React + Vite + TypeScript) that puts a login and a clean interface in front of the association's Google Sheet. There is no backend and no database: the browser talks to the Google Sheets API directly, signed in as the member.

## How access control works

Members sign in with Google. The app asks Google for permission to use the Sheets API **as that member**, so Google decides what they can do:

- Sheet not shared with the member: they get a permission error and see no data.
- Shared as Viewer: they can read, writes fail.
- Shared as Editor: they can add, edit and delete rows.

To add or remove a member, or to change their role, change the sharing on the sheet. There is no separate allowlist to keep in sync.

## Setup

1. **Sheet.** Row 1 of each tab holds column headers. List the tabs in `src/config.ts`.
2. **Google Cloud.** In [Google Cloud Console](https://console.cloud.google.com/), create a project, enable the **Google Sheets API**, then configure the OAuth consent screen.
   - If the association uses Google Workspace, choose **Internal**.
   - Otherwise leave the app in **Testing** and list each member under Test users (up to 100).
3. **OAuth client.** Credentials, then Create credentials, then OAuth client ID, type **Web application**. Add `http://localhost:5173` and your production URL as Authorized JavaScript origins.
4. **Environment.** Copy `.env.example` to `.env` and fill in the client ID and the spreadsheet ID (the long part of the sheet URL).

```bash
npm install
npm run dev
```

## Deploy

`npm run build` outputs a static site in `dist/`. Host it free on GitHub Pages, Cloudflare Pages or Netlify, and add that URL as an authorized JavaScript origin. The client ID is public by design.

## Limits of this approach

- Access is per sheet, not per tab or row. Data that only some members may see belongs in a separate spreadsheet.
- No audit log beyond the sheet's own version history.
- Files in Drive (documents, receipts) are not handled yet.
