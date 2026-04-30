import type {
  UserDto, LoginDto, RegisterDto, ProfileDto, UpdateProfileDto,
  Semester, CreateSemesterDto,
  Schedule, CreateScheduleDto, Course, CourseStats, Section, CreateSectionDto,
  Student, StudentDetail, StudentListItem, StudentStats, CreateStudentDto, Room, Instructor, ConflictResult,
  SectionWithConflicts,
  AppFileDTO, FilesPageResponse, UpdateFileDto,
  ConversationDTO, MessageDTO, MessagesPageDTO, SendMessageRequest,
  CreateConversationRequest, UnreadCountDTO, AvailableUserDTO,
} from "./Types";

import { loadingBar } from "../components/ui/LoadingBar";

const API_BASE = "/api";

//track concurrent requests so bar stays active until all finish
let activeRequests = 0;

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
  localStorage.removeItem("display_name");
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

  if (activeRequests === 0) loadingBar.start();
  activeRequests++;

  try {
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
  } finally {
    activeRequests--;
    if (activeRequests === 0) loadingBar.finish();
  }
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

  if (activeRequests === 0) loadingBar.start();
  activeRequests++;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { headers });

    if (response.status === 401) {
      clearToken();
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      //try to read the error body as text so we surface a useful message
      let detail = `HTTP ${response.status}`;
      try {
        const text = await response.text();
        if (text) detail = text;
      } catch {
        //ignore — fall back to the status code
      }
      throw new Error(detail);
    }

    return await response.blob();
  } finally {
    activeRequests--;
    if (activeRequests === 0) loadingBar.finish();
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:?*"<>|]/g, "_");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFileName(filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== auth api =====
export async function login(dto: LoginDto): Promise<UserDto> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (response.status === 401) {
      throw new Error("Invalid username or password.");
    }
    throw new Error(errorText || `Login failed (HTTP ${response.status})`);
  }

  const user: UserDto = await response.json();
  setToken(user.token);
  localStorage.setItem("username", user.username);
  localStorage.setItem("user_role", user.role);
  if (user.displayName) localStorage.setItem("display_name", user.displayName);
  return user;
}

export async function register(dto: RegisterDto): Promise<UserDto> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (response.status === 400) {
      throw new Error(errorText || "Registration failed. Please check your inputs.");
    }
    throw new Error(errorText || `Registration failed (HTTP ${response.status})`);
  }

  const user: UserDto = await response.json();
  setToken(user.token);
  localStorage.setItem("username", user.username);
  localStorage.setItem("user_role", user.role);
  if (user.displayName) localStorage.setItem("display_name", user.displayName);
  return user;
}

export function logout(): void {
  clearToken();
  window.location.href = "/login";
}

// ===== profile api =====
export const profile = {
  getMe: () => apiFetch<ProfileDto>("/auth/me"),
  updateMe: (dto: UpdateProfileDto) =>
    apiFetch<ProfileDto>("/auth/me", { method: "PUT", body: JSON.stringify(dto) }),
};

// ===== password reset api =====
export async function forgotPassword(email: string): Promise<void> {
  await apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
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
  getAll: () => apiFetch<Course[]>("/courses"),
  getPalette: (semesterLevel: number) => apiFetch<Course[]>(`/courses/palette/${semesterLevel}`),
  getStats: () => apiFetch<CourseStats>("/courses/stats"),
  create: (dto: Partial<Course>) => apiFetch<Course>("/courses", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: Partial<Course>) => apiFetch<void>(`/courses/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  delete: (id: number) => apiFetch<void>(`/courses/${id}`, { method: "DELETE" }),
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
  move: (id: number, dto: { dayOfWeek: string; startTime: string; endTime: string; scheduleId: number }) =>
    apiFetch<SectionWithConflicts>(`/sections/${id}/move`, { method: "PUT", body: JSON.stringify(dto) }),
};

// ===== students api =====
export const students = {
  getAll: (filters?: { search?: string; semesterId?: number; semesterLevel?: number; scheduleId?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.semesterId) params.set("semesterId", String(filters.semesterId));
    if (filters?.semesterLevel) params.set("semesterLevel", String(filters.semesterLevel));
    if (filters?.scheduleId) params.set("scheduleId", String(filters.scheduleId));
    const query = params.toString();
    return apiFetch<StudentListItem[]>(`/students${query ? `?${query}` : ""}`);
  },
  getStats: () => apiFetch<StudentStats>("/students/stats"),
  getBySchedule: (scheduleId: number) => apiFetch<Student[]>(`/students/schedule/${scheduleId}`),
  getDetail: (id: number) => apiFetch<StudentDetail>(`/students/${id}/detail`),
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
  getWorkload: (id: number, semesterId: number) => apiFetch<any>(`/instructors/${id}/workload?semesterId=${semesterId}`),
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
    return apiUpload<ImportResult>(`/import/students/${semesterId}`, formData);
  },
  commitStudents: (assignments: CommitStudent[]) =>
    apiFetch<{ committed: number; rejected: any[] }>("/import/students/commit", { method: "POST", body: JSON.stringify(assignments) }),
  downloadTemplate: async () => {
    const blob = await apiDownload("/import/students/template");
    downloadBlob(blob, "Nursing_Student_Import_Template.xlsx");
  },
};

// ===== instructor import api =====
export const importInstructors = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<InstructorImportResult>("/import/instructors", formData);
  },
  commit: (instructors: CommitInstructor[]) =>
    apiFetch<{ inserted: number; updated: number }>("/import/instructors/commit", { method: "POST", body: JSON.stringify(instructors) }),
  downloadTemplate: async () => {
    const blob = await apiDownload("/import/instructors/template");
    downloadBlob(blob, "Nursing_Instructor_Import_Template.xlsx");
  },
};

// ===== room import api =====
export const importRooms = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<RoomImportResult>("/import/rooms", formData);
  },
  commit: (rooms: CommitRoom[]) =>
    apiFetch<{ inserted: number; updated: number }>("/import/rooms/commit", { method: "POST", body: JSON.stringify(rooms) }),
  downloadTemplate: async () => {
    const blob = await apiDownload("/import/rooms/template");
    downloadBlob(blob, "Nursing_Room_Import_Template.xlsx");
  },
};

// ===== messaging api =====
export const messagingApi = {
  listConversations: () => apiFetch<ConversationDTO[]>("/conversations"),
  getConversation: (id: number) => apiFetch<ConversationDTO>(`/conversations/${id}`),
  getMessages: (id: number, page = 1, pageSize = 100) =>
    apiFetch<MessagesPageDTO>(`/conversations/${id}/messages?page=${page}&pageSize=${pageSize}`),
  sendMessage: (id: number, dto: SendMessageRequest) =>
    apiFetch<MessageDTO>(`/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  markRead: (id: number) =>
    apiFetch<void>(`/conversations/${id}/read`, { method: "PUT" }),
  createConversation: (dto: CreateConversationRequest) =>
    apiFetch<ConversationDTO>("/conversations", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  unreadCount: () => apiFetch<UnreadCountDTO>("/conversations/unread-count"),
  availableUsers: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiFetch<AvailableUserDTO[]>(`/users/available${q}`);
  },
};

// ===== centralized files api =====
//interface that lets callers pass either a simple filename or advanced list options
export interface FilesListOpts {
  search?: string;
  sortBy?: "uploadedAt" | "fileName" | "fileSize";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export const filesApi = {
  list: (opts: FilesListOpts = {}) => {
    const params = new URLSearchParams();
    if (opts.search) params.set("search", opts.search);
    if (opts.sortBy) params.set("sortBy", opts.sortBy);
    if (opts.sortDir) params.set("sortDir", opts.sortDir);
    if (opts.page) params.set("page", String(opts.page));
    if (opts.pageSize) params.set("pageSize", String(opts.pageSize));
    const q = params.toString();
    return apiFetch<FilesPageResponse>(`/files${q ? `?${q}` : ""}`);
  },
  get: (id: number) => apiFetch<AppFileDTO>(`/files/${id}`),
  //returns a blob URL (createObjectURL) authenticated via our JWT fetch so
  //iframe src / img src work for private file bytes
  previewUrl: async (id: number): Promise<{ url: string; cleanup: () => void; blob: Blob }> => {
    const blob = await apiDownload(`/files/${id}/preview`);
    const url = URL.createObjectURL(blob);
    return { url, cleanup: () => URL.revokeObjectURL(url), blob };
  },
  downloadToDisk: async (id: number, filename: string) => {
    const blob = await apiDownload(`/files/${id}/download`);
    downloadBlob(blob, filename);
  },
  upload: (file: File, title?: string, description?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (title) fd.append("title", title);
    if (description) fd.append("description", description);
    return apiUpload<AppFileDTO>("/files", fd);
  },
  update: (id: number, dto: UpdateFileDto) =>
    apiFetch<AppFileDTO>(`/files/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  delete: (id: number) =>
    apiFetch<void>(`/files/${id}`, { method: "DELETE" }),
};

// ===== import types =====
export interface ImportedStudent {
  name: string;
  wNumber: string;
  semesterLevel: number;
  locationTag: string;
  validationError: string | null;
  rowNumber: number;
}

export interface StudentAssignment {
  student: ImportedStudent;
  scheduleId: number;
  scheduleName: string;
  requiresOverride: boolean;
}

export interface ImportResult {
  totalParsed: number;
  assignments: StudentAssignment[];
  unassigned: ImportedStudent[];
  errors: ImportedStudent[];
}

export interface CommitStudent {
  name: string;
  wNumber: string;
  scheduleId: number;
  acknowledgeOverride?: boolean;
  overrideReason?: string;
}

export interface ImportedInstructor {
  name: string;
  email: string | null;
  type: string;
  phone: string | null;
  validationError: string | null;
  rowNumber: number;
}

export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

export interface InstructorImportResult {
  totalParsed: number;
  valid: ImportedInstructor[];
  errors: ImportRowError[];
}

export interface CommitInstructor {
  name: string;
  email: string | null;
  type: string;
  phone: string | null;
}

export interface ImportedRoom {
  number: string;
  building: string;
  campus: string;
  capacity: number;
  type: string;
  validationError: string | null;
  rowNumber: number;
}

export interface RoomImportResult {
  totalParsed: number;
  valid: ImportedRoom[];
  errors: ImportRowError[];
}

export interface CommitRoom {
  number: string;
  building: string;
  campus: string;
  capacity: number;
  type: string;
}

// ===== changelog api =====
export const changelog = {
  get: (semesterId?: number) =>
    apiFetch<any[]>(`/changelog${semesterId ? `?semesterId=${semesterId}` : ""}`),
  latest: (entityType: string, entityId: number) =>
    apiFetch<{ performedBy: string; timestamp: string } | null>(
      `/changelog/latest?entityType=${entityType}&entityId=${entityId}`
    ),
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
