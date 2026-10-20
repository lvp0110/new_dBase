import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppLogo, BackLogo } from "../components/AppLogo.tsx";
import {
  addApp,
  appsForRole,
  clearSession,
  getRole,
  listApps,
  removeApp,
  resetAppUrl,
  updateAppUrl,
  type StoredApp,
  type StoredUser,
} from "../lib/storage.ts";

type PortalProps = {
  user: StoredUser;
  onLogout: () => void;
};

function AddressesIcon() {
  return (
    <svg
      className="ghost-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.14-1.14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="ghost-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 12H3m0 0 3-3M3 12l3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PortalHeader({
  user,
  roleTitle,
  addressesActive = false,
  onOpenAddresses,
  onLogout,
}: {
  user: StoredUser;
  roleTitle: string;
  addressesActive?: boolean;
  onOpenAddresses: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-start">
        <img
          className="brand-logo"
          src={`${import.meta.env.BASE_URL}logo_1234.png`}
          alt="dataBase"
        />
        <div>
          <p className="eyebrow">Портал приложений</p>
          <p className="who">
            <span className="who-text">
              {user.name}{" "}
              <span className="who-email">
                {roleTitle} · {user.email}
              </span>
            </span>
            <img
              className="who-logo"
              src={`${import.meta.env.BASE_URL}person_logo.png`}
              alt={user.name}
            />
          </p>
        </div>
      </div>
      <div className="topbar-end">
        <nav className="top-actions">
          {user.roleId === "admin" ? (
            <button
              type="button"
              className={addressesActive ? "ghost is-active" : "ghost"}
              aria-label="Адреса"
              onClick={onOpenAddresses}
            >
              <span className="ghost-label">Адреса</span>
              <AddressesIcon />
            </button>
          ) : null}
          <button type="button" className="ghost" aria-label="Выйти" onClick={onLogout}>
            <span className="ghost-label">Выйти</span>
            <LogoutIcon />
          </button>
        </nav>
      </div>
    </header>
  );
}

const COMPACT_QUERY = "(width < 400px) and (height < 800px)";

function useCompactLayout() {
  const [compact, setCompact] = useState(
    () => window.matchMedia(COMPACT_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const onChange = () => setCompact(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return compact;
}

export function PortalScreen({ user, onLogout }: PortalProps) {
  const [view, setView] = useState<"sections" | "apps" | "urls">("sections");
  const [, setRevision] = useState(0);
  const role = getRole(user.roleId);
  const apps = appsForRole(user.roleId);
  const [selectedId, setSelectedId] = useState(apps[0]?.id ?? "");
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const selected = apps.find((app) => app.id === selectedId) ?? apps[0];
  const compactIcons = useCompactLayout();

  function logout() {
    clearSession();
    onLogout();
  }

  function openApp(id: string) {
    setSelectedId(id);
    setOpenedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setView("apps");
  }

  return (
    <div className={view === "sections" ? "shell sections-shell" : "shell"}>
      <PortalHeader
        user={user}
        roleTitle={role?.title ?? user.roleId}
        addressesActive={view === "urls"}
        onOpenAddresses={() => setView("urls")}
        onLogout={logout}
      />
      {view === "sections" ? (
        compactIcons ? (
          <CompactIconBoard apps={apps} onOpen={openApp} />
        ) : (
          <SectionBoard apps={apps} onOpen={openApp} />
        )
      ) : null}
      <div className="workspace" hidden={view === "sections"}>
        {compactIcons && view === "apps" ? null : (
          <aside className="sidebar">
            <button
              type="button"
              className="app-link"
              aria-label="Назад"
              onClick={() => setView("sections")}
            >
              <BackLogo />
              <span className="app-tip" aria-hidden="true">
                Назад
              </span>
            </button>
            <hr className="sidebar-rule" />
            {apps.length === 0 ? (
              <p className="hint">Для этой роли нет приложений.</p>
            ) : (
              <ul className="app-list">
                {apps.map((app) => (
                  <li key={app.id}>
                    <button
                      type="button"
                      className={
                        view === "apps" && selected?.id === app.id
                          ? "app-link is-active"
                          : "app-link"
                      }
                      aria-label={app.title}
                      onClick={() => openApp(app.id)}
                    >
                      <AppLogo id={app.id} />
                      {compactIcons ? null : (
                        <span className="app-tip" aria-hidden="true">
                          {app.title}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
        {view === "urls" && user.roleId === "admin" ? (
          <UrlEditor
            onChanged={() => {
              setRevision((value) => value + 1);
            }}
          />
        ) : null}
        {apps.map((app) =>
          openedIds.includes(app.id) ? (
            <section
              key={app.id}
              className={
                compactIcons ? "stage is-compact-scroll" : "stage"
              }
              hidden={view !== "apps" || selected?.id !== app.id}
            >
              <AppFrame app={app} />
              {compactIcons ? (
                <div className="compact-back-bar">
                  <button
                    type="button"
                    className="app-link compact-back"
                    aria-label="Назад"
                    onClick={() => setView("sections")}
                  >
                    <BackLogo />
                  </button>
                </div>
              ) : null}
            </section>
          ) : null,
        )}
      </div>
    </div>
  );
}

function useViewport() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setSize((current) =>
          current.width === width && current.height === height
            ? current
            : { width, height },
        );
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return size;
}

const BLANK_SECTIONS = [
  { id: "blank-1", title: "Секция 1" },
  { id: "blank-2", title: "Секция 2" },
  { id: "blank-3", title: "Секция 3" },
  { id: "blank-4", title: "Секция 4" },
] as const;

const LOREM_50 =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.";

function gridShape(count: number, width: number, height: number) {
  if (count <= 1) return { columns: 1, rows: 1 };
  if (width < 768) return { columns: 1, rows: count };
  const headerAllowance = width < 800 ? 240 : 120;
  const boardHeight = Math.max(height - headerAllowance, 220);
  const maxRows = Math.max(1, Math.floor(boardHeight / 104));
  let columns =
    width < 800 ? Math.min(3, count) : Math.ceil(Math.sqrt(count));
  if (Math.ceil(count / columns) > maxRows) {
    columns = Math.min(count, Math.ceil(count / maxRows));
  }
  return { columns, rows: Math.ceil(count / columns) };
}

function compactIconLayout(count: number) {
  if (count <= 1) return { columns: 1, rows: 1 };
  if (count === 2) return { columns: 2, rows: 1 };
  if (count === 3) return { columns: 3, rows: 1 };
  if (count <= 4) return { columns: 2, rows: 2 };
  if (count <= 6) return { columns: 3, rows: 2 };
  const columns = 3;
  return { columns, rows: Math.ceil(count / columns) };
}

function evenIconGap(
  width: number,
  height: number,
  columns: number,
  rows: number,
  size: number,
) {
  if (width <= 0 || height <= 0) return 24;
  const gapX = (width - columns * size) / (columns + 1);
  const edgeY = (height - rows * size) / 2;
  return Math.max(12, Math.min(gapX, edgeY));
}

function CompactIconBoard({
  apps,
  onOpen,
}: {
  apps: StoredApp[];
  onOpen: (id: string) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const { columns, rows } = compactIconLayout(apps.length);
  const iconSize = 80;
  const gap = evenIconGap(box.width, box.height, columns, rows, iconSize);

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      setBox((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (apps.length === 0) {
    return <p className="hint">Для этой роли нет приложений.</p>;
  }

  return (
    <div
      ref={boardRef}
      className="compact-icons"
      data-testid="compact-icons"
      style={{
        gridTemplateColumns: `repeat(${columns}, ${iconSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${iconSize}px)`,
        gap,
        padding: gap,
      }}
    >
      {apps.map((app) => (
        <button
          key={app.id}
          type="button"
          className="compact-icon"
          aria-label={app.title}
          onClick={() => onOpen(app.id)}
        >
          <AppLogo id={app.id} />
        </button>
      ))}
    </div>
  );
}

function SectionBoard({
  apps,
  onOpen,
}: {
  apps: StoredApp[];
  onOpen: (id: string) => void;
}) {
  const viewport = useViewport();
  const sectionCount = apps.length + BLANK_SECTIONS.length;
  const { columns, rows } = gridShape(
    sectionCount,
    viewport.width,
    viewport.height,
  );
  const emptyCells = columns * rows - sectionCount;

  return (
    <div
      className="section-board"
      data-testid="section-deck"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {apps.map((app) => (
        <button
          type="button"
          className="deck-section"
          key={app.id}
          aria-label={app.title}
          data-testid="section-item"
          onClick={() => onOpen(app.id)}
        >
          <span className="deck-item">
            <h2>{app.title}</h2>
          </span>
        </button>
      ))}
      {BLANK_SECTIONS.map((section) => (
        <section
          className="deck-section"
          key={section.id}
          aria-label={section.title}
          data-testid="blank-section"
        >
          <div className="deck-item">
            <h2>{section.title}</h2>
          </div>
        </section>
      ))}
      {emptyCells > 0 ? (
        <div
          className="deck-note"
          data-testid="deck-note"
          style={{ gridColumn: `span ${emptyCells}` }}
        >
          <p>{LOREM_50}</p>
        </div>
      ) : null}
    </div>
  );
}

function OpenSeparateIcon() {
  return (
    <svg
      className="open-separate-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.1 20.4H7.2A3.4 3.4 0 0 1 3.8 17V7.2A3.4 3.4 0 0 1 7.2 3.8h9.6A3.4 3.4 0 0 1 20.2 7.2V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 12.7H9.2m0 0 2.4-2.4M9.2 12.7l2.4 2.4M14.5 12.7 20.4 18.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppFrame({ app }: { app: StoredApp }) {
  return (
    <>
      <div className="stage-head">
        <h2>{app.title}</h2>
        <a href={app.url} target="_blank" rel="noreferrer" aria-label="Открыть отдельно">
          <span className="open-separate-label">Открыть отдельно</span>
          <OpenSeparateIcon />
        </a>
      </div>
      <iframe
        key={app.url}
        title={app.title}
        src={app.url}
        className="frame"
      />
    </>
  );
}

function UrlEditor({ onChanged }: { onChanged: () => void }) {
  const [apps, setApps] = useState(() => listApps());
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(apps.map((app) => [app.id, app.url])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [createError, setCreateError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  function refresh() {
    const next = listApps();
    setApps(next);
    setDrafts(Object.fromEntries(next.map((app) => [app.id, app.url])));
    onChanged();
  }

  function onCreate(event: FormEvent) {
    event.preventDefault();
    const result = addApp({ title, url });
    if (!result.ok) {
      setCreateError(result.message);
      return;
    }
    setTitle("");
    setUrl("");
    setCreateError("");
    setCreateOpen(false);
    refresh();
  }

  return (
    <main className="urls">
      <h1>Адреса приложений</h1>
      <p className="hint">
        Адреса iframe хранятся в этом браузере. Сброс возвращает значение из{" "}
        <code>src/config/catalog.ts</code>. Новое приложение видит администратор.
      </p>
      <div className="url-create">
        <div className="url-create-head">
          <h2>Новое приложение</h2>
          <button
            type="button"
            className={createOpen ? "url-create-toggle is-open" : "url-create-toggle"}
            aria-expanded={createOpen}
            aria-label={createOpen ? "Закрыть" : "Открыть"}
            onClick={() => setCreateOpen((open) => !open)}
          />
        </div>
        {createOpen ? (
          <form onSubmit={onCreate} data-testid="add-app-form">
            <label>
              Название
              <input
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>
            <label>
              Адрес
              <input
                name="url"
                type="url"
                inputMode="url"
                placeholder="https://"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                required
              />
            </label>
            {createError ? (
              <p className="error" role="alert">
                {createError}
              </p>
            ) : null}
            <div className="row-actions">
              <button type="submit" className="primary">
                Добавить
              </button>
            </div>
          </form>
        ) : null}
      </div>
      <ul className="url-list">
        {apps.map((app) => (
          <li key={app.id}>
            <div>
              <h2>{app.title}</h2>
              <p className="hint">
                {app.custom
                  ? "Добавлено вручную"
                  : `${app.folder}${app.urlKnown ? " · адрес из проекта" : " · адрес по умолчанию"}`}
              </p>
            </div>
            <label>
              Адрес iframe
              <input
                value={drafts[app.id] ?? app.url}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [app.id]: event.target.value,
                  }))
                }
              />
            </label>
            {errors[app.id] ? (
              <p className="error" role="alert">
                {errors[app.id]}
              </p>
            ) : null}
            <div className="row-actions">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const result = updateAppUrl(app.id, drafts[app.id] ?? "");
                  if (!result.ok) {
                    setErrors((current) => ({
                      ...current,
                      [app.id]: result.message,
                    }));
                    return;
                  }
                  setErrors((current) => ({ ...current, [app.id]: "" }));
                  refresh();
                }}
              >
                Сохранить
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  resetAppUrl(app.id);
                  setErrors((current) => ({ ...current, [app.id]: "" }));
                  refresh();
                }}
              >
                Сбросить
              </button>
              {app.custom ? (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    removeApp(app.id);
                    setErrors((current) => ({ ...current, [app.id]: "" }));
                    refresh();
                  }}
                >
                  Удалить
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
