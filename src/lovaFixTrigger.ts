// Ensure __LOVA_FIX_TRIGGER__ exists everywhere – defensive no-op fallback
try {
  const noop = () => {};
  if (typeof globalThis !== "undefined" && !globalThis.__LOVA_FIX_TRIGGER__) {
    (globalThis as any).__LOVA_FIX_TRIGGER__ = noop;
  }
  if (typeof window !== "undefined" && !(window as any).__LOVA_FIX_TRIGGER__) {
    (window as any).__LOVA_FIX_TRIGGER__ = noop;
  }
  if (typeof self !== "undefined" && !(self as any).__LOVA_FIX_TRIGGER__) {
    (self as any).__LOVA_FIX_TRIGGER__ = noop;
  }
} catch (_) {
  // silently ignore in restricted contexts
}

export {};
