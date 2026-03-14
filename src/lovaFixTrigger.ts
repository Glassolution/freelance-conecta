declare global {
  // eslint-disable-next-line no-var
  var __LOVA_FIX_TRIGGER__: (() => void) | undefined;

  interface Window {
    __LOVA_FIX_TRIGGER__?: () => void;
  }
}

const trigger = globalThis.__LOVA_FIX_TRIGGER__ ?? (() => {});
globalThis.__LOVA_FIX_TRIGGER__ = trigger;

if (typeof window !== "undefined") {
  window.__LOVA_FIX_TRIGGER__ = trigger;
}

if (typeof self !== "undefined") {
  (self as typeof globalThis & { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = trigger;
}

export {};
