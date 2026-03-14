// Ensure __LOVA_FIX_TRIGGER__ is available globally in all runtime paths
(function () {
  const noop = () => {};

  const trigger = (globalThis as any).__LOVA_FIX_TRIGGER__ || noop;
  (globalThis as any).__LOVA_FIX_TRIGGER__ = trigger;

  if (typeof window !== "undefined") {
    (window as any).__LOVA_FIX_TRIGGER__ = trigger;
  }

  if (typeof self !== "undefined") {
    (self as any).__LOVA_FIX_TRIGGER__ = trigger;
  }

  try {
    (0, eval)("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__ || function(){};");
  } catch {
    // no-op
  }
})();

export {};
