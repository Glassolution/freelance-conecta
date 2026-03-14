declare global {
  // eslint-disable-next-line no-var
  var __LOVA_FIX_TRIGGER__: (() => void) | undefined;
}

if (typeof globalThis.__LOVA_FIX_TRIGGER__ !== "function") {
  globalThis.__LOVA_FIX_TRIGGER__ = () => {};
}

try {
  // Force-create a true global `var` fallback for scripts that access it as an identifier.
  (0, eval)("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__;");
} catch {
  try {
    Function("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__;")();
  } catch {
    // ignore
  }
}

export {};
