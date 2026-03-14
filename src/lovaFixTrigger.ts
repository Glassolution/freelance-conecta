declare global {
  interface Window {
    __LOVA_FIX_TRIGGER__?: () => void;
  }

  var __LOVA_FIX_TRIGGER__: (() => void) | undefined;
}

const scope = globalThis as typeof globalThis & {
  __LOVA_FIX_TRIGGER__?: () => void;
};

const noop = () => {};

if (typeof scope.__LOVA_FIX_TRIGGER__ !== "function") {
  scope.__LOVA_FIX_TRIGGER__ = noop;
}

try {
  // Ensure a true global var binding also exists for environments that access
  // __LOVA_FIX_TRIGGER__ as a bare identifier before app code runs.
  (0, eval)("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__;");
} catch {
  // no-op
}

export {};
