declare global {
  interface Window {
    __LOVA_FIX_TRIGGER__?: () => void;
  }

  var __LOVA_FIX_TRIGGER__: (() => void) | undefined;
}

const scope = globalThis as typeof globalThis & {
  __LOVA_FIX_TRIGGER__?: () => void;
};

const noop = () => undefined;

if (typeof scope.__LOVA_FIX_TRIGGER__ !== "function") {
  scope.__LOVA_FIX_TRIGGER__ = noop;
}

const ensureGlobalVarBinding = () => {
  try {
    // eslint-disable-next-line no-eval
    (0, eval)("void __LOVA_FIX_TRIGGER__;");
    return;
  } catch {
    // continue to script injection fallback
  }

  if (typeof document === "undefined") return;

  const script = document.createElement("script");
  script.text = "window.__LOVA_FIX_TRIGGER__ = window.__LOVA_FIX_TRIGGER__ || function(){}; var __LOVA_FIX_TRIGGER__ = window.__LOVA_FIX_TRIGGER__;";
  (document.head || document.documentElement).prepend(script);
  script.remove();
};

ensureGlobalVarBinding();

export {};
