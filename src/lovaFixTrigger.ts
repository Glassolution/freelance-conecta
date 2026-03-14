// Ensure __LOVA_FIX_TRIGGER__ is available globally in every possible way
try {
  const noop = () => {};
  if (typeof globalThis !== "undefined") {
    (globalThis as any).__LOVA_FIX_TRIGGER__ = (globalThis as any).__LOVA_FIX_TRIGGER__ || noop;
  }
  if (typeof window !== "undefined") {
    (window as any).__LOVA_FIX_TRIGGER__ = (window as any).__LOVA_FIX_TRIGGER__ || noop;
  }
  if (typeof self !== "undefined") {
    (self as any).__LOVA_FIX_TRIGGER__ = (self as any).__LOVA_FIX_TRIGGER__ || noop;
  }
} catch (_) {
  // silently ignore
}
export {};
