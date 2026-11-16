export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
export const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID as string;

// One entry per tab (worksheet) of the Google Sheet. Row 1 of each tab must hold the column headers.
export const TABS: { name: string; label: string }[] = [
  { name: "Members", label: "Members" },
  { name: "Payments", label: "Payments" },
  { name: "Matches", label: "Matches" },
];
