(function () {
  try {
    var t =
      typeof __LOVA_FIX_TRIGGER__ === 'function'
        ? __LOVA_FIX_TRIGGER__
        : (typeof globalThis !== 'undefined' && typeof globalThis.__LOVA_FIX_TRIGGER__ === 'function'
          ? globalThis.__LOVA_FIX_TRIGGER__
          : function () {});

    globalThis.__LOVA_FIX_TRIGGER__ = t;
    if (typeof window !== 'undefined') window.__LOVA_FIX_TRIGGER__ = t;
    if (typeof self !== 'undefined') self.__LOVA_FIX_TRIGGER__ = t;

    (0, eval)('var __LOVA_FIX_TRIGGER__ = globalThis.__LOVA_FIX_TRIGGER__ || function(){};');
  } catch (_) {}
})();
