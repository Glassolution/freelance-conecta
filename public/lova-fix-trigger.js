try {
  var __lovaNoop = function () {};
  if (typeof globalThis !== 'undefined') globalThis.__LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__ || __lovaNoop;
  if (typeof window !== 'undefined') window.__LOVA_FIX_TRIGGER__ = window.__LOVA_FIX_TRIGGER__ || globalThis.__LOVA_FIX_TRIGGER__;
  if (typeof self !== 'undefined') self.__LOVA_FIX_TRIGGER__ = self.__LOVA_FIX_TRIGGER__ || globalThis.__LOVA_FIX_TRIGGER__;
  var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__ || __lovaNoop;
} catch (e) {}
