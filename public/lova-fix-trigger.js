var __LOVA_FIX_TRIGGER__ =
  typeof __LOVA_FIX_TRIGGER__ === 'function'
    ? __LOVA_FIX_TRIGGER__
    : (typeof globalThis !== 'undefined' && typeof globalThis.__LOVA_FIX_TRIGGER__ === 'function'
      ? globalThis.__LOVA_FIX_TRIGGER__
      : function(){});

try {
  globalThis.__LOVA_FIX_TRIGGER__ = __LOVA_FIX_TRIGGER__;
  if (typeof window !== 'undefined') window.__LOVA_FIX_TRIGGER__ = __LOVA_FIX_TRIGGER__;
  if (typeof self !== 'undefined') self.__LOVA_FIX_TRIGGER__ = __LOVA_FIX_TRIGGER__;
} catch (_) {}
