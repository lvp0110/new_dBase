export const ROLE_IDS = ["admin", "acoustic", "hr", "sales"] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export type SeedRole = {
  id: RoleId;
  title: string;
  summary: string;
};

export type SeedApp = {
  id: string;
  title: string;
  summary: string;
  folder: string;
  url: string;
  urlKnown: boolean;
  note: string;
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
 */
export const SEED_APPS: SeedApp[] = [
  {
    id: "sound-calc",
    title: "Калькулятор звукоизоляции",
    summary: "Расчёт звукоизоляции, ag_sound_calc.",
    folder: "ag_sound_calc/frontend",
    url: "http://localhost:5173/",
    urlKnown: true,
    note: "vite.config.js server.port: 5173, base по умолчанию /.",
    roles: ["acoustic"],
  },
  {
    id: "acoustic-calc",
    title: "Акустический калькулятор",
    summary: "Подбор акустических материалов, newCalcAcostic.",
    folder: "newCalcAcostic",
    url: "about:blank",
    urlKnown: false,
    note: "Приложение остаётся в каталоге и не запущено. Адрес не указывает на порт 3000, «Открыть» этот порт не открывает.",
    roles: ["acoustic"],
  },
  {
    id: "vibro-compare",
    title: "Сравнение виброизоляции",
    summary: "Сравнение виброизоляционных решений.",
    folder: "vibro_compare 17.27.06",
    url: "http://localhost:5174/vibro_compare",
    urlKnown: true,
    note: "Путь /vibro_compare сохранён. Порт задан при запуске через HTTP_PORT=5174.",
    roles: ["acoustic"],
  },
  {
    id: "co-worker",
    title: "Калькулятор и коммерческие предложения",
    summary: "Конструкции, КП и справочники, ag_co_worker.",
    folder: "ag_co_worker/frontend",
    url: "http://localhost:5175/",
    urlKnown: true,
    note: "vite.config.js server.port: 5175, base по умолчанию /.",
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
