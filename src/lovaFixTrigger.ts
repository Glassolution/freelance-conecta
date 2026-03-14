const g = globalThis as typeof globalThis & { __LOVA_FIX_TRIGGER__?: () => void };
g.__LOVA_FIX_TRIGGER__ = g.__LOVA_FIX_TRIGGER__ || (() => {});

if (typeof window !== "undefined") {
  (window as Window & { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = g.__LOVA_FIX_TRIGGER__;
}
if (typeof self !== "undefined") {
  (self as typeof globalThis & { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = g.__LOVA_FIX_TRIGGER__;
}

export {};
