const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("jwt_token");
}

async function noteFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    localStorage.removeItem("display_name");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
}

// ===== types =====
export interface NoteDto {
  id: number;
  title: string;
  body: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
  isDone: boolean;
  semesterId: number | null;
  semesterName: string | null;
  scheduleId: number | null;
  scheduleName: string | null;
  sectionId: number | null;
  sectionLabel: string | null;
}

export interface CreateNoteDto {
  title: string;
  body: string;
  semesterId?: number | null;
  scheduleId?: number | null;
  sectionId?: number | null;
}

export interface UpdateNoteDto {
  title?: string;
  body?: string;
  isDone?: boolean;
}

export interface NoteAuthor {
  id: number;
  name: string;
}

// ===== api =====
export const notesApi = {
  getAll: (params?: {
    semesterId?: number;
    scheduleId?: number;
    sectionId?: number;
    status?: string;
    author?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.semesterId) qs.set("semesterId", String(params.semesterId));
    if (params?.scheduleId) qs.set("scheduleId", String(params.scheduleId));
    if (params?.sectionId) qs.set("sectionId", String(params.sectionId));
    if (params?.status) qs.set("status", params.status);
    if (params?.author) qs.set("author", params.author);
    const q = qs.toString();
    return noteFetch<NoteDto[]>(`/notes${q ? `?${q}` : ""}`);
  },

  getById: (id: number) => noteFetch<NoteDto>(`/notes/${id}`),

  create: (dto: CreateNoteDto) =>
    noteFetch<NoteDto>("/notes", { method: "POST", body: JSON.stringify(dto) }),

  update: (id: number, dto: UpdateNoteDto) =>
    noteFetch<NoteDto>(`/notes/${id}`, { method: "PUT", body: JSON.stringify(dto) }),

  delete: (id: number) =>
    noteFetch<void>(`/notes/${id}`, { method: "DELETE" }),

  getAuthors: () => noteFetch<NoteAuthor[]>("/notes/authors"),
};
