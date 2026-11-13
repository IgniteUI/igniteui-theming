import { configureTheme } from "igniteui-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/theme.scss";
import "@xyflow/react/dist/style.css";
import "./index.css";
import { App } from "./app/App.js";
import { registerIcons } from "./app/icons.js";

// Matches the --ig-theme and --ig-theme-variant that theme.scss sets on :root.
configureTheme("fluent", "dark");
registerIcons();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
