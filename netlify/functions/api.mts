import type { Context } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, or } from "drizzle-orm";
import {
  users,
  exeatRequests,
} from "../../lib/db/src/schema/index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

type Role = "student" | "admin" | "security";
type JwtPayload = { userId: string; role: Role; name: string };

function getDb() {
  const url = process.env.DATABASE_URL!;
  return drizzle(neon(url), {
    schema: { users, exeatRequests },
  });
}

function getSecret() {
  return process.env.SESSION_SECRET!;
}

const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

function signToken(payload: JwtPayload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}

function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

function makeCode() {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rnd = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `PP-${ts}${rnd}`;
}

function parseCookies(header: string | null) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k.trim()] = decodeURIComponent(rest.join("="));
  });
  return out;
}

function cookieHeader(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Secure`;
}

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

async function getUser(req: Request): Promise<JwtPayload | null> {
  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies["pulsepass_token"];
  if (!token) return null;
  return verifyToken(token);
}

export default async function handler(req: Request, ctx: Context) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "").replace(/^\/\.netlify\/functions\/api/, "");
  const method = req.method.toUpperCase();

  try {
    // Auth routes
    if (path === "/auth/signup" && method === "POST") {
      const body = await req.json();
      const { email, password, name, role, inviteToken, matric, hostel } = body;
      if (!email || !password || !name || !role) return json({ error: "Missing fields" }, 400);
      if (role === "admin" && inviteToken !== process.env.ADMIN_INVITE_TOKEN) return json({ error: "Invalid admin invite token" }, 403);
      if (role === "security" && inviteToken !== process.env.SECURITY_INVITE_TOKEN) return json({ error: "Invalid security invite token" }, 403);
      if (role === "student" && (!matric || !hostel)) return json({ error: "Matric and hostel required" }, 400);

      const db = getDb();
      const norm = email.toLowerCase().trim();
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, norm)).limit(1);
      if (existing.length) return json({ error: "Email already registered" }, 409);

      const passwordHash = await hashPassword(password);
      const [user] = await db.insert(users).values({ email: norm, passwordHash, name, role, matric: role === "student" ? matric : null, hostel: role === "student" ? hostel : null }).returning();
      const token = signToken({ userId: user.id, role: user.role, name: user.name });
      return json({ id: user.id, email: user.email, name: user.name, role: user.role, matric: user.matric, hostel: user.hostel }, 200, {
        "Set-Cookie": cookieHeader("pulsepass_token", token, 30 * 24 * 3600),
      });
    }

    if (path === "/auth/login" && method === "POST") {
      const body = await req.json();
      const db = getDb();
      const norm = (body.email ?? "").toLowerCase().trim();
      const [user] = await db.select().from(users).where(eq(users.email, norm)).limit(1);
      if (!user) return json({ error: "Invalid email or password" }, 401);
      const ok = await verifyPassword(body.password ?? "", user.passwordHash);
      if (!ok) return json({ error: "Invalid email or password" }, 401);
      const token = signToken({ userId: user.id, role: user.role, name: user.name });
      return json({ id: user.id, email: user.email, name: user.name, role: user.role, matric: user.matric, hostel: user.hostel }, 200, {
        "Set-Cookie": cookieHeader("pulsepass_token", token, 30 * 24 * 3600),
      });
    }

    if (path === "/auth/me" && method === "GET") {
      const payload = await getUser(req);
      if (!payload) return json({ error: "Not authenticated" }, 401);
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      if (!user) return json({ error: "User not found" }, 401);
      return json({ id: user.id, email: user.email, name: user.name, role: user.role, matric: user.matric, hostel: user.hostel });
    }

    if (path === "/auth/logout" && method === "POST") {
      return json({ ok: true }, 200, {
        "Set-Cookie": "pulsepass_token=; Path=/; HttpOnly; Max-Age=0",
      });
    }

    // Exeat routes (all require auth)
    const payload = await getUser(req);
    if (!payload) return json({ error: "Not authenticated" }, 401);
    const db = getDb();

    function toDTO(row: { exeat_requests: typeof exeatRequests.$inferSelect; users: typeof users.$inferSelect | null }) {
      const e = row.exeat_requests;
      return { id: e.id, code: e.code, studentId: e.studentId, studentName: row.users?.name ?? "Unknown", matric: row.users?.matric, hostel: row.users?.hostel, destination: e.destination, reason: e.reason, type: e.type, departDate: e.departDate, returnDate: e.returnDate, status: e.status, rejectReason: e.rejectReason, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() };
    }

    if (path === "/exeats/my" && method === "GET") {
      if (payload.role !== "student") return json({ error: "Forbidden" }, 403);
      const rows = await db.select().from(exeatRequests).leftJoin(users, eq(exeatRequests.studentId, users.id)).where(eq(exeatRequests.studentId, payload.userId)).orderBy(desc(exeatRequests.createdAt));
      return json(rows.map(toDTO));
    }

    if (path === "/exeats" && method === "POST") {
      if (payload.role !== "student") return json({ error: "Forbidden" }, 403);
      const body = await req.json();
      const { destination, reason, type, departDate, returnDate } = body;
      const [studentRow] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      const [created] = await db.insert(exeatRequests).values({ code: makeCode(), studentId: payload.userId, destination, reason, type, departDate, returnDate, status: type === "emergency" ? "approved" : "pending" }).returning();
      return json(toDTO({ exeat_requests: created, users: studentRow }), 201);
    }

    if (path === "/exeats/all" && method === "GET") {
      if (payload.role !== "admin") return json({ error: "Forbidden" }, 403);
      const rows = await db.select().from(exeatRequests).leftJoin(users, eq(exeatRequests.studentId, users.id)).orderBy(desc(exeatRequests.createdAt));
      return json(rows.map(toDTO));
    }

    if (path === "/exeats/review" && method === "PATCH") {
      if (payload.role !== "admin") return json({ error: "Forbidden" }, 403);
      const body = await req.json();
      await db.update(exeatRequests).set({ status: body.status, rejectReason: body.status === "rejected" ? (body.rejectReason ?? "No reason given") : null, reviewedBy: payload.userId, updatedAt: new Date() }).where(eq(exeatRequests.id, body.id));
      return json({ ok: true });
    }

    if (path === "/exeats/active" && method === "GET") {
      if (payload.role !== "security") return json({ error: "Forbidden" }, 403);
      const rows = await db.select().from(exeatRequests).leftJoin(users, eq(exeatRequests.studentId, users.id)).where(or(eq(exeatRequests.status, "approved"), eq(exeatRequests.status, "departed"), eq(exeatRequests.status, "returned"))).orderBy(desc(exeatRequests.updatedAt));
      return json(rows.map(toDTO));
    }

    if (path === "/exeats/scan" && method === "POST") {
      if (payload.role !== "security") return json({ error: "Forbidden" }, 403);
      const body = await req.json();
      const code = (body.code ?? "").trim().toUpperCase();
      const [found] = await db.select().from(exeatRequests).leftJoin(users, eq(exeatRequests.studentId, users.id)).where(eq(exeatRequests.code, code)).limit(1);
      if (!found) return json({ kind: "invalid", message: "Pass not recognized." });
      const e = found.exeat_requests;
      if (e.status === "approved") {
        await db.update(exeatRequests).set({ status: "departed", updatedAt: new Date() }).where(eq(exeatRequests.id, e.id));
        return json({ kind: "valid-out", message: `${found.users?.name ?? "Student"} cleared to depart.`, studentName: found.users?.name, destination: e.destination, returnDate: e.returnDate });
      }
      if (e.status === "departed") {
        await db.update(exeatRequests).set({ status: "returned", updatedAt: new Date() }).where(eq(exeatRequests.id, e.id));
        return json({ kind: "valid-in", message: `${found.users?.name ?? "Student"} returned to campus.` });
      }
      return json({ kind: "expired", message: `Pass status: ${e.status}. Cannot scan.` });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: "Internal server error" }, 500);
  }
}

export const config = { path: "/api/*" };
