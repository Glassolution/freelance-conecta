// Ensure __LOVA_FIX_TRIGGER__ is available globally before anything else runs
(function () {
  const noop = function () {};
  if (typeof globalThis !== "undefined") {
    if (!globalThis.__LOVA_FIX_TRIGGER__) (globalThis as any).__LOVA_FIX_TRIGGER__ = noop;
  }
  if (typeof window !== "undefined") {
    if (!(window as any).__LOVA_FIX_TRIGGER__) (window as any).__LOVA_FIX_TRIGGER__ = (globalThis as any).__LOVA_FIX_TRIGGER__;
  }
  if (typeof self !== "undefined") {
    if (!(self as any).__LOVA_FIX_TRIGGER__) (self as any).__LOVA_FIX_TRIGGER__ = (globalThis as any).__LOVA_FIX_TRIGGER__;
  }
  // No eval needed; global bindings above are enough for all runtimes.
})();

export {};
