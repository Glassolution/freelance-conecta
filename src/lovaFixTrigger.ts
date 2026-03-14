(function () {
  const g = globalThis as typeof globalThis & {
    __LOVA_FIX_TRIGGER__?: () => void;
    window?: Window & { __LOVA_FIX_TRIGGER__?: () => void };
    self?: typeof globalThis & { __LOVA_FIX_TRIGGER__?: () => void };
  };

  const trigger = g.__LOVA_FIX_TRIGGER__ ?? (() => {});
  g.__LOVA_FIX_TRIGGER__ = trigger;

  if (typeof window !== "undefined") {
    (window as Window & { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = trigger;
  }

  if (typeof self !== "undefined") {
    (self as typeof globalThis & { __LOVA_FIX_TRIGGER__?: () => void }).__LOVA_FIX_TRIGGER__ = trigger;
  }
})();

export {};
