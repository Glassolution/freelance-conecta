// Ensure __LOVA_FIX_TRIGGER__ is available globally in every runtime path
try {
  const existing = (globalThis as any).__LOVA_FIX_TRIGGER__;
  const trigger = typeof existing === "function" ? existing : () => {};

  (globalThis as any).__LOVA_FIX_TRIGGER__ = trigger;

  if (typeof window !== "undefined") {
    (window as any).__LOVA_FIX_TRIGGER__ = trigger;
  }

  if (typeof self !== "undefined") {
    (self as any).__LOVA_FIX_TRIGGER__ = trigger;
  }

  // Force-create global var binding for legacy/bare identifier usage
  (0, eval)("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__;");
} catch {
  // no-op
}

export {};
