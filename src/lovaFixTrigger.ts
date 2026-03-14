declare global {
  // eslint-disable-next-line no-var
  var __LOVA_FIX_TRIGGER__: (() => void) | undefined;
}

const globalScope = globalThis as typeof globalThis & {
  __LOVA_FIX_TRIGGER__?: () => void;
};

if (typeof globalScope.__LOVA_FIX_TRIGGER__ !== "function") {
  globalScope.__LOVA_FIX_TRIGGER__ = () => {};
}

if (typeof window !== "undefined") {
  (window as typeof window & { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = globalScope.__LOVA_FIX_TRIGGER__;
}

try {
  (0, eval)("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__;");
} catch {
  try {
    Function("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__;")();
  } catch {
    // ignore
  }
}

export {};
