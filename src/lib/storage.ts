import {
  SEED_APPS,
  SEED_ROLES,
  isRoleId,
  seedAppIdsForRole,
  type RoleId,
} from "../config/catalog.ts";

const STORAGE_KEY = "newdbase.v1";
/** Bump to clear saved iframe overrides once. Later edits stay. */
const CATALOG_URL_EPOCH = 2;

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  roleId: RoleId;
};

export type StoredRole = {
  id: RoleId;
  title: string;
  summary: string;
  appIds: string[];
};

export type StoredApp = {
  id: string;
  title: string;
  summary: string;
  folder: string;
  url: string;
  defaultUrl: string;
  urlKnown: boolean;
  note: string;
};

type Database = {
  version: 1;
  users: StoredUser[];
  roles: StoredRole[];
  apps: StoredApp[];
  sessionUserId: string | null;
  catalogUrlEpoch?: number;
};

export type AuthFailure = { ok: false; message: string };
export type RegisterResult = { ok: true } | AuthFailure;
export type LoginResult = { ok: true; user: StoredUser } | AuthFailure;

function seedDatabase(): Database {
  return {
    version: 1,
    users: [],
    roles: SEED_ROLES.map((role) => ({
      id: role.id,
      title: role.title,
      summary: role.summary,
      appIds: seedAppIdsForRole(role.id),
    })),
    apps: SEED_APPS.map((app) => ({
      id: app.id,
      title: app.title,
      summary: app.summary,
      folder: app.folder,
      url: app.url,
      defaultUrl: app.url,
      urlKnown: app.urlKnown,
      note: app.note,
    })),
    sessionUserId: null,
    catalogUrlEpoch: CATALOG_URL_EPOCH,
  };
}

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== "object") return false;
  const record = value as Database;
  return (
    record.version === 1 &&
    Array.isArray(record.users) &&
    Array.isArray(record.roles) &&
    Array.isArray(record.apps)
  );
}

function sameIds(left: string[], right: string[]): boolean {
  return (
    left.length === right.length && left.every((id, index) => id === right[index])
  );
}

function syncCatalog(database: Database): boolean {
  let changed = false;
  const resetUrls = database.catalogUrlEpoch !== CATALOG_URL_EPOCH;
  const seedIds = new Set(SEED_APPS.map((app) => app.id));
  const seenAppIds = new Set<string>();
  const kept = database.apps.filter((app) => {
    if (!seedIds.has(app.id) || seenAppIds.has(app.id)) return false;
    seenAppIds.add(app.id);
    return true;
  });
  if (kept.length !== database.apps.length) {
    database.apps = kept;
    changed = true;
  }

  for (const seed of SEED_APPS) {
    const stored = database.apps.find((app) => app.id === seed.id);
    if (!stored) {
      database.apps.push({
        id: seed.id,
        title: seed.title,
        summary: seed.summary,
        folder: seed.folder,
        url: seed.url,
        defaultUrl: seed.url,
        urlKnown: seed.urlKnown,
        note: seed.note,
      });
      changed = true;
      continue;
    }
    if (resetUrls) {
      if (
        stored.url !== seed.url ||
        stored.defaultUrl !== seed.url ||
        stored.note !== seed.note ||
        stored.urlKnown !== seed.urlKnown
      ) {
        stored.url = seed.url;
        stored.defaultUrl = seed.url;
        stored.note = seed.note;
        stored.urlKnown = seed.urlKnown;
        changed = true;
      }
      continue;
    }
    const untouched = stored.url === stored.defaultUrl;
    if (
      stored.defaultUrl !== seed.url ||
      stored.note !== seed.note ||
      stored.urlKnown !== seed.urlKnown
    ) {
      stored.defaultUrl = seed.url;
      stored.note = seed.note;
      stored.urlKnown = seed.urlKnown;
      if (untouched) stored.url = seed.url;
      changed = true;
    }
  }

  if (database.catalogUrlEpoch !== CATALOG_URL_EPOCH) {
    database.catalogUrlEpoch = CATALOG_URL_EPOCH;
    changed = true;
  }

  for (const seedRole of SEED_ROLES) {
    const appIds = seedAppIdsForRole(seedRole.id);
    const role = database.roles.find((item) => item.id === seedRole.id);
    if (!role) {
      database.roles.push({
        id: seedRole.id,
        title: seedRole.title,
        summary: seedRole.summary,
        appIds,
      });
      changed = true;
      continue;
    }
    if (role.title !== seedRole.title || role.summary !== seedRole.summary) {
      role.title = seedRole.title;
      role.summary = seedRole.summary;
      changed = true;
    }
    if (!sameIds(role.appIds, appIds)) {
      role.appIds = appIds;
      changed = true;
    }
  }

  for (const role of database.roles) {
    if (SEED_ROLES.some((seed) => seed.id === role.id)) continue;
    const seenRoleAppIds = new Set<string>();
    const appIds = role.appIds.filter((id) => {
      if (!seedIds.has(id) || seenRoleAppIds.has(id)) return false;
      seenRoleAppIds.add(id);
      return true;
    });
    if (!sameIds(role.appIds, appIds)) {
      role.appIds = appIds;
      changed = true;
    }
  }

  return changed;
}

function readDatabase(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDatabase();
    const parsed: unknown = JSON.parse(raw);
    if (!isDatabase(parsed)) return seedDatabase();
    if (syncCatalog(parsed)) writeDatabase(parsed);
    return parsed;
  } catch {
    return seedDatabase();
  }
}

function writeDatabase(database: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

export function ensureDatabase(): void {
  if (!localStorage.getItem(STORAGE_KEY)) writeDatabase(seedDatabase());
}

export function listRoles(): StoredRole[] {
  return readDatabase().roles;
}

export function getRole(roleId: RoleId): StoredRole | undefined {
  return readDatabase().roles.find((role) => role.id === roleId);
}

export function appsForRole(roleId: RoleId): StoredApp[] {
  const database = readDatabase();
  const role = database.roles.find((item) => item.id === roleId);
  if (!role) return [];
  const allowed = new Set(role.appIds);
  return database.apps.filter((app) => allowed.has(app.id));
}

export function listApps(): StoredApp[] {
  return readDatabase().apps;
}

export function getSessionUser(): StoredUser | null {
  const database = readDatabase();
  if (!database.sessionUserId) return null;
  return (
    database.users.find((user) => user.id === database.sessionUserId) ?? null
  );
}

export function clearSession(): void {
  const database = readDatabase();
  database.sessionUserId = null;
  writeDatabase(database);
}

export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  roleId: string;
}): Promise<RegisterResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  if (!name) return { ok: false, message: "Введите имя." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Введите корректную почту." };
  }
  if (input.password.length < 6) {
    return { ok: false, message: "Пароль должен быть не короче 6 символов." };
  }
  if (!isRoleId(input.roleId)) return { ok: false, message: "Выберите роль." };

  const database = readDatabase();
  if (database.users.some((user) => user.email === email)) {
    return { ok: false, message: "Такая почта уже зарегистрирована." };
  }

  database.users.push({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await hashPassword(input.password),
    roleId: input.roleId,
  });
  writeDatabase(database);
  return { ok: true };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const email = normalizeEmail(input.email);
  const database = readDatabase();
  const user = database.users.find((item) => item.email === email);
  const passwordHash = await hashPassword(input.password);
  if (!user || user.passwordHash !== passwordHash) {
    return { ok: false, message: "Неверная почта или пароль." };
  }
  database.sessionUserId = user.id;
  writeDatabase(database);
  return { ok: true, user };
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function updateAppUrl(
  appId: string,
  url: string,
): { ok: true } | AuthFailure {
  const next = url.trim();
  if (!isHttpUrl(next)) {
    return {
      ok: false,
      message: "Введите адрес, который начинается с http:// или https://.",
    };
  }
  const database = readDatabase();
  const app = database.apps.find((item) => item.id === appId);
  if (!app) return { ok: false, message: "Приложение не найдено." };
  app.url = next;
  writeDatabase(database);
  return { ok: true };
}

export function resetAppUrl(appId: string): void {
  const database = readDatabase();
  const app = database.apps.find((item) => item.id === appId);
  if (!app) return;
  const seed = SEED_APPS.find((item) => item.id === appId);
  app.url = seed?.url ?? app.defaultUrl;
  app.defaultUrl = seed?.url ?? app.defaultUrl;
  writeDatabase(database);
}
