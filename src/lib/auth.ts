import { SEED_ROLES, isRoleId, type RoleId } from "../config/catalog.ts";

/**
 * Same auth service as ag_co_worker / ap_pl_project.
 * Vite proxies /login and /auth to AUTH_PROXY_TARGET (default http://localhost:3005).
 *
 * POST /login        { email, password } → { code, data: { user } }
 * GET  /auth/session → { code, data: user } | 401/404
 * POST /auth/refresh cookie csrf_token
 * POST /auth/logout  header X-CSRF-Token
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  roleId: RoleId | null;
  roleLabel: string;
};

type AuthFailure = { ok: false; message: string };
type LoginResult = { ok: true; user: SessionUser } | AuthFailure;

const ROLE_BY_NAME: Record<string, RoleId> = {
  admin: "admin",
  administrator: "admin",
  администратор: "admin",
  acoustic: "acoustic",
  акустик: "acoustic",
  hr: "hr",
  кадры: "hr",
  sales: "sales",
  продажи: "sales",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function looksLikeUser(value: Record<string, unknown>): boolean {
  return Boolean(
    value.user_id ||
      value.email ||
      value.role_type ||
      value.role ||
      value.first_name ||
      value.last_name,
  );
}

function extractUserRecord(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  const data = isRecord(payload.data) ? payload.data : payload;
  if (isRecord(data.user) && looksLikeUser(data.user)) return data.user;
  if (isRecord(payload.user) && looksLikeUser(payload.user)) return payload.user;
  if (looksLikeUser(data)) return data;
  return null;
}

function rawRole(record: Record<string, unknown>): string {
  const raw = record.role_type ?? record.role ?? record.roleType ?? "";
  if (isRecord(raw)) {
    return String(raw.type ?? raw.name ?? raw.role_type ?? "")
      .toLowerCase()
      .trim();
  }
  return String(raw).toLowerCase().trim();
}

function mapRole(record: Record<string, unknown>): {
  roleId: RoleId | null;
  roleLabel: string;
} {
  const raw = rawRole(record);
  const roleId = ROLE_BY_NAME[raw] ?? (isRoleId(raw) ? raw : null);
  if (!roleId) return { roleId: null, roleLabel: raw || "Пользователь" };
  const title = SEED_ROLES.find((role) => role.id === roleId)?.title ?? roleId;
  return { roleId, roleLabel: title };
}

function isBlocked(record: Record<string, unknown>): boolean {
  return (
    record.is_active === false ||
    record.is_blocked === true ||
    record.isBlocked === true
  );
}

function mapUser(payload: unknown): SessionUser | null {
  const record = extractUserRecord(payload);
  if (!record || isBlocked(record)) return null;
  const email = String(record.email ?? "").trim();
  const name = [record.last_name, record.first_name, record.middle_name]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const id = String(record.user_id ?? record.id ?? email).trim();
  if (!id && !email) return null;
  const role = mapRole(record);
  return {
    id: id || email,
    name: name || email || "Пользователь",
    email,
    roleId: role.roleId,
    roleLabel: role.roleLabel,
  };
}

function readCookie(name: string): string {
  const prefix = `${name}=`;
  for (const part of document.cookie ? document.cookie.split("; ") : []) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return "";
}

async function readBody(response: Response): Promise<unknown> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorText(body: unknown): string {
  if (!isRecord(body)) return "";
  if (typeof body.error === "string") return body.error;
  if (typeof body.message === "string") return body.message;
  return "";
}

function formatAuthError(status: number, body: unknown): string {
  const raw = errorText(body);
  const lower = raw.toLowerCase();
  if (
    status === 401 ||
    lower.includes("bcrypt") ||
    lower.includes("invalid credential") ||
    lower.includes("hashedpassword") ||
    lower.includes("no rows") ||
    lower.includes("user not found") ||
    lower.includes("getuserbyemail")
  ) {
    return "Неверная почта или пароль.";
  }
  if (status === 403 || lower.includes("blocked") || lower.includes("заблок")) {
    return "Аккаунт заблокирован.";
  }
  return raw.trim() || "Не удалось войти.";
}

async function refreshSession(): Promise<boolean> {
  const csrf = readCookie("csrf_token");
  if (!csrf) return false;
  try {
    const response = await fetch("/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        "X-CSRF-Token": csrf,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchSession(): Promise<SessionUser | null> {
  try {
    let response = await fetch("/auth/session", {
      method: "GET",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (response.status === 401 && (await refreshSession())) {
      response = await fetch("/auth/session", {
        method: "GET",
        credentials: "include",
        headers: { accept: "application/json" },
      });
    }
    if (!response.ok) return null;
    return mapUser(await readBody(response));
  } catch {
    return null;
  }
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  try {
    const response = await fetch("/login", {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password: input.password }),
    });
    const body = await readBody(response);
    if (!response.ok) {
      return { ok: false, message: formatAuthError(response.status, body) };
    }
    const record = extractUserRecord(body);
    if (record && isBlocked(record)) {
      return { ok: false, message: "Аккаунт заблокирован." };
    }
    const user = mapUser(body);
    if (!user) {
      return { ok: false, message: "Некорректный ответ сервера авторизации." };
    }
    return { ok: true, user };
  } catch {
    return { ok: false, message: "Сервис авторизации недоступен." };
  }
}

export async function logoutUser(): Promise<void> {
  const csrf = readCookie("csrf_token");
  const headers: Record<string, string> = { accept: "application/json" };
  if (csrf) headers["X-CSRF-Token"] = csrf;
  try {
    await fetch("/auth/logout", {
      method: "POST",
      credentials: "include",
      headers,
    });
  } catch {
    // The local screen still returns to login.
  }
}
