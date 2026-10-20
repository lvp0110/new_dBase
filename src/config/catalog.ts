const ROLE_IDS = ["admin", "acoustic", "hr", "sales"] as const;

export type RoleId = (typeof ROLE_IDS)[number];

type SeedRole = {
  id: RoleId;
  title: string;
  summary: string;
};

type SeedApp = {
  id: string;
  title: string;
  folder: string;
  url: string;
  urlKnown: boolean;
  roles: Array<Exclude<RoleId, "admin">>;
};

export const SEED_ROLES: SeedRole[] = [
  {
    id: "admin",
    title: "Администратор",
    summary: "Открывает все найденные приложения.",
  },
  {
    id: "acoustic",
    title: "Акустик",
    summary: "База, калькуляторы звука и акустики и виброизоляция.",
  },
  {
    id: "hr",
    title: "Кадры",
    summary: "Приложений для этой роли сейчас нет.",
  },
  {
    id: "sales",
    title: "Продажи",
    summary: "База и коммерческие предложения.",
  },
];

/**
 * Portal iframe URLs. The apps this portal starts use consecutive localhost
 * ports. `urlKnown: false` with `about:blank` means «Открыть» does not open
 * a listen port.
 *
 * sound-calc — vite port 5173, base `/`.
 * acoustic-calc — not running; about:blank so «Открыть» does not hit port 3000.
 * vibro-compare — path `/vibro_compare`, started with HTTP_PORT=5174.
 * co-worker — vite port 5175, base `/`.
 */
export const SEED_APPS: SeedApp[] = [
  {
    id: "sound-calc",
    title: "Калькулятор звукоизоляции",
    folder: "ag_sound_calc/frontend",
    url: "http://localhost:5173/",
    urlKnown: true,
    roles: ["acoustic"],
  },
  {
    id: "acoustic-calc",
    title: "Акустический калькулятор",
    folder: "newCalcAcostic",
    url: "about:blank",
    urlKnown: false,
    roles: ["acoustic"],
  },
  {
    id: "vibro-compare",
    title: "Сравнение виброизоляции",
    folder: "vibro_compare 17.27.06",
    url: "http://localhost:5174/vibro_compare",
    urlKnown: true,
    roles: ["acoustic"],
  },
  {
    id: "co-worker",
    title: "Калькулятор и коммерческие предложения",
    folder: "ag_co_worker/frontend",
    url: "http://localhost:5175/",
    urlKnown: true,
    roles: ["acoustic", "sales"],
  },
];

export function seedAppIdsForRole(roleId: RoleId): string[] {
  const apps =
    roleId === "admin"
      ? SEED_APPS
      : SEED_APPS.filter((app) =>
          app.roles.includes(roleId as Exclude<RoleId, "admin">),
        );
  return [...new Set(apps.map((app) => app.id))];
}

export function isRoleId(value: string): value is RoleId {
  return (ROLE_IDS as readonly string[]).includes(value);
}
