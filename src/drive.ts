const API = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink: string;
}

export const isFolder = (f: DriveFile) => f.mimeType === FOLDER_MIME;

async function call<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      res.status === 403 || res.status === 404
        ? "No access to this folder. Ask an admin to share it with you."
        : (body?.error?.message ?? res.statusText),
    );
  }
  return res.json() as Promise<T>;
}

const common = "supportsAllDrives=true";

export async function listFiles(token: string, folderId: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,modifiedTime,size,webViewLink)",
    orderBy: "folder,name",
    pageSize: "200",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });
  return (await call<{ files: DriveFile[] }>(token, `${API}?${params}`)).files;
}

export async function uploadFile(token: string, folderId: string, file: File) {
  const metadata = { name: file.name, parents: [folderId] };
  const body = new FormData();
  body.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  body.append("file", file);
  await call(token, `${UPLOAD}?uploadType=multipart&${common}`, { method: "POST", body });
}

export async function createFolder(token: string, parentId: string, name: string) {
  await call(token, `${API}?${common}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
}

// Moves to the Drive trash rather than deleting permanently, so it can be restored.
export async function trashFile(token: string, fileId: string) {
  await call(token, `${API}/${fileId}?${common}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true }),
  });
}
