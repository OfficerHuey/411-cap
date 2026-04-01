import type {
  UserDto, LoginDto, RegisterDto, Semester, CreateSemesterDto,
  Schedule, CreateScheduleDto, Course, Section, CreateSectionDto,
  Student, CreateStudentDto, Room, Instructor, ConflictResult,
  SectionWithConflicts
} from "./Types";

const API_BASE = "/api";

// ===== token management =====
function getToken(): string | null {
  return localStorage.getItem("jwt_token");
}

function setToken(token: string): void {
  localStorage.setItem("jwt_token", token);
}

function clearToken(): void {
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("username");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getUsername(): string {
  return localStorage.getItem("username") || "";
}

export function getUserRole(): string {
  return localStorage.getItem("user_role") || "";
}

// ===== fetch wrapper =====
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
}

async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
}

async function apiDownload(endpoint: string): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, { headers });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.blob();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== auth api =====
export async function login(dto: LoginDto): Promise<UserDto> {
  const user = await apiFetch<UserDto>("/auth/login", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  setToken(user.token);
  localStorage.setItem("username", user.username);
  localStorage.setItem("user_role", user.role);
  return user;
}

export async function register(dto: RegisterDto): Promise<UserDto> {
  const user = await apiFetch<UserDto>("/auth/register", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  setToken(user.token);
  localStorage.setItem("username", user.username);
  localStorage.setItem("user_role", user.role);
  return user;
}

export function logout(): void {
  clearToken();
  window.location.href = "/login";
}

// ===== semesters api =====
export const semesters = {
  getAll: () => apiFetch<Semester[]>("/semesters"),
  create: (dto: CreateSemesterDto) => apiFetch<Semester>("/semesters", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: CreateSemesterDto) => apiFetch<void>(`/semesters/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  delete: (id: number) => apiFetch<void>(`/semesters/${id}`, { method: "DELETE" }),
  toggleLock: (id: number) => apiFetch<{ isLocked: boolean }>(`/semesters/${id}/lock`, { method: "PUT" }),
  clone: (sourceId: number, dto: CreateSemesterDto) => apiFetch<Semester>(`/semesters/clone/${sourceId}`, { method: "POST", body: JSON.stringify(dto) }),
};

// ===== schedules api =====
export const schedules = {
  getById: (id: number) => apiFetch<Schedule>(`/schedules/${id}`),
  getBySemester: (semesterId: number, level?: number) => {
    const query = level != null ? `?level=${level}` : "";
    return apiFetch<Schedule[]>(`/schedules/semester/${semesterId}${query}`);
  },
  create: (dto: CreateScheduleDto) => apiFetch<Schedule>("/schedules", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: Partial<CreateScheduleDto>) => apiFetch<void>(`/schedules/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  delete: (id: number) => apiFetch<void>(`/schedules/${id}`, { method: "DELETE" }),
  clone: (sourceId: number, body: { newName: string; newLocation?: string }) =>
    apiFetch<Schedule>(`/schedules/clone/${sourceId}`, { method: "POST", body: JSON.stringify(body) }),
  reorder: (items: { id: number; sortOrder: number }[]) =>
    apiFetch<void>("/schedules/reorder", { method: "PUT", body: JSON.stringify(items) }),
  capacityOverview: (semesterId: number) => apiFetch<any[]>(`/schedules/semester/${semesterId}/capacity`),
  updateCapacity: (id: number, capacity: number) =>
    apiFetch<void>(`/schedules/${id}/capacity`, { method: "PUT", body: JSON.stringify(capacity) }),
};

// ===== courses api =====
export const courses = {
  getPalette: (semesterLevel: number) => apiFetch<Course[]>(`/courses/palette/${semesterLevel}`),
  create: (dto: Partial<Course>) => apiFetch<Course>("/courses", { method: "POST", body: JSON.stringify(dto) }),
};

// ===== sections api =====
export const sections = {
  createOrLink: (dto: CreateSectionDto) =>
    apiFetch<SectionWithConflicts>("/sections", { method: "POST", body: JSON.stringify(dto) }),
  getAllForSemester: (semesterId: number) =>
    apiFetch<Section[]>(`/sections/semester/${semesterId}`),
  update: (id: number, dto: Partial<CreateSectionDto>) =>
    apiFetch<void>(`/sections/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  removeFromSchedule: (sectionId: number, scheduleId: number) =>
    apiFetch<void>(`/sections/${sectionId}/schedule/${scheduleId}`, { method: "DELETE" }),
};

// ===== students api =====
export const students = {
  getBySchedule: (scheduleId: number) => apiFetch<Student[]>(`/students/schedule/${scheduleId}`),
  create: (dto: CreateStudentDto) => apiFetch<Student>("/students", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: Partial<CreateStudentDto>) => apiFetch<void>(`/students/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  delete: (id: number) => apiFetch<void>(`/students/${id}`, { method: "DELETE" }),
};

// ===== rooms api =====
export const rooms = {
  getAll: (campus?: string) => apiFetch<Room[]>(`/rooms${campus ? `?campus=${campus}` : ""}`),
  getById: (id: number) => apiFetch<Room>(`/rooms/${id}`),
  create: (dto: Partial<Room>) => apiFetch<Room>("/rooms", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: Partial<Room>) => apiFetch<void>(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  delete: (id: number) => apiFetch<void>(`/rooms/${id}`, { method: "DELETE" }),
  getSections: (id: number, semesterId: number) =>
    apiFetch<Section[]>(`/rooms/${id}/sections?semesterId=${semesterId}`),
};

// ===== instructors api =====
export const instructors = {
  getAll: () => apiFetch<Instructor[]>("/instructors"),
  getById: (id: number) => apiFetch<Instructor>(`/instructors/${id}`),
  create: (dto: Partial<Instructor>) => apiFetch<Instructor>("/instructors", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: Partial<Instructor>) => apiFetch<void>(`/instructors/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  delete: (id: number) => apiFetch<void>(`/instructors/${id}`, { method: "DELETE" }),
};

// ===== conflicts api =====
export const conflicts = {
  check: (dto: Partial<CreateSectionDto>) =>
    apiFetch<ConflictResult[]>("/conflicts/check", { method: "POST", body: JSON.stringify(dto) }),
};

// ===== import api =====
export const importApi = {
  uploadStudents: (semesterId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<any>(`/import/students/${semesterId}`, formData);
  },
  commitStudents: (assignments: { name: string; wNumber: string; email: string; scheduleId: number }[]) =>
    apiFetch<{ committed: number }>("/import/students/commit", { method: "POST", body: JSON.stringify(assignments) }),
};

// ===== changelog api =====
export const changelog = {
  get: (semesterId?: number) =>
    apiFetch<any[]>(`/changelog${semesterId ? `?semesterId=${semesterId}` : ""}`),
};

// ===== export api =====
export const exports = {
  roster: async (semesterId: number, semesterName: string) => {
    const blob = await apiDownload(`/export/roster/${semesterId}`);
    downloadBlob(blob, `${semesterName}_Student_Rosters.xlsx`);
  },
  grid: async (semesterId: number, semesterName: string) => {
    const blob = await apiDownload(`/export/grid/${semesterId}`);
    downloadBlob(blob, `${semesterName}_Visual_Grids.xlsx`);
  },
  registrar: async (semesterId: number, semesterName: string) => {
    const blob = await apiDownload(`/export/registrar/${semesterId}`);
    downloadBlob(blob, `${semesterName}_Registrar_Export.xlsx`);
  },
};
