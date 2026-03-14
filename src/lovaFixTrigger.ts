// Ensure __LOVA_FIX_TRIGGER__ exists and also has a global identifier binding
try {
  const root = globalThis as typeof globalThis & {
    __LOVA_FIX_TRIGGER__?: () => void;
  };

  const noop = () => {};
  root.__LOVA_FIX_TRIGGER__ = root.__LOVA_FIX_TRIGGER__ || noop;

  if (typeof window !== "undefined") {
    (window as typeof window & { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = root.__LOVA_FIX_TRIGGER__;
  }

  if (typeof self !== "undefined") {
    (self as typeof self & { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = root.__LOVA_FIX_TRIGGER__;
  }

  // Some runtimes reference bare identifier; create a true global var binding.
  (0, eval)("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__ || function () {};");
} catch (_) {
  // silently ignore in restricted contexts
}

export {};

