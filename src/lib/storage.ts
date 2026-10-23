import {
  SEED_APPS,
  SEED_ROLES,
  seedAppIdsForRole,
  type RoleId,
} from "../config/catalog.ts";

const STORAGE_KEY = "newdbase.v1";
/** Bump to clear saved iframe overrides once. Later edits stay. */
const CATALOG_URL_EPOCH = 2;

type StoredRole = {
  id: RoleId;
  title: string;
  summary: string;
  appIds: string[];
};

export type AppAccessKey = "acoustic" | "hr" | "sales" | "others";

export type AppAccess = Record<AppAccessKey, boolean>;

export type StoredApp = {
  id: string;
  title: string;
  folder: string;
  url: string;
  defaultUrl: string;
  urlKnown: boolean;
  /** Created from the admin address page. Kept across catalog syncs. */
  custom?: boolean;
  /** Who can open the app besides the administrator. */
  access?: AppAccess;
};

type Database = {
  version: 1;
  roles: StoredRole[];
  apps: StoredApp[];
  catalogUrlEpoch?: number;
};

type AuthFailure = { ok: false; message: string };

/** Parsed once per tab. Writes replace it; another tab clears it. */
let memory: Database | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) memory = null;
  });
}

function seedDatabase(): Database {
  return {
    version: 1,
    roles: SEED_ROLES.map((role) => ({
      id: role.id,
      title: role.title,
      summary: role.summary,
      appIds: seedAppIdsForRole(role.id),
    })),
    apps: SEED_APPS.map((app) => ({
      id: app.id,
      title: app.title,
      folder: app.folder,
      url: app.url,
      defaultUrl: app.url,
      urlKnown: app.urlKnown,
    })),
    catalogUrlEpoch: CATALOG_URL_EPOCH,
  };
}

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== "object") return false;
  const record = value as Database;
  return (
    record.version === 1 &&
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
    if (seenAppIds.has(app.id)) return false;
    if (!seedIds.has(app.id) && app.custom !== true) return false;
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
        folder: seed.folder,
        url: seed.url,
        defaultUrl: seed.url,
        urlKnown: seed.urlKnown,
      });
      changed = true;
      continue;
    }
    if (resetUrls) {
      if (
        stored.url !== seed.url ||
        stored.defaultUrl !== seed.url ||
        stored.urlKnown !== seed.urlKnown
      ) {
        stored.url = seed.url;
        stored.defaultUrl = seed.url;
        stored.urlKnown = seed.urlKnown;
        changed = true;
      }
      continue;
    }
    const untouched = stored.url === stored.defaultUrl;
    if (stored.defaultUrl !== seed.url || stored.urlKnown !== seed.urlKnown) {
      stored.defaultUrl = seed.url;
      stored.urlKnown = seed.urlKnown;
      if (untouched) stored.url = seed.url;
      changed = true;
    }
  }

  for (const app of database.apps) {
    if (stripLegacyAppFields(app)) changed = true;
    if (ensureAccess(app)) changed = true;
  }

  if (database.catalogUrlEpoch !== CATALOG_URL_EPOCH) {
    database.catalogUrlEpoch = CATALOG_URL_EPOCH;
    changed = true;
  }

  for (const seedRole of SEED_ROLES) {
    const seeded = seedAppIdsForRole(seedRole.id);
    const appIds =
      seedRole.id === "admin"
        ? [
            ...seeded,
            ...database.apps.filter((app) => app.custom).map((app) => app.id),
          ]
        : seeded;
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

const ACCESS_KEYS: AppAccessKey[] = ["acoustic", "hr", "sales", "others"];

function isAppAccess(value: unknown): value is AppAccess {
  if (!value || typeof value !== "object") return false;
  const record = value as AppAccess;
  return ACCESS_KEYS.every((key) => typeof record[key] === "boolean");
}

function defaultAccess(app: StoredApp): AppAccess {
  const seed = SEED_APPS.find((item) => item.id === app.id);
  if (app.custom || !seed) {
    return { acoustic: false, hr: false, sales: false, others: false };
  }
  const roles = new Set<string>(seed.roles);
  return {
    acoustic: roles.has("acoustic"),
    hr: roles.has("hr"),
    sales: roles.has("sales"),
    others: roles.size > 0,
  };
}

function ensureAccess(app: StoredApp): boolean {
  if (isAppAccess(app.access)) return false;
  app.access = defaultAccess(app);
  return true;
}

function allows(app: StoredApp, roleId: RoleId | null): boolean {
  const access = app.access ?? defaultAccess(app);
  if (roleId === "acoustic" || roleId === "hr" || roleId === "sales") {
    return access[roleId];
  }
  return access.others;
}

function stripLegacyAppFields(app: StoredApp): boolean {
  const legacy = app as StoredApp & { summary?: unknown; note?: unknown };
  let changed = false;
  if ("summary" in legacy) {
    delete legacy.summary;
    changed = true;
  }
  if ("note" in legacy) {
    delete legacy.note;
    changed = true;
  }
  return changed;
}

function readDatabase(): Database {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return persist(seedDatabase());
    const parsed: unknown = JSON.parse(raw);
    if (!isDatabase(parsed)) return persist(seedDatabase());
    if (syncCatalog(parsed)) writeDatabase(parsed);
    memory = parsed;
    return parsed;
  } catch {
    return memory ?? seedDatabase();
  }
}

function persist(database: Database): Database {
  writeDatabase(database);
  return database;
}

function writeDatabase(database: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  memory = database;
}

export function ensureDatabase(): void {
  readDatabase();
}

export function getRole(roleId: RoleId): StoredRole | undefined {
  return readDatabase().roles.find((role) => role.id === roleId);
}

export function appsForRole(roleId: RoleId): StoredApp[] {
  return appsVisibleTo(roleId);
}

/** Admin sees every app. Other portal roles use their checkbox.
 *  Auth roles outside the catalog (user, manager, guest) use «Остальные». */
export function appsVisibleTo(roleId: RoleId | null): StoredApp[] {
  const apps = readDatabase().apps;
  if (roleId === "admin") return apps;
  return apps.filter((app) => allows(app, roleId));
}

export function setAppAccess(
  appId: string,
  key: AppAccessKey,
  enabled: boolean,
): void {
  const database = readDatabase();
  const app = database.apps.find((item) => item.id === appId);
  if (!app) return;
  const access = app.access ?? defaultAccess(app);
  if (access[key] === enabled) return;
  app.access = { ...access, [key]: enabled };
  writeDatabase(database);
}

export function listApps(): StoredApp[] {
  return readDatabase().apps;
}

function isHttpUrl(value: string): boolean {
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
  if (app.url === next) return { ok: true };
  app.url = next;
  writeDatabase(database);
  return { ok: true };
}

export function resetAppUrl(appId: string): void {
  const database = readDatabase();
  const app = database.apps.find((item) => item.id === appId);
  if (!app) return;
  const seed = SEED_APPS.find((item) => item.id === appId);
  const next = seed?.url ?? app.defaultUrl;
  if (app.url === next && app.defaultUrl === next) return;
  app.url = next;
  app.defaultUrl = next;
  writeDatabase(database);
}

export function addApp(input: {
  title: string;
  url: string;
}): { ok: true } | AuthFailure {
  const title = input.title.trim();
  const url = input.url.trim();
  if (!title) return { ok: false, message: "Введите название." };
  if (!isHttpUrl(url)) {
    return {
      ok: false,
      message: "Введите адрес, который начинается с http:// или https://.",
    };
  }

  const database = readDatabase();
  const app: StoredApp = {
    id: crypto.randomUUID(),
    title,
    folder: "",
    url,
    defaultUrl: url,
    urlKnown: true,
    custom: true,
    access: { acoustic: false, hr: false, sales: false, others: false },
  };
  database.apps.push(app);
  const admin = database.roles.find((role) => role.id === "admin");
  if (admin && !admin.appIds.includes(app.id)) admin.appIds.push(app.id);
  writeDatabase(database);
  return { ok: true };
}

export function removeApp(appId: string): void {
  const database = readDatabase();
  const app = database.apps.find((item) => item.id === appId);
  if (!app?.custom) return;
  database.apps = database.apps.filter((item) => item.id !== appId);
  for (const role of database.roles) {
    role.appIds = role.appIds.filter((id) => id !== appId);
  }
  writeDatabase(database);
}
