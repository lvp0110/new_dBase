import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/montserrat/cyrillic-400.css";
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/cyrillic-500.css";
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/cyrillic-600.css";
import "@fontsource/montserrat/latin-600.css";
import App from "./App.tsx";
import { ensureDatabase } from "./lib/storage.ts";
import "./index.css";

ensureDatabase();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
