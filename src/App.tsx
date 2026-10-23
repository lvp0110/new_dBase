import { useEffect, useState } from "react";
import { fetchSession, type SessionUser } from "./lib/auth.ts";
import { LoginScreen } from "./screens/AuthScreens.tsx";
import { PortalScreen } from "./screens/PortalScreen.tsx";

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSession().then((next) => {
      if (cancelled) return;
      setUser(next);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <main className="auth">
        <p>Проверка входа…</p>
      </main>
    );
  }

  if (!user) {
    return <LoginScreen onLoggedIn={setUser} />;
  }

  return <PortalScreen user={user} onLogout={() => setUser(null)} />;
}
