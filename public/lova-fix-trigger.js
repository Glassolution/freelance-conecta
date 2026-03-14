(function(g){
  try {
    g.__LOVA_FIX_TRIGGER__ = g.__LOVA_FIX_TRIGGER__ || function(){};
    if (g.window) g.window.__LOVA_FIX_TRIGGER__ = g.__LOVA_FIX_TRIGGER__;
    if (g.self) g.self.__LOVA_FIX_TRIGGER__ = g.__LOVA_FIX_TRIGGER__;
  } catch (_) {}
})(typeof globalThis !== 'undefined' ? globalThis : window);
