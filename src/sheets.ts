import { SPREADSHEET_ID } from "./config";

const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

export class SheetsError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      res.status === 403
        ? "You do not have permission for this action. Ask an admin to share the sheet with you."
        : (body?.error?.message ?? res.statusText);
    throw new SheetsError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export interface Table {
  headers: string[];
  rows: string[][];
  sheetId: number;
}

export async function loadTable(token: string, tab: string): Promise<Table> {
  const [values, meta] = await Promise.all([
    call<{ values?: string[][] }>(token, `/values/${encodeURIComponent(tab)}`),
    call<{ sheets: { properties: { sheetId: number; title: string } }[] }>(
      token,
      "?fields=sheets.properties(sheetId,title)",
    ),
  ]);
  const sheet = meta.sheets.find((s) => s.properties.title === tab);
  if (!sheet) throw new SheetsError(404, `Tab "${tab}" not found in the spreadsheet.`);
  const [headers = [], ...rows] = values.values ?? [];
  return {
    headers,
    rows: rows.map((r) => headers.map((_, i) => r[i] ?? "")),
    sheetId: sheet.properties.sheetId,
  };
}

// rowIndex is 0-based among data rows; the sheet row number is rowIndex + 2 because row 1 is the header.
export async function appendRow(token: string, tab: string, row: string[]) {
  await call(
    token,
    `/values/${encodeURIComponent(tab)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [row] }) },
  );
}

export async function updateRow(token: string, tab: string, rowIndex: number, row: string[]) {
  const range = encodeURIComponent(`${tab}!A${rowIndex + 2}`);
  await call(token, `/values/${range}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [row] }),
  });
}

export async function deleteRow(token: string, sheetId: number, rowIndex: number) {
  await call(token, ":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: rowIndex + 1, endIndex: rowIndex + 2 },
          },
        },
      ],
    }),
  });
}
