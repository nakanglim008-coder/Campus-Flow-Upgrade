const BASE = "/api";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin" | "security";
  matric: string | null;
  hostel: string | null;
};

export type ExeatStatus = "pending" | "approved" | "rejected" | "departed" | "returned";
export type ExeatType = "regular" | "emergency" | "medical" | "academic";

export type ExeatDTO = {
  id: string;
  code: string;
  studentId: string;
  studentName: string;
  matric: string | null;
  hostel: string | null;
  destination: string;
  reason: string;
  type: ExeatType;
  departDate: string;
  returnDate: string;
  status: ExeatStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = body.error ?? msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    me: () => request<PublicUser>("/auth/me"),
    login: (email: string, password: string) =>
      request<PublicUser>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    signup: (data: {
      email: string;
      password: string;
      name: string;
      role: "student" | "admin" | "security";
      matric?: string;
      hostel?: string;
      inviteToken?: string;
    }) => request<PublicUser>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  },
  exeats: {
    my: () => request<ExeatDTO[]>("/exeats/my"),
    create: (data: {
      destination: string;
      reason: string;
      type: ExeatType;
      departDate: string;
      returnDate: string;
    }) => request<ExeatDTO>("/exeats", { method: "POST", body: JSON.stringify(data) }),
    all: () => request<ExeatDTO[]>("/exeats/all"),
    review: (id: string, status: "approved" | "rejected", rejectReason?: string) =>
      request<{ ok: boolean }>("/exeats/review", {
        method: "PATCH",
        body: JSON.stringify({ id, status, rejectReason }),
      }),
    active: () => request<ExeatDTO[]>("/exeats/active"),
    scan: (code: string) =>
      request<{ kind: "valid-out" | "valid-in" | "invalid" | "expired"; message: string }>("/exeats/scan", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
  },
};
