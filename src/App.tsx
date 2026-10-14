import { useState } from "react";
import { LoginScreen, RegisterScreen } from "./screens/AuthScreens.tsx";
import { PortalScreen } from "./screens/PortalScreen.tsx";
import { getSessionUser } from "./lib/storage.ts";

type AuthView = "register" | "login";

export default function App() {
  const [user, setUser] = useState(() => getSessionUser());
  const [authView, setAuthView] = useState<AuthView>("register");
  const [notice, setNotice] = useState("");

  if (!user) {
    if (authView === "login") {
      return (
        <LoginScreen
          notice={notice}
          onLoggedIn={() => {
            setNotice("");
            setUser(getSessionUser());
          }}
          onShowRegister={() => {
            setNotice("");
            setAuthView("register");
          }}
        />
      );
    }
    return (
      <RegisterScreen
        onRegistered={() => {
          setNotice("Учётная запись создана. Войдите.");
          setAuthView("login");
        }}
        onShowLogin={() => {
          setNotice("");
          setAuthView("login");
        }}
      />
    );
  }

  return (
    <PortalScreen
      user={user}
      onLogout={() => {
        setUser(null);
        setNotice("");
        setAuthView("login");
      }}
    />
  );
}
