// Ensure __LOVA_FIX_TRIGGER__ is available globally
(globalThis as any).__LOVA_FIX_TRIGGER__ = (globalThis as any).__LOVA_FIX_TRIGGER__ || (() => {});
if (typeof window !== "undefined") {
  (window as any).__LOVA_FIX_TRIGGER__ = (globalThis as any).__LOVA_FIX_TRIGGER__;
}
export {};
