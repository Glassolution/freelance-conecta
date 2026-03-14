import "./lovaFixTrigger";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const fixTrigger = (globalThis as { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ ?? (() => {});
(globalThis as { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = fixTrigger;
void fixTrigger();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

void import("./App.tsx")
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("App bootstrap error:", error);
  });
