declare global {
  interface Window {
    __LOVA_FIX_TRIGGER__?: () => void;
  }

  var __LOVA_FIX_TRIGGER__: (() => void) | undefined;
}

const scope = globalThis as typeof globalThis & {
  __LOVA_FIX_TRIGGER__?: () => void;
};

if (typeof scope.__LOVA_FIX_TRIGGER__ !== "function") {
  const noop = () => {};
  scope.__LOVA_FIX_TRIGGER__ = noop;
}

export {};
