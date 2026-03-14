import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare global {
  interface Window {
    __LOVA_FIX_TRIGGER__?: () => void;
  }
}

if (typeof window !== "undefined" && typeof window.__LOVA_FIX_TRIGGER__ === "undefined") {
  window.__LOVA_FIX_TRIGGER__ = () => {};
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
