declare global {
  interface Window {
    __LOVA_FIX_TRIGGER__?: () => void;
  }

  var __LOVA_FIX_TRIGGER__: (() => void) | undefined;
}

const scope = globalThis as typeof globalThis & {
  __LOVA_FIX_TRIGGER__?: () => void;
};

scope.__LOVA_FIX_TRIGGER__ = scope.__LOVA_FIX_TRIGGER__ || (() => undefined);

const ensureGlobalVarBinding = () => {
  try {
    // eslint-disable-next-line no-eval
    (0, eval)("var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__;");
    return;
  } catch {
    // continue to fallback strategies
  }

  try {
    Function(
      "globalThis.__LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__ || function(){}; var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__;"
    )();
  } catch {
    // no-op: external bootstrap script in index.html provides final fallback
  }
};

ensureGlobalVarBinding();

export {};

