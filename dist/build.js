(function() {// Input 0
/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.ASSUME_ES5 = !1;
$jscomp.ASSUME_NO_NATIVE_MAP = !1;
$jscomp.ASSUME_NO_NATIVE_SET = !1;
$jscomp.SIMPLE_FROUND_POLYFILL = !1;
$jscomp.ISOLATE_POLYFILLS = !1;
$jscomp.FORCE_POLYFILL_PROMISE = !1;
$jscomp.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION = !1;
$jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(a, b, c) {
  if (a == Array.prototype || a == Object.prototype) {
    return a;
  }
  a[b] = c.value;
  return a;
};
$jscomp.getGlobal = function(a) {
  a = ["object" == typeof globalThis && globalThis, a, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global,];
  for (var b = 0; b < a.length; ++b) {
    var c = a[b];
    if (c && c.Math == Math) {
      return c;
    }
  }
  throw Error("Cannot find global object");
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.IS_SYMBOL_NATIVE = "function" === typeof Symbol && "symbol" === typeof Symbol("x");
$jscomp.TRUST_ES6_POLYFILLS = !$jscomp.ISOLATE_POLYFILLS || $jscomp.IS_SYMBOL_NATIVE;
$jscomp.polyfills = {};
$jscomp.propertyToPolyfillSymbol = {};
$jscomp.POLYFILL_PREFIX = "$jscp$";
var $jscomp$lookupPolyfilledValue = function(a, b) {
  var c = $jscomp.propertyToPolyfillSymbol[b];
  if (null == c) {
    return a[b];
  }
  c = a[c];
  return void 0 !== c ? c : a[b];
};
$jscomp.polyfill = function(a, b, c, d) {
  b && ($jscomp.ISOLATE_POLYFILLS ? $jscomp.polyfillIsolated(a, b, c, d) : $jscomp.polyfillUnisolated(a, b, c, d));
};
$jscomp.polyfillUnisolated = function(a, b, c, d) {
  c = $jscomp.global;
  a = a.split(".");
  for (d = 0; d < a.length - 1; d++) {
    var e = a[d];
    if (!(e in c)) {
      return;
    }
    c = c[e];
  }
  a = a[a.length - 1];
  d = c[a];
  b = b(d);
  b != d && null != b && $jscomp.defineProperty(c, a, {configurable:!0, writable:!0, value:b});
};
$jscomp.polyfillIsolated = function(a, b, c, d) {
  var e = a.split(".");
  a = 1 === e.length;
  d = e[0];
  d = !a && d in $jscomp.polyfills ? $jscomp.polyfills : $jscomp.global;
  for (var f = 0; f < e.length - 1; f++) {
    var g = e[f];
    if (!(g in d)) {
      return;
    }
    d = d[g];
  }
  e = e[e.length - 1];
  c = $jscomp.IS_SYMBOL_NATIVE && "es6" === c ? d[e] : null;
  b = b(c);
  null != b && (a ? $jscomp.defineProperty($jscomp.polyfills, e, {configurable:!0, writable:!0, value:b}) : b !== c && (void 0 === $jscomp.propertyToPolyfillSymbol[e] && (c = 1E9 * Math.random() >>> 0, $jscomp.propertyToPolyfillSymbol[e] = $jscomp.IS_SYMBOL_NATIVE ? $jscomp.global.Symbol(e) : $jscomp.POLYFILL_PREFIX + c + "$" + e), $jscomp.defineProperty(d, $jscomp.propertyToPolyfillSymbol[e], {configurable:!0, writable:!0, value:b})));
};
$jscomp.polyfill("Array.prototype.includes", function(a) {
  return a ? a : function(b, c) {
    var d = this;
    d instanceof String && (d = String(d));
    var e = d.length;
    c = c || 0;
    for (0 > c && (c = Math.max(c + e, 0)); c < e; c++) {
      var f = d[c];
      if (f === b || Object.is(f, b)) {
        return !0;
      }
    }
    return !1;
  };
}, "es7", "es3");
var COMPILED = !0, goog = goog || {};
goog.global = this || self;
goog.exportPath_ = function(a, b, c, d) {
  a = a.split(".");
  d = d || goog.global;
  a[0] in d || "undefined" == typeof d.execScript || d.execScript("var " + a[0]);
  for (var e; a.length && (e = a.shift());) {
    if (a.length || void 0 === b) {
      d = d[e] && d[e] !== Object.prototype[e] ? d[e] : d[e] = {};
    } else {
      if (!c && goog.isObject(b) && goog.isObject(d[e])) {
        for (var f in b) {
          b.hasOwnProperty(f) && (d[e][f] = b[f]);
        }
      } else {
        d[e] = b;
      }
    }
  }
};
goog.define = function(a, b) {
  if (!COMPILED) {
    var c = goog.global.CLOSURE_UNCOMPILED_DEFINES, d = goog.global.CLOSURE_DEFINES;
    c && void 0 === c.nodeType && Object.prototype.hasOwnProperty.call(c, a) ? b = c[a] : d && void 0 === d.nodeType && Object.prototype.hasOwnProperty.call(d, a) && (b = d[a]);
  }
  return b;
};
goog.FEATURESET_YEAR = 2012;
goog.DEBUG = !0;
goog.LOCALE = "en";
goog.getLocale = function() {
  return goog.LOCALE;
};
goog.TRUSTED_SITE = !0;
goog.DISALLOW_TEST_ONLY_CODE = COMPILED && !goog.DEBUG;
goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING = !1;
goog.provide = function(a) {
  if (goog.isInModuleLoader_()) {
    throw Error("goog.provide cannot be used within a module.");
  }
  if (!COMPILED && goog.isProvided_(a)) {
    throw Error('Namespace "' + a + '" already declared.');
  }
  goog.constructNamespace_(a);
};
goog.constructNamespace_ = function(a, b, c) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[a];
    for (var d = a; (d = d.substring(0, d.lastIndexOf("."))) && !goog.getObjectByName(d);) {
      goog.implicitNamespaces_[d] = !0;
    }
  }
  goog.exportPath_(a, b, c);
};
goog.NONCE_PATTERN_ = /^[\w+/_-]+[=]{0,2}$/;
goog.getScriptNonce_ = function(a) {
  a = (a || goog.global).document;
  return (a = a.querySelector && a.querySelector("script[nonce]")) && (a = a.nonce || a.getAttribute("nonce")) && goog.NONCE_PATTERN_.test(a) ? a : "";
};
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;
goog.module = function(a) {
  if ("string" !== typeof a || !a || -1 == a.search(goog.VALID_MODULE_RE_)) {
    throw Error("Invalid module identifier");
  }
  if (!goog.isInGoogModuleLoader_()) {
    throw Error("Module " + a + " has been loaded incorrectly. Note, modules cannot be loaded as normal scripts. They require some kind of pre-processing step. You're likely trying to load a module via a script tag or as a part of a concatenated bundle without rewriting the module. For more info see: https://github.com/google/closure-library/wiki/goog.module:-an-ES6-module-like-alternative-to-goog.provide.");
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw Error("goog.module may only be called once per module.");
  }
  goog.moduleLoaderState_.moduleName = a;
  if (!COMPILED) {
    if (goog.isProvided_(a)) {
      throw Error('Namespace "' + a + '" already declared.');
    }
    delete goog.implicitNamespaces_[a];
  }
};
goog.module.get = function(a) {
  return goog.module.getInternal_(a);
};
goog.module.getInternal_ = function(a) {
  if (!COMPILED) {
    if (a in goog.loadedModules_) {
      return goog.loadedModules_[a].exports;
    }
    if (!goog.implicitNamespaces_[a]) {
      return a = goog.getObjectByName(a), null != a ? a : null;
    }
  }
  return null;
};
goog.ModuleType = {ES6:"es6", GOOG:"goog"};
goog.moduleLoaderState_ = null;
goog.isInModuleLoader_ = function() {
  return goog.isInGoogModuleLoader_() || goog.isInEs6ModuleLoader_();
};
goog.isInGoogModuleLoader_ = function() {
  return !!goog.moduleLoaderState_ && goog.moduleLoaderState_.type == goog.ModuleType.GOOG;
};
goog.isInEs6ModuleLoader_ = function() {
  if (goog.moduleLoaderState_ && goog.moduleLoaderState_.type == goog.ModuleType.ES6) {
    return !0;
  }
  var a = goog.global.$jscomp;
  return a ? "function" != typeof a.getCurrentModulePath ? !1 : !!a.getCurrentModulePath() : !1;
};
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInGoogModuleLoader_()) {
    throw Error("goog.module.declareLegacyNamespace must be called from within a goog.module");
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw Error("goog.module must be called prior to goog.module.declareLegacyNamespace.");
  }
  goog.moduleLoaderState_.declareLegacyNamespace = !0;
};
goog.declareModuleId = function(a) {
  if (!COMPILED) {
    if (!goog.isInEs6ModuleLoader_()) {
      throw Error("goog.declareModuleId may only be called from within an ES6 module");
    }
    if (goog.moduleLoaderState_ && goog.moduleLoaderState_.moduleName) {
      throw Error("goog.declareModuleId may only be called once per module.");
    }
    if (a in goog.loadedModules_) {
      throw Error('Module with namespace "' + a + '" already exists.');
    }
  }
  if (goog.moduleLoaderState_) {
    goog.moduleLoaderState_.moduleName = a;
  } else {
    var b = goog.global.$jscomp;
    if (!b || "function" != typeof b.getCurrentModulePath) {
      throw Error('Module with namespace "' + a + '" has been loaded incorrectly.');
    }
    b = b.require(b.getCurrentModulePath());
    goog.loadedModules_[a] = {exports:b, type:goog.ModuleType.ES6, moduleId:a};
  }
};
goog.setTestOnly = function(a) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    throw a = a || "", Error("Importing test-only code into non-debug environment" + (a ? ": " + a : "."));
  }
};
goog.forwardDeclare = function(a) {
};
COMPILED || (goog.isProvided_ = function(a) {
  return a in goog.loadedModules_ || !goog.implicitNamespaces_[a] && null != goog.getObjectByName(a);
}, goog.implicitNamespaces_ = {"goog.module":!0});
goog.getObjectByName = function(a, b) {
  a = a.split(".");
  b = b || goog.global;
  for (var c = 0; c < a.length; c++) {
    if (b = b[a[c]], null == b) {
      return null;
    }
  }
  return b;
};
goog.addDependency = function(a, b, c, d) {
  !COMPILED && goog.DEPENDENCIES_ENABLED && goog.debugLoader_.addDependency(a, b, c, d);
};
goog.ENABLE_DEBUG_LOADER = !0;
goog.logToConsole_ = function(a) {
  goog.global.console && goog.global.console.error(a);
};
goog.require = function(a) {
  if (!COMPILED) {
    goog.ENABLE_DEBUG_LOADER && goog.debugLoader_.requested(a);
    if (goog.isProvided_(a)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(a);
      }
    } else if (goog.ENABLE_DEBUG_LOADER) {
      var b = goog.moduleLoaderState_;
      goog.moduleLoaderState_ = null;
      try {
        goog.debugLoader_.load_(a);
      } finally {
        goog.moduleLoaderState_ = b;
      }
    }
    return null;
  }
};
goog.requireType = function(a) {
  return {};
};
goog.basePath = "";
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(a) {
  a.instance_ = void 0;
  a.getInstance = function() {
    if (a.instance_) {
      return a.instance_;
    }
    goog.DEBUG && (goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = a);
    return a.instance_ = new a();
  };
};
goog.instantiatedSingletons_ = [];
goog.LOAD_MODULE_USING_EVAL = !0;
goog.SEAL_MODULE_EXPORTS = goog.DEBUG;
goog.loadedModules_ = {};
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;
goog.TRANSPILE = "detect";
goog.ASSUME_ES_MODULES_TRANSPILED = !1;
goog.TRANSPILE_TO_LANGUAGE = "";
goog.TRANSPILER = "transpile.js";
goog.TRUSTED_TYPES_POLICY_NAME = "goog";
goog.hasBadLetScoping = null;
goog.loadModule = function(a) {
  var b = goog.moduleLoaderState_;
  try {
    goog.moduleLoaderState_ = {moduleName:"", declareLegacyNamespace:!1, type:goog.ModuleType.GOOG};
    var c = {}, d = c;
    if ("function" === typeof a) {
      d = a.call(void 0, d);
    } else if ("string" === typeof a) {
      d = goog.loadModuleFromSource_.call(void 0, d, a);
    } else {
      throw Error("Invalid module definition");
    }
    var e = goog.moduleLoaderState_.moduleName;
    if ("string" === typeof e && e) {
      goog.moduleLoaderState_.declareLegacyNamespace ? goog.constructNamespace_(e, d, c !== d) : goog.SEAL_MODULE_EXPORTS && Object.seal && "object" == typeof d && null != d && Object.seal(d), goog.loadedModules_[e] = {exports:d, type:goog.ModuleType.GOOG, moduleId:goog.moduleLoaderState_.moduleName};
    } else {
      throw Error('Invalid module name "' + e + '"');
    }
  } finally {
    goog.moduleLoaderState_ = b;
  }
};
goog.loadModuleFromSource_ = function(a, b) {
  eval(goog.CLOSURE_EVAL_PREFILTER_.createScript(b));
  return a;
};
goog.normalizePath_ = function(a) {
  a = a.split("/");
  for (var b = 0; b < a.length;) {
    "." == a[b] ? a.splice(b, 1) : b && ".." == a[b] && a[b - 1] && ".." != a[b - 1] ? a.splice(--b, 2) : b++;
  }
  return a.join("/");
};
goog.loadFileSync_ = function(a) {
  if (goog.global.CLOSURE_LOAD_FILE_SYNC) {
    return goog.global.CLOSURE_LOAD_FILE_SYNC(a);
  }
  try {
    var b = new goog.global.XMLHttpRequest();
    b.open("get", a, !1);
    b.send();
    return 0 == b.status || 200 == b.status ? b.responseText : null;
  } catch (c) {
    return null;
  }
};
goog.transpile_ = function(a, b, c) {
  var d = goog.global.$jscomp;
  d || (goog.global.$jscomp = d = {});
  var e = d.transpile;
  if (!e) {
    var f = goog.basePath + goog.TRANSPILER, g = goog.loadFileSync_(f);
    if (g) {
      (function() {
        (0,eval)(g + "\n//# sourceURL=" + f);
      }).call(goog.global);
      if (goog.global.$gwtExport && goog.global.$gwtExport.$jscomp && !goog.global.$gwtExport.$jscomp.transpile) {
        throw Error('The transpiler did not properly export the "transpile" method. $gwtExport: ' + JSON.stringify(goog.global.$gwtExport));
      }
      goog.global.$jscomp.transpile = goog.global.$gwtExport.$jscomp.transpile;
      d = goog.global.$jscomp;
      e = d.transpile;
    }
  }
  e || (e = d.transpile = function(k, h) {
    goog.logToConsole_(h + " requires transpilation but no transpiler was found.");
    return k;
  });
  return e(a, b, c);
};
goog.typeOf = function(a) {
  var b = typeof a;
  return "object" != b ? b : a ? Array.isArray(a) ? "array" : b : "null";
};
goog.isArrayLike = function(a) {
  var b = goog.typeOf(a);
  return "array" == b || "object" == b && "number" == typeof a.length;
};
goog.isDateLike = function(a) {
  return goog.isObject(a) && "function" == typeof a.getFullYear;
};
goog.isObject = function(a) {
  var b = typeof a;
  return "object" == b && null != a || "function" == b;
};
goog.getUid = function(a) {
  return Object.prototype.hasOwnProperty.call(a, goog.UID_PROPERTY_) && a[goog.UID_PROPERTY_] || (a[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};
goog.hasUid = function(a) {
  return !!a[goog.UID_PROPERTY_];
};
goog.removeUid = function(a) {
  null !== a && "removeAttribute" in a && a.removeAttribute(goog.UID_PROPERTY_);
  try {
    delete a[goog.UID_PROPERTY_];
  } catch (b) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (1e9 * Math.random() >>> 0);
goog.uidCounter_ = 0;
goog.cloneObject = function(a) {
  var b = goog.typeOf(a);
  if ("object" == b || "array" == b) {
    if ("function" === typeof a.clone) {
      return a.clone();
    }
    if ("undefined" !== typeof Map && a instanceof Map) {
      return new Map(a);
    }
    if ("undefined" !== typeof Set && a instanceof Set) {
      return new Set(a);
    }
    b = "array" == b ? [] : {};
    for (var c in a) {
      b[c] = goog.cloneObject(a[c]);
    }
    return b;
  }
  return a;
};
goog.bindNative_ = function(a, b, c) {
  return a.call.apply(a.bind, arguments);
};
goog.bindJs_ = function(a, b, c) {
  if (!a) {
    throw Error();
  }
  if (2 < arguments.length) {
    var d = Array.prototype.slice.call(arguments, 2);
    return function() {
      var e = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(e, d);
      return a.apply(b, e);
    };
  }
  return function() {
    return a.apply(b, arguments);
  };
};
goog.bind = function(a, b, c) {
  Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? goog.bind = goog.bindNative_ : goog.bind = goog.bindJs_;
  return goog.bind.apply(null, arguments);
};
goog.partial = function(a, b) {
  var c = Array.prototype.slice.call(arguments, 1);
  return function() {
    var d = c.slice();
    d.push.apply(d, arguments);
    return a.apply(this, d);
  };
};
goog.now = function() {
  return Date.now();
};
goog.globalEval = function(a) {
  (0,eval)(a);
};
goog.getCssName = function(a, b) {
  if ("." == String(a).charAt(0)) {
    throw Error('className passed in goog.getCssName must not start with ".". You passed: ' + a);
  }
  var c = function(e) {
    return goog.cssNameMapping_[e] || e;
  }, d = function(e) {
    e = e.split("-");
    for (var f = [], g = 0; g < e.length; g++) {
      f.push(c(e[g]));
    }
    return f.join("-");
  };
  d = goog.cssNameMapping_ ? "BY_WHOLE" == goog.cssNameMappingStyle_ ? c : d : function(e) {
    return e;
  };
  a = b ? a + "-" + d(b) : d(a);
  return goog.global.CLOSURE_CSS_NAME_MAP_FN ? goog.global.CLOSURE_CSS_NAME_MAP_FN(a) : a;
};
goog.setCssNameMapping = function(a, b) {
  goog.cssNameMapping_ = a;
  goog.cssNameMappingStyle_ = b;
};
!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING && (goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING);
goog.GetMsgOptions = function() {
};
goog.getMsg = function(a, b, c) {
  c && c.html && (a = a.replace(/</g, "&lt;"));
  c && c.unescapeHtmlEntities && (a = a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  b && (a = a.replace(/\{\$([^}]+)}/g, function(d, e) {
    return null != b && e in b ? b[e] : d;
  }));
  return a;
};
goog.getMsgWithFallback = function(a, b) {
  return a;
};
goog.exportSymbol = function(a, b, c) {
  goog.exportPath_(a, b, !0, c);
};
goog.exportProperty = function(a, b, c) {
  a[b] = c;
};
goog.inherits = function(a, b) {
  function c() {
  }
  c.prototype = b.prototype;
  a.superClass_ = b.prototype;
  a.prototype = new c();
  a.prototype.constructor = a;
  a.base = function(d, e, f) {
    for (var g = Array(arguments.length - 2), k = 2; k < arguments.length; k++) {
      g[k - 2] = arguments[k];
    }
    return b.prototype[e].apply(d, g);
  };
};
goog.scope = function(a) {
  if (goog.isInModuleLoader_()) {
    throw Error("goog.scope is not supported within a module.");
  }
  a.call(goog.global);
};
COMPILED || (goog.global.COMPILED = COMPILED);
goog.defineClass = function(a, b) {
  var c = b.constructor, d = b.statics;
  c && c != Object.prototype.constructor || (c = function() {
    throw Error("cannot instantiate an interface (no constructor defined).");
  });
  c = goog.defineClass.createSealingConstructor_(c, a);
  a && goog.inherits(c, a);
  delete b.constructor;
  delete b.statics;
  goog.defineClass.applyProperties_(c.prototype, b);
  null != d && (d instanceof Function ? d(c) : goog.defineClass.applyProperties_(c, d));
  return c;
};
goog.defineClass.SEAL_CLASS_INSTANCES = goog.DEBUG;
goog.defineClass.createSealingConstructor_ = function(a, b) {
  return goog.defineClass.SEAL_CLASS_INSTANCES ? function() {
    var c = a.apply(this, arguments) || this;
    c[goog.UID_PROPERTY_] = c[goog.UID_PROPERTY_];
    return c;
  } : a;
};
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
goog.defineClass.applyProperties_ = function(a, b) {
  for (var c in b) {
    Object.prototype.hasOwnProperty.call(b, c) && (a[c] = b[c]);
  }
  for (var d = 0; d < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length; d++) {
    c = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[d], Object.prototype.hasOwnProperty.call(b, c) && (a[c] = b[c]);
  }
};
goog.identity_ = function(a) {
  return a;
};
goog.createTrustedTypesPolicy = function(a) {
  var b = null, c = goog.global.trustedTypes;
  if (!c || !c.createPolicy) {
    return b;
  }
  try {
    b = c.createPolicy(a, {createHTML:goog.identity_, createScript:goog.identity_, createScriptURL:goog.identity_});
  } catch (d) {
    goog.logToConsole_(d.message);
  }
  return b;
};
!COMPILED && goog.DEPENDENCIES_ENABLED && (goog.isEdge_ = function() {
  return !!(goog.global.navigator && goog.global.navigator.userAgent ? goog.global.navigator.userAgent : "").match(/Edge\/(\d+)(\.\d)*/i);
}, goog.inHtmlDocument_ = function() {
  var a = goog.global.document;
  return null != a && "write" in a;
}, goog.isDocumentLoading_ = function() {
  var a = goog.global.document;
  return a.attachEvent ? "complete" != a.readyState : "loading" == a.readyState;
}, goog.findBasePath_ = function() {
  if (void 0 != goog.global.CLOSURE_BASE_PATH && "string" === typeof goog.global.CLOSURE_BASE_PATH) {
    goog.basePath = goog.global.CLOSURE_BASE_PATH;
  } else if (goog.inHtmlDocument_()) {
    var a = goog.global.document, b = a.currentScript;
    a = b ? [b] : a.getElementsByTagName("SCRIPT");
    for (b = a.length - 1; 0 <= b; --b) {
      var c = a[b].src, d = c.lastIndexOf("?");
      d = -1 == d ? c.length : d;
      if ("base.js" == c.slice(d - 7, d)) {
        goog.basePath = c.slice(0, d - 7);
        break;
      }
    }
  }
}, goog.findBasePath_(), goog.Transpiler = function() {
  this.requiresTranspilation_ = null;
  this.transpilationTarget_ = goog.TRANSPILE_TO_LANGUAGE;
}, goog.Transpiler.prototype.createRequiresTranspilation_ = function() {
  function a(f, g) {
    e ? d[f] = !0 : g() ? (c = f, d[f] = !1) : e = d[f] = !0;
  }
  function b(f) {
    try {
      return !!eval(goog.CLOSURE_EVAL_PREFILTER_.createScript(f));
    } catch (g) {
      return !1;
    }
  }
  var c = "es3", d = {es3:!1}, e = !1;
  a("es5", function() {
    return b("[1,].length==1");
  });
  a("es6", function() {
    return goog.isEdge_() ? !1 : b('(()=>{"use strict";class X{constructor(){if(new.target!=String)throw 1;this.x=42}}let q=Reflect.construct(X,[],String);if(q.x!=42||!(q instanceof String))throw 1;for(const a of[2,3]){if(a==2)continue;function f(z={a}){let a=0;return z.a}{function f(){return 0;}}return f()==3}})()');
  });
  a("es7", function() {
    return b("2**3==8");
  });
  a("es8", function() {
    return b("async()=>1,1");
  });
  a("es9", function() {
    return b("({...rest}={}),1");
  });
  a("es_2019", function() {
    return b('let r;try{r="\u2029"}catch{};r');
  });
  a("es_2020", function() {
    return b("null?.x??1");
  });
  a("es_next", function() {
    return !1;
  });
  return {target:c, map:d};
}, goog.Transpiler.prototype.needsTranspile = function(a, b) {
  if ("always" == goog.TRANSPILE) {
    return !0;
  }
  if ("never" == goog.TRANSPILE) {
    return !1;
  }
  if (!this.requiresTranspilation_) {
    var c = this.createRequiresTranspilation_();
    this.requiresTranspilation_ = c.map;
    this.transpilationTarget_ = this.transpilationTarget_ || c.target;
  }
  if (a in this.requiresTranspilation_) {
    return this.requiresTranspilation_[a] ? !0 : !goog.inHtmlDocument_() || "es6" != b || "noModule" in goog.global.document.createElement("script") ? !1 : !0;
  }
  throw Error("Unknown language mode: " + a);
}, goog.Transpiler.prototype.transpile = function(a, b) {
  return goog.transpile_(a, b, this.transpilationTarget_);
}, goog.transpiler_ = new goog.Transpiler(), goog.protectScriptTag_ = function(a) {
  return a.replace(/<\/(SCRIPT)/ig, "\\x3c/$1");
}, goog.DebugLoader_ = function() {
  this.dependencies_ = {};
  this.idToPath_ = {};
  this.written_ = {};
  this.loadingDeps_ = [];
  this.depsToLoad_ = [];
  this.paused_ = !1;
  this.factory_ = new goog.DependencyFactory(goog.transpiler_);
  this.deferredCallbacks_ = {};
  this.deferredQueue_ = [];
}, goog.DebugLoader_.prototype.bootstrap = function(a, b) {
  function c() {
    d && (goog.global.setTimeout(d, 0), d = null);
  }
  var d = b;
  if (a.length) {
    b = [];
    for (var e = 0; e < a.length; e++) {
      var f = this.getPathFromDeps_(a[e]);
      if (!f) {
        throw Error("Unregonized namespace: " + a[e]);
      }
      b.push(this.dependencies_[f]);
    }
    f = goog.require;
    var g = 0;
    for (e = 0; e < a.length; e++) {
      f(a[e]), b[e].onLoad(function() {
        ++g == a.length && c();
      });
    }
  } else {
    c();
  }
}, goog.DebugLoader_.prototype.loadClosureDeps = function() {
  this.depsToLoad_.push(this.factory_.createDependency(goog.normalizePath_(goog.basePath + "deps.js"), "deps.js", [], [], {}, !1));
  this.loadDeps_();
}, goog.DebugLoader_.prototype.requested = function(a, b) {
  (a = this.getPathFromDeps_(a)) && (b || this.areDepsLoaded_(this.dependencies_[a].requires)) && (b = this.deferredCallbacks_[a]) && (delete this.deferredCallbacks_[a], b());
}, goog.DebugLoader_.prototype.setDependencyFactory = function(a) {
  this.factory_ = a;
}, goog.DebugLoader_.prototype.load_ = function(a) {
  if (this.getPathFromDeps_(a)) {
    var b = this, c = [], d = function(e) {
      var f = b.getPathFromDeps_(e);
      if (!f) {
        throw Error("Bad dependency path or symbol: " + e);
      }
      if (!b.written_[f]) {
        b.written_[f] = !0;
        e = b.dependencies_[f];
        for (f = 0; f < e.requires.length; f++) {
          goog.isProvided_(e.requires[f]) || d(e.requires[f]);
        }
        c.push(e);
      }
    };
    d(a);
    a = !!this.depsToLoad_.length;
    this.depsToLoad_ = this.depsToLoad_.concat(c);
    this.paused_ || a || this.loadDeps_();
  } else {
    goog.logToConsole_("goog.require could not find: " + a);
  }
}, goog.DebugLoader_.prototype.loadDeps_ = function() {
  for (var a = this, b = this.paused_; this.depsToLoad_.length && !b;) {
    (function() {
      var c = !1, d = a.depsToLoad_.shift(), e = !1;
      a.loading_(d);
      var f = {pause:function() {
        if (c) {
          throw Error("Cannot call pause after the call to load.");
        }
        b = !0;
      }, resume:function() {
        c ? a.resume_() : b = !1;
      }, loaded:function() {
        if (e) {
          throw Error("Double call to loaded.");
        }
        e = !0;
        a.loaded_(d);
      }, pending:function() {
        for (var g = [], k = 0; k < a.loadingDeps_.length; k++) {
          g.push(a.loadingDeps_[k]);
        }
        return g;
      }, setModuleState:function(g) {
        goog.moduleLoaderState_ = {type:g, moduleName:"", declareLegacyNamespace:!1};
      }, registerEs6ModuleExports:function(g, k, h) {
        h && (goog.loadedModules_[h] = {exports:k, type:goog.ModuleType.ES6, moduleId:h || ""});
      }, registerGoogModuleExports:function(g, k) {
        goog.loadedModules_[g] = {exports:k, type:goog.ModuleType.GOOG, moduleId:g};
      }, clearModuleState:function() {
        goog.moduleLoaderState_ = null;
      }, defer:function(g) {
        if (c) {
          throw Error("Cannot register with defer after the call to load.");
        }
        a.defer_(d, g);
      }, areDepsLoaded:function() {
        return a.areDepsLoaded_(d.requires);
      }};
      try {
        d.load(f);
      } finally {
        c = !0;
      }
    })();
  }
  b && this.pause_();
}, goog.DebugLoader_.prototype.pause_ = function() {
  this.paused_ = !0;
}, goog.DebugLoader_.prototype.resume_ = function() {
  this.paused_ && (this.paused_ = !1, this.loadDeps_());
}, goog.DebugLoader_.prototype.loading_ = function(a) {
  this.loadingDeps_.push(a);
}, goog.DebugLoader_.prototype.loaded_ = function(a) {
  for (var b = 0; b < this.loadingDeps_.length; b++) {
    if (this.loadingDeps_[b] == a) {
      this.loadingDeps_.splice(b, 1);
      break;
    }
  }
  for (b = 0; b < this.deferredQueue_.length; b++) {
    if (this.deferredQueue_[b] == a.path) {
      this.deferredQueue_.splice(b, 1);
      break;
    }
  }
  if (this.loadingDeps_.length == this.deferredQueue_.length && !this.depsToLoad_.length) {
    for (; this.deferredQueue_.length;) {
      this.requested(this.deferredQueue_.shift(), !0);
    }
  }
  a.loaded();
}, goog.DebugLoader_.prototype.areDepsLoaded_ = function(a) {
  for (var b = 0; b < a.length; b++) {
    var c = this.getPathFromDeps_(a[b]);
    if (!c || !(c in this.deferredCallbacks_ || goog.isProvided_(a[b]))) {
      return !1;
    }
  }
  return !0;
}, goog.DebugLoader_.prototype.getPathFromDeps_ = function(a) {
  return a in this.idToPath_ ? this.idToPath_[a] : a in this.dependencies_ ? a : null;
}, goog.DebugLoader_.prototype.defer_ = function(a, b) {
  this.deferredCallbacks_[a.path] = b;
  this.deferredQueue_.push(a.path);
}, goog.LoadController = function() {
}, goog.LoadController.prototype.pause = function() {
}, goog.LoadController.prototype.resume = function() {
}, goog.LoadController.prototype.loaded = function() {
}, goog.LoadController.prototype.pending = function() {
}, goog.LoadController.prototype.registerEs6ModuleExports = function(a, b, c) {
}, goog.LoadController.prototype.setModuleState = function(a) {
}, goog.LoadController.prototype.clearModuleState = function() {
}, goog.LoadController.prototype.defer = function(a) {
}, goog.LoadController.prototype.areDepsLoaded = function() {
}, goog.Dependency = function(a, b, c, d, e) {
  this.path = a;
  this.relativePath = b;
  this.provides = c;
  this.requires = d;
  this.loadFlags = e;
  this.loaded_ = !1;
  this.loadCallbacks_ = [];
}, goog.Dependency.prototype.getPathName = function() {
  var a = this.path, b = a.indexOf("://");
  0 <= b && (a = a.substring(b + 3), b = a.indexOf("/"), 0 <= b && (a = a.substring(b + 1)));
  return a;
}, goog.Dependency.prototype.onLoad = function(a) {
  this.loaded_ ? a() : this.loadCallbacks_.push(a);
}, goog.Dependency.prototype.loaded = function() {
  this.loaded_ = !0;
  var a = this.loadCallbacks_;
  this.loadCallbacks_ = [];
  for (var b = 0; b < a.length; b++) {
    a[b]();
  }
}, goog.Dependency.defer_ = !1, goog.Dependency.callbackMap_ = {}, goog.Dependency.registerCallback_ = function(a) {
  var b = Math.random().toString(32);
  goog.Dependency.callbackMap_[b] = a;
  return b;
}, goog.Dependency.unregisterCallback_ = function(a) {
  delete goog.Dependency.callbackMap_[a];
}, goog.Dependency.callback_ = function(a, b) {
  if (a in goog.Dependency.callbackMap_) {
    for (var c = goog.Dependency.callbackMap_[a], d = [], e = 1; e < arguments.length; e++) {
      d.push(arguments[e]);
    }
    c.apply(void 0, d);
  } else {
    throw Error("Callback key " + a + " does not exist (was base.js loaded more than once?).");
  }
}, goog.Dependency.prototype.load = function(a) {
  if (goog.global.CLOSURE_IMPORT_SCRIPT) {
    goog.global.CLOSURE_IMPORT_SCRIPT(this.path) ? a.loaded() : a.pause();
  } else {
    if (goog.inHtmlDocument_()) {
      var b = goog.global.document;
      if ("complete" == b.readyState && !goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING) {
        if (/\bdeps.js$/.test(this.path)) {
          a.loaded();
          return;
        }
        throw Error('Cannot write "' + this.path + '" after document load');
      }
      var c = goog.getScriptNonce_();
      if (!goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING && goog.isDocumentLoading_()) {
        var d = function(k) {
          k.readyState && "complete" != k.readyState ? k.onload = d : (goog.Dependency.unregisterCallback_(e), a.loaded());
        };
        var e = goog.Dependency.registerCallback_(d);
        c = c ? ' nonce="' + c + '"' : "";
        var f = '<script src="' + this.path + '"' + c + (goog.Dependency.defer_ ? " defer" : "") + ' id="script-' + e + '">\x3c/script>';
        f += "<script" + c + ">";
        f = goog.Dependency.defer_ ? f + ("document.getElementById('script-" + e + "').onload = function() {\n  goog.Dependency.callback_('" + e + "', this);\n};\n") : f + ("goog.Dependency.callback_('" + e + "', document.getElementById('script-" + e + "'));");
        f += "\x3c/script>";
        b.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(f) : f);
      } else {
        var g = b.createElement("script");
        g.defer = goog.Dependency.defer_;
        g.async = !1;
        c && (g.nonce = c);
        g.onload = function() {
          g.onload = null;
          a.loaded();
        };
        g.src = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScriptURL(this.path) : this.path;
        b.head.appendChild(g);
      }
    } else {
      goog.logToConsole_("Cannot use default debug loader outside of HTML documents."), "deps.js" == this.relativePath ? (goog.logToConsole_("Consider setting CLOSURE_IMPORT_SCRIPT before loading base.js, or setting CLOSURE_NO_DEPS to true."), a.loaded()) : a.pause();
    }
  }
}, goog.Es6ModuleDependency = function(a, b, c, d, e) {
  goog.Dependency.call(this, a, b, c, d, e);
}, goog.inherits(goog.Es6ModuleDependency, goog.Dependency), goog.Es6ModuleDependency.prototype.load = function(a) {
  function b(l, m) {
    var q = "", r = goog.getScriptNonce_();
    r && (q = ' nonce="' + r + '"');
    l = m ? '<script type="module" crossorigin' + q + ">" + m + "\x3c/script>" : '<script type="module" crossorigin src="' + l + '"' + q + ">\x3c/script>";
    d.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(l) : l);
  }
  function c(l, m) {
    var q = d.createElement("script");
    q.defer = !0;
    q.async = !1;
    q.type = "module";
    q.setAttribute("crossorigin", !0);
    var r = goog.getScriptNonce_();
    r && (q.nonce = r);
    m ? q.text = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScript(m) : m : q.src = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScriptURL(l) : l;
    d.head.appendChild(q);
  }
  if (goog.global.CLOSURE_IMPORT_SCRIPT) {
    goog.global.CLOSURE_IMPORT_SCRIPT(this.path) ? a.loaded() : a.pause();
  } else {
    if (goog.inHtmlDocument_()) {
      var d = goog.global.document, e = this;
      if (goog.isDocumentLoading_()) {
        var f = b;
        goog.Dependency.defer_ = !0;
      } else {
        f = c;
      }
      var g = goog.Dependency.registerCallback_(function() {
        goog.Dependency.unregisterCallback_(g);
        a.setModuleState(goog.ModuleType.ES6);
      });
      f(void 0, 'goog.Dependency.callback_("' + g + '")');
      f(this.path, void 0);
      var k = goog.Dependency.registerCallback_(function(l) {
        goog.Dependency.unregisterCallback_(k);
        a.registerEs6ModuleExports(e.path, l, goog.moduleLoaderState_.moduleName);
      });
      f(void 0, 'import * as m from "' + this.path + '"; goog.Dependency.callback_("' + k + '", m)');
      var h = goog.Dependency.registerCallback_(function() {
        goog.Dependency.unregisterCallback_(h);
        a.clearModuleState();
        a.loaded();
      });
      f(void 0, 'goog.Dependency.callback_("' + h + '")');
    } else {
      goog.logToConsole_("Cannot use default debug loader outside of HTML documents."), a.pause();
    }
  }
}, goog.TransformedDependency = function(a, b, c, d, e) {
  goog.Dependency.call(this, a, b, c, d, e);
  this.contents_ = null;
  this.lazyFetch_ = !goog.inHtmlDocument_() || !("noModule" in goog.global.document.createElement("script"));
}, goog.inherits(goog.TransformedDependency, goog.Dependency), goog.TransformedDependency.prototype.load = function(a) {
  function b() {
    e.contents_ = goog.loadFileSync_(e.path);
    e.contents_ && (e.contents_ = e.transform(e.contents_), e.contents_ && (e.contents_ += "\n//# sourceURL=" + e.path));
  }
  function c() {
    e.lazyFetch_ && b();
    if (e.contents_) {
      f && a.setModuleState(goog.ModuleType.ES6);
      try {
        var l = e.contents_;
        e.contents_ = null;
        goog.globalEval(goog.CLOSURE_EVAL_PREFILTER_.createScript(l));
        if (f) {
          var m = goog.moduleLoaderState_.moduleName;
        }
      } finally {
        f && a.clearModuleState();
      }
      f && goog.global.$jscomp.require.ensure([e.getPathName()], function() {
        a.registerEs6ModuleExports(e.path, goog.global.$jscomp.require(e.getPathName()), m);
      });
      a.loaded();
    }
  }
  function d() {
    var l = goog.global.document, m = goog.Dependency.registerCallback_(function() {
      goog.Dependency.unregisterCallback_(m);
      c();
    }), q = goog.getScriptNonce_();
    q = "<script" + (q ? ' nonce="' + q + '"' : "") + ">" + goog.protectScriptTag_('goog.Dependency.callback_("' + m + '");') + "\x3c/script>";
    l.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(q) : q);
  }
  var e = this;
  if (goog.global.CLOSURE_IMPORT_SCRIPT) {
    b(), this.contents_ && goog.global.CLOSURE_IMPORT_SCRIPT("", this.contents_) ? (this.contents_ = null, a.loaded()) : a.pause();
  } else {
    var f = this.loadFlags.module == goog.ModuleType.ES6;
    this.lazyFetch_ || b();
    var g = 1 < a.pending().length;
    if (goog.Dependency.defer_ && (g || goog.isDocumentLoading_())) {
      a.defer(function() {
        c();
      });
    } else {
      var k = goog.global.document;
      g = goog.inHtmlDocument_() && ("ActiveXObject" in goog.global || goog.isEdge_());
      if (f && goog.inHtmlDocument_() && goog.isDocumentLoading_() && !g) {
        goog.Dependency.defer_ = !0;
        a.pause();
        var h = k.onreadystatechange;
        k.onreadystatechange = function() {
          "interactive" == k.readyState && (k.onreadystatechange = h, c(), a.resume());
          "function" === typeof h && h.apply(void 0, arguments);
        };
      } else {
        goog.inHtmlDocument_() && goog.isDocumentLoading_() ? d() : c();
      }
    }
  }
}, goog.TransformedDependency.prototype.transform = function(a) {
}, goog.TranspiledDependency = function(a, b, c, d, e, f) {
  goog.TransformedDependency.call(this, a, b, c, d, e);
  this.transpiler = f;
}, goog.inherits(goog.TranspiledDependency, goog.TransformedDependency), goog.TranspiledDependency.prototype.transform = function(a) {
  return this.transpiler.transpile(a, this.getPathName());
}, goog.PreTranspiledEs6ModuleDependency = function(a, b, c, d, e) {
  goog.TransformedDependency.call(this, a, b, c, d, e);
}, goog.inherits(goog.PreTranspiledEs6ModuleDependency, goog.TransformedDependency), goog.PreTranspiledEs6ModuleDependency.prototype.transform = function(a) {
  return a;
}, goog.GoogModuleDependency = function(a, b, c, d, e, f, g) {
  goog.TransformedDependency.call(this, a, b, c, d, e);
  this.needsTranspile_ = f;
  this.transpiler_ = g;
}, goog.inherits(goog.GoogModuleDependency, goog.TransformedDependency), goog.GoogModuleDependency.prototype.transform = function(a) {
  this.needsTranspile_ && (a = this.transpiler_.transpile(a, this.getPathName()));
  return goog.LOAD_MODULE_USING_EVAL && void 0 !== goog.global.JSON ? "goog.loadModule(" + goog.global.JSON.stringify(a + "\n//# sourceURL=" + this.path + "\n") + ");" : 'goog.loadModule(function(exports) {"use strict";' + a + "\n;return exports});\n//# sourceURL=" + this.path + "\n";
}, goog.DebugLoader_.prototype.addDependency = function(a, b, c, d) {
  b = b || [];
  a = a.replace(/\\/g, "/");
  var e = goog.normalizePath_(goog.basePath + a);
  d && "boolean" !== typeof d || (d = d ? {module:goog.ModuleType.GOOG} : {});
  c = this.factory_.createDependency(e, a, b, c, d, goog.transpiler_.needsTranspile(d.lang || "es3", d.module));
  this.dependencies_[e] = c;
  for (c = 0; c < b.length; c++) {
    this.idToPath_[b[c]] = e;
  }
  this.idToPath_[a] = e;
}, goog.DependencyFactory = function(a) {
  this.transpiler = a;
}, goog.DependencyFactory.prototype.createDependency = function(a, b, c, d, e, f) {
  return e.module == goog.ModuleType.GOOG ? new goog.GoogModuleDependency(a, b, c, d, e, f, this.transpiler) : f ? new goog.TranspiledDependency(a, b, c, d, e, this.transpiler) : e.module == goog.ModuleType.ES6 ? "never" == goog.TRANSPILE && goog.ASSUME_ES_MODULES_TRANSPILED ? new goog.PreTranspiledEs6ModuleDependency(a, b, c, d, e) : new goog.Es6ModuleDependency(a, b, c, d, e) : new goog.Dependency(a, b, c, d, e);
}, goog.debugLoader_ = new goog.DebugLoader_(), goog.loadClosureDeps = function() {
  goog.debugLoader_.loadClosureDeps();
}, goog.setDependencyFactory = function(a) {
  goog.debugLoader_.setDependencyFactory(a);
}, goog.TRUSTED_TYPES_POLICY_ = goog.TRUSTED_TYPES_POLICY_NAME ? goog.createTrustedTypesPolicy(goog.TRUSTED_TYPES_POLICY_NAME + "#base") : null, goog.global.CLOSURE_NO_DEPS || goog.debugLoader_.loadClosureDeps(), goog.bootstrap = function(a, b) {
  goog.debugLoader_.bootstrap(a, b);
});
if (!COMPILED) {
  var isChrome87 = !1;
  try {
    isChrome87 = eval(goog.global.trustedTypes.emptyScript) !== goog.global.trustedTypes.emptyScript;
  } catch (a) {
  }
  goog.CLOSURE_EVAL_PREFILTER_ = goog.global.trustedTypes && isChrome87 && goog.createTrustedTypesPolicy("goog#base#devonly#eval") || {createScript:goog.identity_};
}
;
// Input 1
goog.json = {};
goog.json.Replacer = {};
goog.json.Reviver = {};
goog.json.USE_NATIVE_JSON = !1;
goog.json.TRY_NATIVE_JSON = !0;
goog.json.isValid = function(a) {
  return /^\s*$/.test(a) ? !1 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, "@").replace(/(?:"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)[\s\u2028\u2029]*(?=:|,|]|}|$)/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""));
};
goog.json.errorLogger_ = () => {
};
goog.json.setErrorLogger = function(a) {
  goog.json.errorLogger_ = a;
};
goog.json.parse = goog.json.USE_NATIVE_JSON ? goog.global.JSON.parse : function(a) {
  let b;
  if (goog.json.TRY_NATIVE_JSON) {
    try {
      return goog.global.JSON.parse(a);
    } catch (c) {
      b = c;
    }
  }
  a = String(a);
  if (goog.json.isValid(a)) {
    try {
      const c = eval("(" + a + ")");
      b && goog.json.errorLogger_("Invalid JSON: " + a, b);
      return c;
    } catch (c) {
    }
  }
  throw Error("Invalid JSON string: " + a);
};
goog.json.serialize = goog.json.USE_NATIVE_JSON ? goog.global.JSON.stringify : function(a, b) {
  return (new goog.json.Serializer(b)).serialize(a);
};
goog.json.Serializer = function(a) {
  this.replacer_ = a;
};
goog.json.Serializer.prototype.serialize = function(a) {
  const b = [];
  this.serializeInternal(a, b);
  return b.join("");
};
goog.json.Serializer.prototype.serializeInternal = function(a, b) {
  if (null == a) {
    b.push("null");
  } else {
    if ("object" == typeof a) {
      if (Array.isArray(a)) {
        this.serializeArray(a, b);
        return;
      }
      if (a instanceof String || a instanceof Number || a instanceof Boolean) {
        a = a.valueOf();
      } else {
        this.serializeObject_(a, b);
        return;
      }
    }
    switch(typeof a) {
      case "string":
        this.serializeString_(a, b);
        break;
      case "number":
        this.serializeNumber_(a, b);
        break;
      case "boolean":
        b.push(String(a));
        break;
      case "function":
        b.push("null");
        break;
      default:
        throw Error("Unknown type: " + typeof a);
    }
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\v":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\"\x00-\x1f\x7f-\uffff]/g : /[\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(a, b) {
  b.push('"', a.replace(goog.json.Serializer.charsToReplace_, function(c) {
    let d = goog.json.Serializer.charToJsonCharCache_[c];
    d || (d = "\\u" + (c.charCodeAt(0) | 65536).toString(16).slice(1), goog.json.Serializer.charToJsonCharCache_[c] = d);
    return d;
  }), '"');
};
goog.json.Serializer.prototype.serializeNumber_ = function(a, b) {
  b.push(isFinite(a) && !isNaN(a) ? String(a) : "null");
};
goog.json.Serializer.prototype.serializeArray = function(a, b) {
  const c = a.length;
  b.push("[");
  var d = "";
  for (let e = 0; e < c; e++) {
    b.push(d), d = a[e], this.serializeInternal(this.replacer_ ? this.replacer_.call(a, String(e), d) : d, b), d = ",";
  }
  b.push("]");
};
goog.json.Serializer.prototype.serializeObject_ = function(a, b) {
  b.push("{");
  let c = "";
  for (const d in a) {
    if (Object.prototype.hasOwnProperty.call(a, d)) {
      const e = a[d];
      "function" != typeof e && (b.push(c), this.serializeString_(d, b), b.push(":"), this.serializeInternal(this.replacer_ ? this.replacer_.call(a, d, e) : e, b), c = ",");
    }
  }
  b.push("}");
};
// Input 2
var config = {app_service_endpoint:"https://app.link", link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api2.branch.io", version:"2.74.0"};
// Input 3
var safejson = {parse:function(a) {
  a = String(a);
  try {
    return JSON.parse(a);
  } catch (b) {
  }
  throw Error("Invalid JSON string: " + a);
}, stringify:function(a) {
  try {
    return "object" === typeof JSON && "function" === typeof JSON.stringify ? JSON.stringify(a) : goog.json.serialize(a);
  } catch (b) {
  }
  throw Error("Could not stringify object");
}};
// Input 4
var utils = {}, message;
utils.debug = !1;
utils.retries = 2;
utils.retry_delay = 200;
utils.timeout = 5000;
utils.nonce = "";
utils.extendedJourneysAssistExpiryTime = 604800000;
utils.instrumentation = {};
utils.userAgentData = null;
utils.navigationTimingAPIEnabled = "undefined" !== typeof window && !!(window.performance && window.performance.timing && window.performance.timing.navigationStart);
utils.timeSinceNavigationStart = function() {
  return (Date.now() - window.performance.timing.navigationStart).toString();
};
utils.currentRequestBrttTag = "";
utils.calculateBrtt = function(a) {
  return a && "number" === typeof a ? (Date.now() - a).toString() : null;
};
utils.dismissEventToSourceMapping = {didClickJourneyClose:"Button(X)", didClickJourneyContinue:"Dismiss Journey text", didClickJourneyBackgroundDismiss:"Background Dismiss", didScrollJourneyBackgroundDismiss:"Background Dismiss"};
utils.userPreferences = {trackingDisabled:!1, enableExtendedJourneysAssist:!1, whiteListedEndpointsWithData:{"/v1/open":{link_identifier:"\\d+"}, "/v1/pageview":{event:"pageview"}, "/v1/dismiss":{event:"dismiss"}, "/v1/url":{}}, allowErrorsInCallback:!1, shouldBlockRequest:function(a, b) {
  var c = document.createElement("a");
  c.href = a;
  a = [config.api_endpoint, config.app_service_endpoint, config.link_service_endpoint];
  var d = c.origin;
  d.endsWith("/") && (d = d.substring(0, d.length - 1));
  if (!a.includes(d)) {
    return !1;
  }
  c = c.pathname;
  "/" != c[0] && (c = "/" + c);
  c = utils.userPreferences.whiteListedEndpointsWithData[c];
  if (!c) {
    return !0;
  }
  if (0 < Object.keys(c).length) {
    if (!b) {
      return !0;
    }
    for (var e in c) {
      if (a = new RegExp(c[e]), !b.hasOwnProperty(e) || !a.test(b[e])) {
        return !0;
      }
    }
  }
  return !1;
}};
utils.generateDynamicBNCLink = function(a, b) {
  if (a || b) {
    a = config.link_service_endpoint + "/a/" + a + "?";
    for (var c = "tags alias channel feature stage campaign type duration sdk source data".split(" "), d = 0; d < c.length; d++) {
      var e = c[d], f = b[e];
      if (f) {
        if ("tags" === e && Array.isArray(f)) {
          for (var g = 0; g < f.length; g++) {
            a = ("?" === a[a.length - 1] ? a + e : a + "&" + e) + "=" + encodeURIComponent(f[g]);
          }
        } else if ("string" === typeof f && 0 < f.length || "number" === typeof f) {
          "data" === e && "string" === typeof f && (f = utils.base64encode(f)), a = ("?" === a[a.length - 1] ? a + e : a + "&" + e) + "=" + encodeURIComponent(f);
        }
      }
    }
    return a;
  }
};
utils.cleanApplicationAndSessionStorage = function(a) {
  a && (a.device_fingerprint_id = null, a.sessionLink = null, a.session_id = null, a.identity_id = null, a.identity = null, a.browser_fingerprint_id = null, a._deepviewCta && delete a._deepviewCta, a._deepviewRequestForReplay && delete a._deepviewRequestForReplay, a._storage.remove("branch_view_enabled"), session.set(a._storage, {}, !0));
};
utils.httpMethod = {POST:"POST", GET:"GET"};
utils.messages = {missingParam:"API request $1 missing parameter $2", invalidType:"API request $1, parameter $2 is not $3", nonInit:"Branch SDK not initialized", initPending:"Branch SDK initialization pending and a Branch method was called outside of the queue order", initFailed:"Branch SDK initialization failed, so further methods cannot be called", existingInit:"Branch SDK already initialized", missingAppId:"Missing Branch app ID", callBranchInitFirst:"Branch.init must be called first", timeout:"Request timed out", 
blockedByClient:"Request blocked by client, probably adblock", missingUrl:"Required argument: URL, is missing", trackingDisabled:"Requested operation cannot be completed since tracking is disabled", deepviewNotCalled:"Cannot call Deepview CTA, please call branch.deepview() first"};
utils.bannerThemes = ["light", "dark"];
utils.getLocationSearch = function() {
  return utils.isIframeAndFromSameOrigin() ? window.top.location.search : window.location.search;
};
utils.getLocationHash = function() {
  return utils.isIframeAndFromSameOrigin() ? window.top.location.hash : window.location.hash;
};
utils.message = function(a, b, c, d) {
  a = a.replace(/\$(\d)/g, function(e, f) {
    return b[parseInt(f, 10) - 1];
  });
  c && (a += "\n Failure Code:" + c);
  d && (a += "\n Failure Details:" + d);
  utils.debug && console && console.log(a);
  return a;
};
utils.whiteListSessionData = function(a) {
  return {data:a.data || "", data_parsed:a.data_parsed || {}, has_app:utils.getBooleanOrNull(a.has_app), identity:a.identity || null, developer_identity:a.identity || null, referring_identity:a.referring_identity || null, referring_link:a.referring_link || null};
};
utils.whiteListJourneysLanguageData = function(a) {
  var b = /^\$journeys_\S+$/, c = a.data, d = {};
  if (!c) {
    return {};
  }
  switch(typeof c) {
    case "string":
      try {
        c = safejson.parse(c);
      } catch (e) {
        c = {};
      }
      break;
    case "object":
      break;
    default:
      c = {};
  }
  Object.keys(c).forEach(function(e) {
    b.test(e) && (d[e] = c[e]);
  });
  return d;
};
utils.getWindowLocation = function() {
  return utils.isIframe() ? document.referrer : String(window.location);
};
utils.getParameterByName = function(a) {
  a = a.replace(/[\[\]]/g, "\\$&");
  var b = utils.getWindowLocation();
  return (a = (new RegExp("[?&]" + a + "(=([^&#]*)|&|#|$)")).exec(b)) && a[2] ? decodeURIComponent(a[2].replace(/\+/g, " ")) : "";
};
utils.cleanLinkData = function(a) {
  a.source = "web-sdk";
  var b = a.data;
  switch(typeof b) {
    case "string":
      try {
        b = safejson.parse(b);
      } catch (d) {
        b = {_bncNoEval:!0};
      }
      break;
    case "object":
      break;
    default:
      b = {};
  }
  var c = b.$og_redirect || b.$fallback_url || b.$desktop_url;
  b.$canonical_url || (b.$canonical_url = utils.getWindowLocation());
  b.$og_title || (b.$og_title = c ? null : utils.getOpenGraphContent("title"));
  b.$og_description || (b.$og_description = c ? null : utils.getOpenGraphContent("description"));
  b.$og_image_url || (b.$og_image_url = c ? null : utils.getOpenGraphContent("image"));
  b.$og_video || (b.$og_video = c ? null : utils.getOpenGraphContent("video"));
  b.$og_type || (b.$og_type = c ? null : utils.getOpenGraphContent("type"));
  "string" === typeof b.$desktop_url && (b.$desktop_url = b.$desktop_url.replace(/#r:[a-z0-9-_]+$/i, "").replace(/([\?&]_branch_match_id=\d+)/, ""));
  try {
    safejson.parse(b);
  } catch (d) {
    b = goog.json.serialize(b);
  }
  a.data = b;
  return a;
};
utils.getClickIdAndSearchStringFromLink = function(a) {
  function b(d) {
    return "" !== d;
  }
  if (!a || "string" !== typeof a) {
    return "";
  }
  var c = document.createElement("a");
  c.href = a;
  a = c.pathname && c.pathname.split("/").filter(b);
  return Array.isArray(a) && a.length ? a[a.length - 1] + c.search : c.search;
};
utils.processReferringLink = function(a) {
  return a ? "http" !== a.substring(0, 4) ? config.link_service_endpoint + a : a : null;
};
utils.merge = function(a, b, c) {
  a && "object" === typeof a || (a = {});
  if (!b || "object" !== typeof b) {
    return a;
  }
  for (var d in b) {
    if (b.hasOwnProperty(d)) {
      var e = b[d];
      !c || void 0 !== e && null !== e ? a[d] = e : delete a[d];
    }
  }
  return a;
};
utils.hashValue = function(a) {
  try {
    var b = utils.getLocationHash().match(new RegExp(a + ":([^&]*)"));
    if (b && 1 <= b.length) {
      return b[1];
    }
  } catch (c) {
  }
};
function isSafariBrowser(a) {
  return !!/^((?!chrome|android|crios|firefox|fxios|edg|yabrowser).)*safari/i.test(a);
}
function isChromeBrowser(a) {
  return !!/(chrome|crios)/i.test(a);
}
function isFirefoxBrowser(a) {
  return !!/(fxios|firefox)/i.test(a);
}
function isEdgeBrowser(a) {
  return !!/edg/i.test(a);
}
function isOperaBrowser(a) {
  return !!/(opt|opr)/i.test(a);
}
function isYandexBrowser(a) {
  return !!/yabrowser/i.test(a);
}
function isMacintoshDesktop(a) {
  return a && -1 < a.indexOf("Macintosh");
}
function isGTEVersion(a, b) {
  b = b || 11;
  if ((a = /version\/([^ ]*)/i.exec(a)) && a[1]) {
    try {
      if (parseFloat(a[1]) >= b) {
        return !0;
      }
    } catch (c) {
    }
  }
  return !1;
}
function isSafari13OrGreateriPad(a) {
  return a && isSafariBrowser(a) && isMacintoshDesktop(a) && isGTEVersion(a, 13) && screen.height > screen.width;
}
function isIOS(a) {
  return a && /(iPad|iPod|iPhone)/.test(a);
}
utils.mobileUserAgent = function() {
  var a = navigator.userAgent;
  return a.match(/android/i) ? "android" : a.match(/ipad/i) || isSafari13OrGreateriPad(a) ? "ipad" : a.match(/i(os|p(hone|od))/i) ? "ios" : a.match(/\(BB[1-9][0-9]*;/i) ? "blackberry" : a.match(/Windows Phone/i) ? "windows_phone" : a.match(/Kindle/i) || a.match(/Silk/i) || a.match(/KFTT/i) || a.match(/KFOT/i) || a.match(/KFJWA/i) || a.match(/KFJWI/i) || a.match(/KFSOWI/i) || a.match(/KFTHWA/i) || a.match(/KFTHWI/i) || a.match(/KFAPWA/i) || a.match(/KFAPWI/i) ? "kindle" : !1;
};
utils.isSafari11OrGreater = function() {
  var a = navigator.userAgent;
  return isSafariBrowser(a) ? isGTEVersion(a, 11) : !1;
};
utils.isWebKitBrowser = function() {
  return !!window.webkitURL;
};
utils.isIOSWKWebView = function() {
  var a = navigator.userAgent;
  return utils.isWebKitBrowser() && a && isIOS(a) && !isChromeBrowser(a) && !isFirefoxBrowser(a) && !isEdgeBrowser(a) && !isOperaBrowser(a) && !isYandexBrowser(a);
};
utils.getParamValue = function(a) {
  try {
    var b = utils.getLocationSearch().substring(1).match(new RegExp(a + "=([^&]*)"));
    if (b && 1 <= b.length) {
      return b[1];
    }
  } catch (c) {
  }
};
utils.isKey = function(a) {
  return -1 < a.indexOf("key_");
};
utils.snakeToCamel = function(a) {
  return a.replace(/(\-\w)/g, function(b) {
    return b[1].toUpperCase();
  });
};
utils.base64encode = function(a) {
  var b = "", c, d = 0;
  a = a.replace(/\r\n/g, "\n");
  var e = "";
  for (c = 0; c < a.length; c++) {
    var f = a.charCodeAt(c);
    128 > f ? e += String.fromCharCode(f) : (127 < f && 2048 > f ? e += String.fromCharCode(f >> 6 | 192) : (e += String.fromCharCode(f >> 12 | 224), e += String.fromCharCode(f >> 6 & 63 | 128)), e += String.fromCharCode(f & 63 | 128));
  }
  for (a = e; d < a.length;) {
    var g = a.charCodeAt(d++);
    e = a.charCodeAt(d++);
    c = a.charCodeAt(d++);
    f = g >> 2;
    g = (g & 3) << 4 | e >> 4;
    var k = (e & 15) << 2 | c >> 6;
    var h = c & 63;
    isNaN(e) ? h = k = 64 : isNaN(c) && (h = 64);
    b = b + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(f) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(g) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(k) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(h);
  }
  return b;
};
utils.base64Decode = function(a) {
  return utils.isBase64Encoded(a) ? atob(a) : a;
};
utils.isBase64Encoded = function(a) {
  if ("string" !== typeof a || "" === a || "" === a.trim()) {
    return !1;
  }
  try {
    return btoa(atob(a)) === a;
  } catch (b) {
    return !1;
  }
};
utils.encodeBFPs = function(a) {
  a && a.browser_fingerprint_id && !utils.isBase64Encoded(a.browser_fingerprint_id) && (a.browser_fingerprint_id = btoa(a.browser_fingerprint_id));
  a && a.alternative_browser_fingerprint_id && !utils.isBase64Encoded(a.alternative_browser_fingerprint_id) && (a.alternative_browser_fingerprint_id = btoa(a.alternative_browser_fingerprint_id));
  return a;
};
utils.decodeBFPs = function(a) {
  a && utils.isBase64Encoded(a.browser_fingerprint_id) && (a.browser_fingerprint_id = atob(a.browser_fingerprint_id));
  a && utils.isBase64Encoded(a.alternative_browser_fingerprint_id) && (a.alternative_browser_fingerprint_id = atob(a.alternative_browser_fingerprint_id));
  return a;
};
utils.addEvent = function(a, b, c, d) {
  var e = 0;
  "function" === typeof a.addEventListener ? e = a.addEventListener(b, c, d) : "function" === typeof a.attachEvent ? e = a.attachEvent("on" + b, c) : a["on" + b] = c;
  return e;
};
utils.extractDeeplinkPath = function(a) {
  if (!a) {
    return null;
  }
  -1 < a.indexOf("://") && (a = a.split("://")[1]);
  return a.substring(a.indexOf("/") + 1);
};
utils.extractMobileDeeplinkPath = function(a) {
  if (!a) {
    return null;
  }
  -1 < a.indexOf("://") ? a = a.split("://")[1] : "/" === a.charAt(0) && (a = a.slice(1));
  return a;
};
utils.getOpenGraphContent = function(a, b) {
  a = String(a);
  b = b || null;
  (a = document.querySelector('meta[property="og:' + a + '"]')) && a.content && (b = a.content);
  return b;
};
utils.prioritizeDeeplinkPaths = function(a, b) {
  if (!b || "object" !== typeof b || 0 === Object.keys(b || {}).length) {
    return a;
  }
  b.hostedIOS ? a.$ios_deeplink_path = b.hostedIOS : b.applinksIOS ? a.$ios_deeplink_path = b.applinksIOS : b.twitterIOS && (a.$ios_deeplink_path = b.twitterIOS);
  b.hostedAndroid ? a.$android_deeplink_path = b.hostedAndroid : b.applinksAndroid ? a.$android_deeplink_path = b.applinksAndroid : b.twitterAndroid && (a.$android_deeplink_path = b.twitterAndroid);
  a.hasOwnProperty("$ios_deeplink_path") && a.hasOwnProperty("$android_deeplink_path") && a.$ios_deeplink_path === a.$android_deeplink_path && (a.$deeplink_path = a.$ios_deeplink_path);
  return a;
};
utils.processHostedDeepLinkData = function(a) {
  var b = {};
  if (!a || 0 === a.length) {
    return b;
  }
  for (var c = {hostedIOS:null, hostedAndroid:null, applinksIOS:null, applinksAndroid:null, twitterIOS:null, twitterAndroid:null}, d = 0; d < a.length; d++) {
    if ((a[d].getAttribute("name") || a[d].getAttribute("property")) && a[d].getAttribute("content")) {
      var e = a[d].getAttribute("name"), f = a[d].getAttribute("property");
      e = e || f;
      f = e.split(":");
      3 === f.length && "branch" === f[0] && "deeplink" === f[1] && ("$ios_deeplink_path" === f[2] ? c.hostedIOS = utils.extractMobileDeeplinkPath(a[d].getAttribute("content")) : "$android_deeplink_path" === f[2] ? c.hostedAndroid = utils.extractMobileDeeplinkPath(a[d].getAttribute("content")) : b[f[2]] = a[d].getAttribute("content"));
      "al:ios:url" === e && (c.applinksIOS = utils.extractMobileDeeplinkPath(a[d].getAttribute("content")));
      "twitter:app:url:iphone" === e && (c.twitterIOS = utils.extractMobileDeeplinkPath(a[d].getAttribute("content")));
      "al:android:url" === e && (c.applinksAndroid = utils.extractMobileDeeplinkPath(a[d].getAttribute("content")));
      "twitter:app:url:googleplay" === e && (c.twitterAndroid = utils.extractMobileDeeplinkPath(a[d].getAttribute("content")));
    }
  }
  return utils.prioritizeDeeplinkPaths(b, c);
};
utils.getHostedDeepLinkData = function() {
  var a = document.getElementsByTagName("meta");
  return utils.processHostedDeepLinkData(a);
};
utils.getBrowserLanguageCode = function() {
  try {
    if (navigator.languages && 0 < navigator.languages.length) {
      var a = navigator.languages[0];
    } else {
      navigator.language && (a = navigator.language);
    }
    a = a.substring(0, 2).toUpperCase();
  } catch (b) {
    a = null;
  }
  return a;
};
utils.calculateDiffBetweenArrays = function(a, b) {
  var c = [];
  b.forEach(function(d) {
    -1 === a.indexOf(d) && c.push(d);
  });
  return c;
};
var validCommerceEvents = ["purchase"], commerceEventMessages = {missingPurchaseEvent:"event name is either missing, of the wrong type or not valid. Please specify 'purchase' as the event name.", missingCommerceData:"commerce_data is either missing, of the wrong type or empty. Please ensure that commerce_data is constructed correctly.", invalidKeysForRoot:"Please remove the following keys from the root of commerce_data: ", invalidKeysForProducts:"Please remove the following keys from commerce_data.products: ", 
invalidProductListType:"commerce_data.products must be an array of objects", invalidProductType:"Each product in the products list must be an object"}, validateCommerceDataKeys = function(a) {
  var b = "sku name price quantity brand category variant".split(" "), c = utils.calculateDiffBetweenArrays("common type transaction_id currency revenue revenue_in_usd exchange_rate shipping tax coupon affiliation persona products".split(" "), Object.keys(a));
  if (c.length) {
    return commerceEventMessages.invalidKeysForRoot + c.join(", ");
  }
  var d = [], e;
  if (a.hasOwnProperty("products")) {
    if (!Array.isArray(a.products)) {
      return commerceEventMessages.invalidProductListType;
    }
    a.products.forEach(function(f) {
      "object" !== typeof f && (e = commerceEventMessages.invalidProductType);
      d = d.concat(utils.calculateDiffBetweenArrays(b, Object.keys(f)));
    });
    if (e) {
      return e;
    }
    if (d.length) {
      return commerceEventMessages.invalidKeysForProducts + d.join(", ");
    }
  }
  return null;
};
utils.validateCommerceEventParams = function(a, b) {
  return a && "string" === typeof a && -1 !== validCommerceEvents.indexOf(a.toLowerCase()) ? b && "object" === typeof b && 0 !== Object.keys(b || {}).length ? (a = validateCommerceDataKeys(b)) ? a : null : commerceEventMessages.missingCommerceData : commerceEventMessages.missingPurchaseEvent;
};
utils.cleanBannerText = function(a) {
  return "string" !== typeof a ? null : a.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
utils.getTitle = function() {
  var a = document.getElementsByTagName("title");
  return 0 < a.length ? a[0].innerText : null;
};
utils.getDescription = function() {
  var a = document.querySelector('meta[name="description"]');
  return a && a.content ? a.content : null;
};
utils.getCanonicalURL = function() {
  var a = document.querySelector('link[rel="canonical"]');
  return a && a.href ? a.href : null;
};
utils.addPropertyIfNotNull = function(a, b, c) {
  if (null !== c && void 0 !== c) {
    if ("object" === typeof c && 0 === Object.keys(c || {}).length) {
      return a;
    }
    a[b] = c;
  }
  return a;
};
utils.openGraphDataAsObject = function() {
  var a = {};
  a = utils.addPropertyIfNotNull(a, "$og_title", utils.getOpenGraphContent("title"));
  a = utils.addPropertyIfNotNull(a, "$og_description", utils.getOpenGraphContent("description"));
  a = utils.addPropertyIfNotNull(a, "$og_image_url", utils.getOpenGraphContent("image"));
  a = utils.addPropertyIfNotNull(a, "$og_video", utils.getOpenGraphContent("video"));
  return (a = utils.addPropertyIfNotNull(a, "$og_type", utils.getOpenGraphContent("type"))) && 0 < Object.keys(a).length ? a : null;
};
utils.getAdditionalMetadata = function() {
  var a = {};
  a = utils.addPropertyIfNotNull(a, "og_data", utils.openGraphDataAsObject());
  a = utils.addPropertyIfNotNull(a, "hosted_deeplink_data", utils.getHostedDeepLinkData());
  a = utils.addPropertyIfNotNull(a, "title", utils.getTitle());
  a = utils.addPropertyIfNotNull(a, "description", utils.getDescription());
  return (a = utils.addPropertyIfNotNull(a, "canonical_url", utils.getCanonicalURL())) && 0 < Object.keys(a).length ? a : {};
};
utils.removePropertiesFromObject = function(a, b) {
  if (a && "object" === typeof a && !Array.isArray(a) && 0 < Object.keys(a).length && b && Array.isArray(b) && 0 < b.length) {
    for (var c in a) {
      a.hasOwnProperty(c) && -1 < b.indexOf(c) && delete a[c];
    }
  }
};
var BRANCH_STANDARD_EVENTS = "ADD_TO_CART ADD_TO_WISHLIST VIEW_CART INITIATE_PURCHASE ADD_PAYMENT_INFO PURCHASE SPEND_CREDITS SEARCH VIEW_ITEM VIEW_ITEMS RATE SHARE COMPLETE_REGISTRATION COMPLETE_TUTORIAL ACHIEVE_LEVEL UNLOCK_ACHIEVEMENT LOGIN SUBSCRIBE START_TRIAL INVITE RESERVE VIEW_AD CLICK_AD INITIATE_STREAM COMPLETE_STREAM".split(" "), BRANCH_STANDARD_EVENT_DATA = "transaction_id revenue currency shipping tax coupon affiliation search_query description".split(" ");
utils.isStandardEvent = function(a) {
  return a && -1 < BRANCH_STANDARD_EVENTS.indexOf(a);
};
utils.separateEventAndCustomData = function(a) {
  if (!a || 0 === Object.keys(a).length) {
    return null;
  }
  for (var b = utils.calculateDiffBetweenArrays(BRANCH_STANDARD_EVENT_DATA, Object.keys(a)), c = {}, d = 0; d < b.length; d++) {
    var e = b[d];
    c[e] = a[e];
    delete a[e];
  }
  return {custom_data:utils.convertObjectValuesToString(c), event_data:a};
};
utils.validateParameterType = function(a, b) {
  return !b || null === a && "object" === b ? !1 : "array" === b ? Array.isArray(a) : typeof a === b && !Array.isArray(a);
};
utils.getScreenHeight = function() {
  return screen.height || 0;
};
utils.getScreenWidth = function() {
  return screen.width || 0;
};
utils.getUserData = function(a) {
  var b = {};
  b = utils.addPropertyIfNotNull(b, "http_origin", document.URL);
  b = utils.addPropertyIfNotNull(b, "user_agent", navigator.userAgent);
  b = utils.addPropertyIfNotNull(b, "language", utils.getBrowserLanguageCode());
  b = utils.addPropertyIfNotNull(b, "screen_width", utils.getScreenWidth());
  b = utils.addPropertyIfNotNull(b, "screen_height", utils.getScreenHeight());
  b = utils.addPropertyIfNotNull(b, "http_referrer", document.referrer);
  b = utils.addPropertyIfNotNull(b, "browser_fingerprint_id", a.browser_fingerprint_id);
  b = utils.addPropertyIfNotNull(b, "developer_identity", a.identity);
  b = utils.addPropertyIfNotNull(b, "identity", a.identity);
  b = utils.addPropertyIfNotNull(b, "sdk", "web");
  b = utils.addPropertyIfNotNull(b, "sdk_version", config.version);
  b = utils.addPropertyIfNotNullorEmpty(b, "model", utils.userAgentData ? utils.userAgentData.model : "");
  return b = utils.addPropertyIfNotNullorEmpty(b, "os_version", utils.userAgentData ? utils.userAgentData.platformVersion : "");
};
utils.isIframe = function() {
  return window.self !== window.top;
};
utils.isSameOriginFrame = function() {
  var a = "true";
  try {
    window.top.location.search && (a = "true");
  } catch (b) {
    return !1;
  }
  return "true" === a;
};
utils.isIframeAndFromSameOrigin = function() {
  return utils.isIframe() && utils.isSameOriginFrame();
};
utils.getInitialReferrer = function(a) {
  return a ? a : utils.isIframe() ? utils.isSameOriginFrame() ? window.top.document.referrer : "" : document.referrer;
};
utils.getCurrentUrl = function() {
  return utils.isIframeAndFromSameOrigin() ? window.top.location.href : window.location.href;
};
utils.convertValueToString = function(a) {
  return utils.validateParameterType(a, "object") || utils.validateParameterType(a, "array") ? safejson.stringify(a) : null === a ? "null" : a.toString();
};
utils.convertObjectValuesToString = function(a) {
  if (!utils.validateParameterType(a, "object") || 0 === Object.keys(a).length) {
    return {};
  }
  for (var b in a) {
    a.hasOwnProperty(b) && (a[b] = utils.convertValueToString(a[b]));
  }
  return a;
};
utils.mergeHostedDeeplinkData = function(a, b) {
  a = a ? utils.merge({}, a) : {};
  return b && 0 < Object.keys(b).length ? 0 < Object.keys(a).length ? utils.merge(a, b) : utils.merge({}, b) : a;
};
utils.addNonceAttribute = function(a) {
  "" !== utils.nonce && a.setAttribute("nonce", utils.nonce);
};
utils.getBooleanOrNull = function(a) {
  return void 0 === a ? null : a;
};
utils.delay = function(a, b) {
  isNaN(b) || 0 >= b ? a() : setTimeout(a, b);
};
utils.getClientHints = function() {
  navigator.userAgentData ? navigator.userAgentData.getHighEntropyValues(["model", "platformVersion"]).then(function(a) {
    utils.userAgentData = {model:a.model, platformVersion:utils.removeTrailingDotZeros(a.platformVersion)};
  }) : utils.userAgentData = null;
};
utils.addPropertyIfNotNullorEmpty = function(a, b, c) {
  "string" === typeof c && c && (a[b] = c);
  return a;
};
utils.removeTrailingDotZeros = function(a) {
  if (a) {
    var b = /^([1-9]\d*)\.(0\d*)(\.[0]\d*){1,}$/;
    if (-1 !== a.indexOf(".")) {
      var c = a.substring(0, a.indexOf("."));
      a = a.replace(b, c);
    }
  }
  return a;
};
// Input 5
var resources = {}, validationTypes = {OBJECT:0, STRING:1, NUMBER:2, ARRAY:3, BOOLEAN:4}, _validator;
function validator(a, b) {
  return function(c, d, e) {
    if (utils.userPreferences.trackingDisabled) {
      return !1;
    }
    if ("number" === typeof e || e) {
      if (b === validationTypes.OBJECT) {
        if ("object" !== typeof e) {
          return utils.message(utils.messages.invalidType, [c, d, "an object"]);
        }
      } else if (b === validationTypes.ARRAY) {
        if (!(e instanceof Array)) {
          return utils.message(utils.messages.invalidType, [c, d, "an array"]);
        }
      } else if (b === validationTypes.NUMBER) {
        if ("number" !== typeof e) {
          return utils.message(utils.messages.invalidType, [c, d, "a number"]);
        }
      } else if (b === validationTypes.BOOLEAN) {
        if ("boolean" !== typeof e) {
          return utils.message(utils.messages.invalidType, [c, d, "a boolean"]);
        }
      } else {
        if ("string" !== typeof e) {
          return utils.message(utils.messages.invalidType, [c, d, "a string"]);
        }
        if (b !== validationTypes.STRING && !b.test(e)) {
          return utils.message(utils.messages.invalidType, [c, d, "in the proper format"]);
        }
      }
    } else {
      if (a) {
        return utils.message(utils.messages.missingParam, [c, d]);
      }
    }
    return !1;
  };
}
function defaults(a) {
  var b = {browser_fingerprint_id:validator(!0, validationTypes.STRING), identity_id:validator(!0, validationTypes.STRING), sdk:validator(!0, validationTypes.STRING), session_id:validator(!0, validationTypes.STRING)};
  return utils.merge(a, b);
}
resources.open = {destination:config.api_endpoint, endpoint:"/v1/open", method:utils.httpMethod.POST, params:{browser_fingerprint_id:validator(!1, validationTypes.STRING), alternative_browser_fingerprint_id:validator(!1, validationTypes.STRING), identity_id:validator(!1, validationTypes.STRING), link_identifier:validator(!1, validationTypes.STRING), sdk:validator(!1, validationTypes.STRING), options:validator(!1, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), tracking_disabled:validator(!1, 
validationTypes.BOOLEAN), current_url:validator(!1, validationTypes.STRING), screen_height:validator(!1, validationTypes.NUMBER), screen_width:validator(!1, validationTypes.NUMBER), model:validator(!1, validationTypes.STRING), os_version:validator(!1, validationTypes.STRING)}};
resources._r = {destination:config.app_service_endpoint, endpoint:"/_r", method:utils.httpMethod.GET, jsonp:!0, params:{sdk:validator(!0, validationTypes.STRING), _t:validator(!1, validationTypes.STRING), branch_key:validator(!0, validationTypes.STRING)}};
resources.linkClick = {destination:"", endpoint:"", method:utils.httpMethod.GET, queryPart:{link_url:validator(!0, validationTypes.STRING)}, params:{click:validator(!0, validationTypes.STRING)}};
resources.logout = {destination:config.api_endpoint, endpoint:"/v1/logout", method:utils.httpMethod.POST, params:defaults({session_id:validator(!0, validationTypes.STRING)})};
resources.profile = {destination:config.api_endpoint, endpoint:"/v1/profile", method:utils.httpMethod.POST, params:defaults({identity_id:validator(!0, validationTypes.STRING), identity:validator(!0, validationTypes.STRING)})};
resources.link = {destination:config.api_endpoint, endpoint:"/v1/url", method:utils.httpMethod.POST, ref:"obj", params:defaults({alias:validator(!1, validationTypes.STRING), campaign:validator(!1, validationTypes.STRING), channel:validator(!1, validationTypes.STRING), data:validator(!1, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), identity_id:validator(!0, validationTypes.STRING), stage:validator(!1, validationTypes.STRING), tags:validator(!1, validationTypes.ARRAY), type:validator(!1, 
validationTypes.NUMBER), source:validator(!1, validationTypes.STRING), instrumentation:validator(!1, validationTypes.STRING)})};
resources.qrCode = {destination:config.api_endpoint, endpoint:"/v1/qr-code", method:utils.httpMethod.POST, ref:"obj", params:defaults({alias:validator(!1, validationTypes.STRING), campaign:validator(!1, validationTypes.STRING), channel:validator(!1, validationTypes.STRING), data:validator(!1, validationTypes.STRING), qr_code_settings:validator(!1, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), identity_id:validator(!0, validationTypes.STRING), stage:validator(!1, validationTypes.STRING), 
tags:validator(!1, validationTypes.ARRAY), type:validator(!1, validationTypes.NUMBER), source:validator(!1, validationTypes.STRING)})};
resources.deepview = {destination:config.api_endpoint, endpoint:"/v1/deepview", jsonp:!0, method:utils.httpMethod.POST, params:defaults({campaign:validator(!1, validationTypes.STRING), _t:validator(!1, validationTypes.STRING), channel:validator(!1, validationTypes.STRING), data:validator(!0, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), link_click_id:validator(!1, validationTypes.STRING), open_app:validator(!1, validationTypes.BOOLEAN), append_deeplink_path:validator(!1, 
validationTypes.BOOLEAN), stage:validator(!1, validationTypes.STRING), tags:validator(!1, validationTypes.ARRAY), deepview_type:validator(!0, validationTypes.STRING), source:validator(!0, validationTypes.STRING)})};
resources.hasApp = {destination:config.api_endpoint, endpoint:"/v1/has-app", method:utils.httpMethod.GET, params:{browser_fingerprint_id:validator(!0, validationTypes.STRING), instrumentation:validator(!1, validationTypes.STRING)}};
resources.event = {destination:config.api_endpoint, endpoint:"/v1/event", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!0, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), tracking_disabled:validator(!1, validationTypes.BOOLEAN)})};
resources.commerceEvent = {destination:config.api_endpoint, endpoint:"/v1/event", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!1, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), commerce_data:validator(!0, validationTypes.OBJECT)})};
resources.logStandardEvent = {destination:config.api_endpoint, endpoint:"/v2/event/standard", method:utils.httpMethod.POST, params:{name:validator(!0, validationTypes.STRING), user_data:validator(!0, validationTypes.STRING), custom_data:validator(!1, validationTypes.STRING), event_data:validator(!1, validationTypes.STRING), content_items:validator(!1, validationTypes.STRING), customer_event_alias:validator(!1, validationTypes.STRING)}};
resources.logCustomEvent = {destination:config.api_endpoint, endpoint:"/v2/event/custom", method:utils.httpMethod.POST, params:{name:validator(!0, validationTypes.STRING), user_data:validator(!0, validationTypes.STRING), custom_data:validator(!1, validationTypes.STRING), event_data:validator(!1, validationTypes.STRING), content_items:validator(!1, validationTypes.STRING), customer_event_alias:validator(!1, validationTypes.STRING)}};
resources.pageview = {destination:config.api_endpoint, endpoint:"/v1/pageview", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!1, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), tracking_disabled:validator(!1, validationTypes.BOOLEAN), branch_view_id:validator(!1, validationTypes.STRING), no_journeys:validator(!1, validationTypes.BOOLEAN), user_language:validator(!1, validationTypes.STRING), open_app:validator(!1, 
validationTypes.BOOLEAN), has_app_websdk:validator(!1, validationTypes.BOOLEAN), source:validator(!1, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), is_iframe:validator(!1, validationTypes.BOOLEAN), data:validator(!1, validationTypes.OBJECT), callback_string:validator(!1, validationTypes.STRING), journey_displayed:validator(!1, validationTypes.BOOLEAN), audience_rule_id:validator(!1, validationTypes.STRING), journey_dismissals:validator(!1, validationTypes.OBJECT), identity_id:validator(!1, 
validationTypes.STRING), identity:validator(!0, validationTypes.STRING)})};
resources.dismiss = {destination:config.api_endpoint, endpoint:"/v1/dismiss", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!1, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), tracking_disabled:validator(!1, validationTypes.BOOLEAN), branch_view_id:validator(!1, validationTypes.STRING), no_journeys:validator(!1, validationTypes.BOOLEAN), user_language:validator(!1, validationTypes.STRING), open_app:validator(!1, 
validationTypes.BOOLEAN), has_app_websdk:validator(!1, validationTypes.BOOLEAN), source:validator(!1, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), is_iframe:validator(!1, validationTypes.BOOLEAN), data:validator(!1, validationTypes.OBJECT), callback_string:validator(!1, validationTypes.STRING), journey_displayed:validator(!1, validationTypes.BOOLEAN), audience_rule_id:validator(!1, validationTypes.STRING), journey_dismissals:validator(!1, validationTypes.OBJECT), dismissal_source:validator(!1, 
validationTypes.STRING)})};
resources.crossPlatformIds = {destination:config.api_endpoint, endpoint:"/v1/cpid", method:utils.httpMethod.POST, params:{user_data:validator(!0, validationTypes.STRING)}};
resources.lastAttributedTouchData = {destination:config.api_endpoint, endpoint:"/v1/cpid/latd", method:utils.httpMethod.POST, params:{user_data:validator(!0, validationTypes.STRING)}};
// Input 6
var COOKIE_MS = 31536E6, BRANCH_KEY_PREFIX = "BRANCH_WEBSDK_KEY", storage, BranchStorage = function(a) {
  for (var b = 0; b < a.length; b++) {
    var c = this[a[b]];
    c = "function" === typeof c ? c() : c;
    if (c.isEnabled()) {
      return c._store = {}, c;
    }
  }
}, prefix = function(a) {
  return "branch_session" === a || "branch_session_first" === a ? a : BRANCH_KEY_PREFIX + a;
}, trimPrefix = function(a) {
  return a.replace(BRANCH_KEY_PREFIX, "");
}, retrieveValue = function(a) {
  return "true" === a ? !0 : "false" === a ? !1 : a;
}, hasBranchPrefix = function(a) {
  return 0 === a.indexOf(BRANCH_KEY_PREFIX);
}, isBranchCookie = function(a) {
  return "branch_session" === a || "branch_session_first" === a || hasBranchPrefix(a);
}, processCookie = function(a) {
  a = a.trim();
  var b = a.indexOf("=");
  return {name:a.substring(0, b), value:retrieveValue(a.substring(b + 1, a.length))};
}, webStorage = function(a) {
  try {
    var b = a && localStorage ? localStorage : sessionStorage;
  } catch (c) {
    return {isEnabled:function() {
      return !1;
    }};
  }
  return {getAll:function() {
    if ("undefined" === typeof b) {
      return null;
    }
    var c = null, d;
    for (d in b) {
      0 === d.indexOf(BRANCH_KEY_PREFIX) && (null === c && (c = {}), c[trimPrefix(d)] = retrieveValue(b.getItem(d)));
    }
    return utils.decodeBFPs(c);
  }, get:function(c, d) {
    return "browser_fingerprint_id" === c || "alternative_browser_fingerprint_id" === c ? d && localStorage ? utils.base64Decode(localStorage.getItem(prefix(c))) : utils.base64Decode(b.getItem(prefix(c))) : retrieveValue(d && localStorage ? localStorage.getItem(prefix(c)) : b.getItem(prefix(c)));
  }, set:function(c, d, e) {
    e && localStorage ? localStorage.setItem(prefix(c), d) : b.setItem(prefix(c), d);
  }, remove:function(c, d) {
    d && localStorage ? localStorage.removeItem(prefix(c)) : b.removeItem(prefix(c));
  }, clear:function() {
    Object.keys(b).forEach(function(c) {
      0 === c.indexOf(BRANCH_KEY_PREFIX) && b.removeItem(c);
    });
  }, isEnabled:function() {
    try {
      return b.setItem("test", ""), b.removeItem("test"), !0;
    } catch (c) {
      return !1;
    }
  }};
};
BranchStorage.prototype.local = function() {
  return webStorage(!0);
};
BranchStorage.prototype.session = function() {
  return webStorage(!1);
};
var cookies = function() {
  var a = function(b, c) {
    c && (b = prefix(b));
    document.cookie = b + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
  };
  return {getAll:function() {
    for (var b = {}, c = document.cookie.split(";"), d = 0; d < c.length; d++) {
      var e = processCookie(c[d]);
      e && e.hasOwnProperty("name") && e.hasOwnProperty("value") && isBranchCookie(e.name) && (b[trimPrefix(e.name)] = e.value);
    }
    return b;
  }, get:function(b) {
    b = prefix(b);
    for (var c = document.cookie.split(";"), d = 0; d < c.length; d++) {
      var e = processCookie(c[d]);
      if (e && e.hasOwnProperty("name") && e.hasOwnProperty("value") && e.name === b) {
        return e.value;
      }
    }
    return null;
  }, set:function(b, c) {
    b = prefix(b);
    document.cookie = b + "=" + c + "; path=/";
  }, remove:function(b) {
    a(b, !0);
  }, clear:function() {
    for (var b = document.cookie.split(";"), c = 0; c < b.length; c++) {
      var d = processCookie(b[c]);
      d && d.hasOwnProperty("name") && isBranchCookie(d.name) && a(d.name, !1);
    }
  }, isEnabled:function() {
    return navigator.cookieEnabled;
  }};
};
BranchStorage.prototype.cookie = function() {
  return cookies();
};
BranchStorage.prototype.pojo = {getAll:function() {
  return this._store;
}, get:function(a) {
  return this._store[a] || null;
}, set:function(a, b) {
  this._store[a] = b;
}, remove:function(a) {
  delete this._store[a];
}, clear:function() {
  this._store = {};
}, isEnabled:function() {
  return !0;
}};
// Input 7
var Server = function() {
};
Server.prototype._jsonp_callback_index = 0;
Server.prototype.serializeObject = function(a, b) {
  if ("undefined" === typeof a) {
    return "";
  }
  var c = [];
  if (a instanceof Array) {
    for (var d = 0; d < a.length; d++) {
      c.push(encodeURIComponent(b) + "=" + encodeURIComponent(a[d]));
    }
    return c.join("&");
  }
  for (d in a) {
    a.hasOwnProperty(d) && (a[d] instanceof Array || "object" === typeof a[d] ? c.push(this.serializeObject(a[d], b ? b + "." + d : d)) : c.push(encodeURIComponent(b ? b + "." + d : d) + "=" + encodeURIComponent(a[d])));
  }
  return c.join("&");
};
Server.prototype.getUrl = function(a, b) {
  var c, d, e = a.destination + a.endpoint, f = /^[0-9]{15,20}$/, g = /key_(live|test)_[A-Za-z0-9]{32}/, k = function(l, m) {
    "undefined" === typeof m && (m = {});
    if (l.branch_key && g.test(l.branch_key)) {
      return m.branch_key = l.branch_key, m;
    }
    if (l.app_id && f.test(l.app_id)) {
      return m.app_id = l.app_id, m;
    }
    if (l.instrumentation) {
      m.instrumentation = l.instrumentation;
    } else {
      throw Error(utils.message(utils.messages.missingParam, [a.endpoint, "branch_key or app_id"]));
    }
  };
  if ("/v1/has-app" === a.endpoint) {
    try {
      a.queryPart = k(b, a.queryPart);
    } catch (l) {
      return {error:l.message};
    }
  }
  if ("undefined" !== typeof a.queryPart) {
    for (c in a.queryPart) {
      if (a.queryPart.hasOwnProperty(c)) {
        if (d = "function" === typeof a.queryPart[c] ? a.queryPart[c](a.endpoint, c, b[c]) : d) {
          return {error:d};
        }
        e += "/" + b[c];
      }
    }
  }
  var h = {};
  if ("undefined" !== typeof a.params && "/v1/pageview" !== a.endpoint && "/v1/dismiss" !== a.endpoint) {
    for (c in a.params) {
      if (a.params.hasOwnProperty(c)) {
        if (d = a.params[c](a.endpoint, c, b[c])) {
          return {error:d};
        }
        d = b[c];
        "undefined" !== typeof d && "" !== d && null !== d && (h[c] = d);
      }
    }
  } else {
    "/v1/pageview" !== a.endpoint && "/v1/dismiss" !== a.endpoint || utils.merge(h, b);
  }
  if ("POST" === a.method) {
    try {
      b = k(b, h);
    } catch (l) {
      return {error:l.message};
    }
  }
  "/v1/event" === a.endpoint && (h.metadata = safejson.stringify(h.metadata || {}), h.hasOwnProperty("commerce_data") && (h.commerce_data = safejson.stringify(h.commerce_data || {})));
  ("/v1/pageview" === a.endpoint || "/v1/dismiss" === a.endpoint) && h.metadata && (h.metadata = safejson.stringify(h.metadata || {}));
  "/v1/open" === a.endpoint && (h.options = safejson.stringify(h.options || {}));
  return {data:this.serializeObject(h, ""), url:e.replace(/^\//, "")};
};
Server.prototype.createScript = function(a, b, c) {
  var d = document.createElement("script");
  d.type = "text/javascript";
  d.async = !0;
  d.src = a;
  utils.addNonceAttribute(d);
  a = document.getElementsByTagName("head");
  !a || 1 > a.length ? "function" === typeof b && b() : (a[0].appendChild(d), "function" === typeof b && utils.addEvent(d, "error", b), "function" === typeof c && utils.addEvent(d, "load", c));
};
Server.prototype.jsonpRequest = function(a, b, c, d) {
  var e = Date.now(), f = utils.currentRequestBrttTag;
  0 === this._jsonp_callback_index && utils.isSafari11OrGreater() && this._jsonp_callback_index++;
  var g = "branch_callback__" + this._jsonp_callback_index++, k = 0 <= a.indexOf("branch.io") ? "&data=" : "&post_data=";
  b = "POST" === c ? encodeURIComponent(utils.base64encode(goog.json.serialize(b))) : "";
  var h = window.setTimeout(function() {
    window[g] = function() {
    };
    utils.addPropertyIfNotNull(utils.instrumentation, f, utils.calculateBrtt(e));
    d(Error(utils.messages.timeout), null, 504);
  }, utils.timeout);
  window[g] = function(l) {
    window.clearTimeout(h);
    d(null, l);
  };
  this.createScript(a + (0 > a.indexOf("?") ? "?" : "") + (b ? k + b : "") + (0 <= a.indexOf("/c/") ? "&click=1" : "") + "&callback=" + g, function() {
    d(Error(utils.messages.blockedByClient), null);
  }, function() {
    utils.addPropertyIfNotNull(utils.instrumentation, f, utils.calculateBrtt(e));
    try {
      "function" === typeof this.remove ? this.remove() : this.parentNode.removeChild(this);
    } catch (l) {
    }
    delete window[g];
  });
};
Server.prototype.XHRRequest = function(a, b, c, d, e, f, g) {
  var k = Date.now(), h = utils.currentRequestBrttTag, l = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  g && (l.responseType = g);
  l.ontimeout = function() {
    utils.addPropertyIfNotNull(utils.instrumentation, h, utils.calculateBrtt(k));
    e(Error(utils.messages.timeout), null, 504);
  };
  l.onerror = function(m) {
    e(Error(m.error || "Error in API: " + l.status), null, l.status);
  };
  l.onreadystatechange = function() {
    if (4 === l.readyState) {
      if (utils.addPropertyIfNotNull(utils.instrumentation, h, utils.calculateBrtt(k)), 200 === l.status) {
        if ("arraybuffer" === l.responseType) {
          var m = l.response;
        } else if (f) {
          m = l.responseText;
        } else {
          try {
            m = safejson.parse(l.responseText);
          } catch (q) {
            m = {};
          }
        }
        e(null, m, l.status);
      } else if ("4" === l.status.toString().substring(0, 1) || "5" === l.status.toString().substring(0, 1)) {
        l.responseURL && l.responseURL.includes("v2/event") ? e(l.responseText, null, l.status) : e(Error("Error in API: " + l.status), null, l.status);
      }
    }
  };
  try {
    l.open(c, a, !0), l.timeout = utils.timeout, l.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), l.send(b);
  } catch (m) {
    d.set("use_jsonp", !0), this.jsonpRequest(a, b, c, e);
  }
};
Server.prototype.request = function(a, b, c, d) {
  var e = this;
  utils.currentRequestBrttTag = "/v1/pageview" === a.endpoint && b && b.journey_displayed ? a.endpoint + "-1-brtt" : a.endpoint + "-brtt";
  ("/v1/url" === a.endpoint || "/v1/has-app" === a.endpoint) && 1 < Object.keys(utils.instrumentation).length && (delete utils.instrumentation["-brtt"], b.instrumentation = safejson.stringify(utils.merge({}, utils.instrumentation)), utils.instrumentation = {});
  if (utils.userPreferences.trackingDisabled) {
    for (var f = ["browser_fingerprint_id", "alternative_browser_fingerprint_id", "identity_id", "session_id", "identity"], g = 0; g < f.length; g++) {
      b.hasOwnProperty(f[g]) && delete b[f[g]];
    }
  }
  f = this.getUrl(a, b);
  if (f.error) {
    return d(Error(safejson.stringify({message:f.error, endpoint:a.endpoint, data:b})));
  }
  var k = "";
  if ("GET" === a.method) {
    var h = f.url + "?" + f.data;
  } else {
    h = f.url, k = f.data;
  }
  var l = c.get("use_jsonp") || a.jsonp ? b : k;
  var m = utils.retries, q = function(p, t, u) {
    if ("function" === typeof e.onAPIResponse) {
      e.onAPIResponse(h, a.method, l, p, u, t);
    }
    p && 0 < m && "5" === (u || "").toString().substring(0, 1) ? (m--, window.setTimeout(function() {
      n();
    }, utils.retry_delay)) : d(p, t);
  };
  if (utils.userPreferences.trackingDisabled && utils.userPreferences.shouldBlockRequest(h, b)) {
    return utils.userPreferences.allowErrorsInCallback ? q(Error(utils.messages.trackingDisabled), null, 300) : q(null, {}, 200);
  }
  var r = !1;
  if ("/v1/qr-code" === a.endpoint) {
    r = !0;
    var w = "arraybuffer";
  }
  var n = function() {
    c.get("use_jsonp") || a.jsonp ? e.jsonpRequest(h, b, a.method, q) : e.XHRRequest(h, k, a.method, c, q, r, w);
  };
  n();
};
// Input 8
var banner_utils = {animationSpeed:250, animationDelay:20, bannerHeight:"76px", error_timeout:2000, removeElement:function(a) {
  a && a.parentNode.removeChild(a);
}, hasClass:function(a, b) {
  return !!a.className.match(new RegExp("(\\s|^)" + b + "(\\s|$)"));
}, addClass:function(a, b) {
  a && !banner_utils.hasClass(a, b) && (a.className += " " + b);
}, removeClass:function(a, b) {
  a && banner_utils.hasClass(a, b) && (a.className = a.className.replace(new RegExp("(\\s|^)" + b + "(\\s|$)"), " "));
}, getDate:function(a) {
  var b = new Date();
  return b.setDate(b.getDate() + a);
}, getBodyStyle:function(a) {
  return document.body.currentStyle ? document.body.currentStyle[utils.snakeToCamel(a)] : window.getComputedStyle(document.body).getPropertyValue(a);
}, addCSSLengths:function(a, b) {
  var c = function(d) {
    if (!d) {
      return 0;
    }
    var e = d.replace(/[0-9,\.]/g, "");
    d = d.match(/\d+/g);
    var f = parseInt(0 < d.length ? d[0] : "0", 10), g = function() {
      return Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / 100;
    }, k = function() {
      return Math.max(document.documentElement.clientHeight, window.innerHeight || 0) / 100;
    };
    return parseInt({px:function(h) {
      return h;
    }, em:function(h) {
      return document.body.currentStyle ? h * c(document.body.currentStyle.fontSize) : h * parseFloat(window.getComputedStyle(document.body).fontSize);
    }, rem:function(h) {
      return document.documentElement.currentStyle ? h * c(document.documentElement.currentStyle.fontSize) : h * parseFloat(window.getComputedStyle(document.documentElement).fontSize);
    }, vw:function(h) {
      return h * g();
    }, vh:function(h) {
      return h * k();
    }, vmin:function(h) {
      return h * Math.min(k(), g());
    }, vmax:function(h) {
      return h * Math.max(k(), g());
    }, "%":function() {
      return document.body.clientWidth / 100 * f;
    }}[e](f), 10);
  };
  return (c(a) + c(b)).toString() + "px";
}, shouldAppend:function(a, b) {
  a = a.get("hideBanner", !0);
  if (b.respectDNT && navigator && Number(navigator.doNotTrack)) {
    return !1;
  }
  try {
    "string" === typeof a && (a = safejson.parse(a));
  } catch (d) {
    a = !1;
  }
  a = "number" === typeof a ? new Date() >= new Date(a) : !a;
  var c = b.forgetHide;
  "number" === typeof c && (c = !1);
  return !document.getElementById("branch-banner") && !document.getElementById("branch-banner-iframe") && (a || c) && (b.showAndroid && "android" === utils.mobileUserAgent() || b.showiPad && "ipad" === utils.mobileUserAgent() || b.showiOS && "ios" === utils.mobileUserAgent() || b.showBlackberry && "blackberry" === utils.mobileUserAgent() || b.showWindowsPhone && "windows_phone" === utils.mobileUserAgent() || b.showKindle && "kindle" === utils.mobileUserAgent());
}};
// Input 9
var banner_css = {banner:function(a) {
  return ".branch-banner-is-active { -webkit-transition: all " + 1.5 * banner_utils.animationSpeed / 1000 + "s ease; transition: all 0" + 1.5 * banner_utils.animationSpeed / 1000 + "s ease; }\n#branch-banner { width:100%; z-index: 99999; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all " + banner_utils.animationSpeed / 1000 + "s ease; transition: all 0" + banner_utils.animationSpeed / 
  1000 + "s ease; }\n#branch-banner .button{ border: 1px solid " + (a.buttonBorderColor || ("dark" === a.theme ? "transparent" : "#ccc")) + "; background: " + (a.buttonBackgroundColor || "#fff") + "; color: " + (a.buttonFontColor || "#000") + "; cursor: pointer; margin-top: 0px; font-size: 14px; display: inline-block; margin-left: 5px; font-weight: 400; text-decoration: none;  border-radius: 4px; padding: 6px 12px; transition: all .2s ease;}\n#branch-banner .button:hover {  border: 1px solid " + 
  (a.buttonBorderColorHover || ("dark" === a.theme ? "transparent" : "#BABABA")) + "; background: " + (a.buttonBackgroundColorHover || "#E0E0E0") + "; color: " + (a.buttonFontColorHover || "#000") + ";}\n#branch-banner .button:focus { outline: none; }\n#branch-banner * { margin-right: 4px; position: relative; line-height: 1.2em; }\n#branch-banner-close { font-weight: 400; cursor: pointer; float: left; z-index: 2;padding: 0 5px 0 5px; margin-right: 0; }\n#branch-banner .content { width:100%; overflow: hidden; height: " + 
  banner_utils.bannerHeight + "; background: rgba(255, 255, 255, 0.95); color: #333; " + ("top" === a.position ? "border-bottom" : "border-top") + ': 1px solid #ddd; }\n#branch-banner-close { color: #000; font-size: 24px; top: 14px; opacity: .5; transition: opacity .3s ease; }\n#branch-banner-close:hover { opacity: 1; }\n#branch-banner .title { font-size: 18px; font-weight:bold; color: #555; }\n#branch-banner .description { font-size: 12px; font-weight: normal; color: #777; max-height: 30px; overflow: hidden; }\n#branch-banner .icon { float: left; padding-bottom: 40px; margin-right: 10px; margin-left: 5px; }\n#branch-banner .icon img { width: 63px; height: 63px; margin-right: 0; }\n#branch-banner .reviews { font-size:13px; margin: 1px 0 3px 0; color: #777; }\n#branch-banner .reviews .star { display:inline-block; position: relative; margin-right:0; }\n#branch-banner .reviews .star span { display: inline-block; margin-right: 0; color: #555; position: absolute; top: 0; left: 0; }\n#branch-banner .reviews .review-count { font-size:10px; }\n#branch-banner .reviews .star .half { width: 50%; overflow: hidden; display: block; }\n#branch-banner .content .left { padding: 6px 5px 6px 5px; }\n#branch-banner .vertically-align-middle { top: 50%; transform: translateY(-50%); -webkit-transform: translateY(-50%); -ms-transform: translateY(-50%); }\n#branch-banner .details > * { display: block; }\n#branch-banner .content .left { height: 63px; }\n#branch-banner .content .right { float: right; height: 63px; margin-bottom: 50px; padding-top: 22px; z-index: 1; }\n#branch-banner .right > div { float: left; }\n#branch-banner-action { top: 17px; }\n#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }\n#branch-banner .theme-dark.content { background: rgba(51, 51, 51, 0.95); }\n#branch-banner .theme-dark #branch-banner-close{ color: #fff; text-shadow: 0 1px 1px rgba(0, 0, 0, .15); }\n#branch-banner .theme-dark .details { text-shadow: 0 1px 1px rgba(0, 0, 0, .15); }\n#branch-banner .theme-dark .title { color: #fff; }\n#branch-banner .theme-dark .description { color: #fff; }\n#branch-banner .theme-dark .reviews { color: #888; }\n#branch-banner .theme-dark .reviews .star span{ color: #fff; }\n#branch-banner .theme-dark .reviews .review-count{ color: #fff; }\n';
}, other:"#branch-banner { position: fixed; min-width: 600px; }\n#branch-banner input{ border: 1px solid #ccc;  font-weight: 400;  border-radius: 4px; height: 30px; padding: 5px 7px 4px; width: 145px; font-size: 14px;}\n#branch-banner input:focus { outline: none; }\n#branch-banner input.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }\n#branch-banner .branch-icon-wrapper { width:25px; height: 25px; vertical-align: middle; display: inline-block; margin-top: -18px; }\n@keyframes branch-spinner { 0% { transform: rotate(0deg); -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); } 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg); -ms-transform: rotate(360deg); } }\n@-webkit-keyframes branch-spinner { 0% { transform: rotate(0deg); -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); } 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg); -ms-transform: rotate(360deg); } }\n#branch-spinner { -webkit-animation: branch-spinner 1s ease-in-out infinite; animation: branch-spinner 1s ease-in-out infinite; transition: all 0.7s ease-in-out; border:2px solid #ddd; border-bottom-color:#428bca; width:80%; height:80%; border-radius:50%; -webkit-font-smoothing: antialiased !important; }\n#branch-banner .theme-dark input { border-color: transparent; }\n", 
mobile:"#branch-banner { position: absolute; }\n#branch-banner .content .left .details .title { font-size: 12px; }\n#branch-mobile-action { white-space: nowrap; }\n#branch-banner .content .left .details .description { font-size: 11px; font-weight: normal; }\n@media only screen and (min-device-width: 320px) and (max-device-width: 350px) { #branch-banner .content .right { max-width: 120px; } }\n@media only screen and (min-device-width: 351px) and (max-device-width: 400px) and (orientation: landscape) { #branch-banner .content .right { max-width: 150px; } }\n@media only screen and (min-device-width: 401px) and (max-device-width: 480px) and (orientation: landscape) { #branch-banner .content .right { max-width: 180px; } }\n", 
ios:"", android:"#branch-banner #branch-banner-close,#branch-banner .theme-dark #branch-banner-close { height:17px; width: 17px; text-align: center; font-size: 15px; top: 24px;  border-radius:14px; border:0; line-height:14px; color:#b1b1b3; background:#efefef; padding: 0; opacity: 1; }\n#branch-banner .button { top: 0; text-decoration:none; border-bottom: 3px solid #A4C639; padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; margin-top: 2px;  font-weight: bold; background-color: #A4C639; border-radius: 5px; }\n#branch-banner .button:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }\n", 
blackberry:"", windows_phone:"", kindle:""};
banner_css.iframe = "body { -webkit-transition: all " + 1.5 * banner_utils.animationSpeed / 1000 + "s ease; transition: all 0" + 1.5 * banner_utils.animationSpeed / 1000 + "s ease; }\n#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%; left: 0; right: 0; border: 0; height: " + banner_utils.bannerHeight + "; z-index: 99999; -webkit-transition: all " + banner_utils.animationSpeed / 1000 + "s ease; transition: all 0" + banner_utils.animationSpeed / 1000 + "s ease; }\n";
banner_css.inneriframe = "body { margin: 0; }\n";
banner_css.iframe_position = function(a, b) {
  return "#branch-banner-iframe { position: " + ("top" !== b || a ? "fixed" : "absolute") + "; }\n";
};
banner_css.css = function(a, b) {
  var c = banner_css.banner(a), d = utils.mobileUserAgent();
  "ios" !== d && "ipad" !== d || !a.showiOS ? "android" === d && a.showAndroid ? c += banner_css.mobile + banner_css.android : "blackberry" === d && a.showBlackberry ? c += banner_css.mobile + banner_css.blackberry : "windows_phone" === d && a.showWindowsPhone ? c += banner_css.mobile + banner_css.windows_phone : "kindle" === d && a.showKindle && (c += banner_css.mobile + banner_css.kindle) : c += banner_css.mobile + banner_css.ios;
  c += a.customCSS;
  a.iframe && (c += banner_css.inneriframe, d = document.createElement("style"), d.type = "text/css", d.id = "branch-iframe-css", utils.addNonceAttribute(d), d.innerHTML = banner_css.iframe + banner_css.iframe_position(a.mobileSticky, a.position), (document.head || document.getElementsByTagName("head")[0]).appendChild(d));
  d = document.createElement("style");
  d.type = "text/css";
  d.id = "branch-css";
  d.innerHTML = c;
  utils.addNonceAttribute(d);
  c = a.iframe ? b.contentWindow.document : document;
  (c = c.head || c.getElementsByTagName("head")[0]) && "function" === typeof c.appendChild && c.appendChild(d);
  "top" === a.position ? b.style.top = "-" + banner_utils.bannerHeight : "bottom" === a.position && (b.style.bottom = "-" + banner_utils.bannerHeight);
};
// Input 10
var session = {get:function(a, b) {
  try {
    var c = safejson.parse(a.get(b ? "branch_session_first" : "branch_session", b)) || null;
    return utils.decodeBFPs(c);
  } catch (d) {
    return null;
  }
}, set:function(a, b, c) {
  c && b.referring_link && utils.userPreferences.enableExtendedJourneysAssist && (b.referringLinkExpiry = (new Date()).getTime() + utils.extendedJourneysAssistExpiryTime);
  b = utils.encodeBFPs(b);
  a.set("branch_session", goog.json.serialize(b));
  c && a.set("branch_session_first", goog.json.serialize(b), !0);
}, update:function(a, b) {
  if (b) {
    var c = session.get(a) || {};
    b = goog.json.serialize(utils.encodeBFPs(utils.merge(c, b)));
    a.set("branch_session", b);
  }
}, patch:function(a, b, c, d) {
  var e = function(g, k) {
    return utils.encodeBFPs(utils.merge(safejson.parse(g), k, d));
  }, f = a.get("branch_session", !1) || {};
  a.set("branch_session", goog.json.serialize(e(f, b)));
  c && (c = a.get("branch_session_first", !0) || {}, a.set("branch_session_first", goog.json.serialize(e(c, b)), !0));
}};
// Input 11
var banner_html = {banner:function(a, b) {
  b = '<div class="content' + (a.theme ? " theme-" + a.theme : "") + '"><div class="right">' + b + '</div><div class="left">' + (a.disableHide ? "" : '<div id="branch-banner-close" class="branch-animation" aria-label="Close">&times;</div>') + '<div class="icon"><img src="' + a.icon + '" alt="Application icon"></div><div class="details vertically-align-middle"><div class="title">' + a.title + "</div>";
  if (a.rating || a.reviewCount) {
    if (a.rating) {
      var c = "";
      for (var d = 0; 5 > d; d++) {
        c += '<span class="star"><svg class="star" fill="#555555" height="12" viewBox="3 2 20 19" width="12"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/><path d="M0 0h24v24H0z" fill="none"/><foreignObject display="none"><span class="star">\u2606</span></foreignObject></svg>', a.rating > d && (c += d + 1 > a.rating && a.rating % 1 ? '<span class="half"><svg fill="#555555" height="12" viewBox="3 2 20 19" width="12"><defs><path d="M0 0h24v24H0V0z" id="a"/></defs><clipPath id="b"><use overflow="visible" xlink:href="#a"/></clipPath><path clip-path="url(#b)" d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg><foreignObject display="none"><span class="half">\u2605</span></foreignObject></span>' : 
        '<span class="full"><svg fill="#555555" height="12" viewBox="3 2 20 19" width="12"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/><path d="M0 0h24v24H0z" fill="none"/><foreignObject display="none"><span class="full">\u2605</span></foreignObject></svg> </span>'), c += "</span>";
      }
      c = '<span class="stars">' + c + "</span>";
    } else {
      c = "";
    }
    c = '<div class="reviews">' + c + (a.reviewCount ? '<span class="review-count">' + a.reviewCount + "</span>" : "") + "</div>";
  } else {
    c = "";
  }
  return b + c + '<div class="description">' + a.description + "</div></div></div></div>";
}, mobileAction:function(a, b) {
  return '<a id="branch-mobile-action" class="button" href="#" target="_parent">' + ((session.get(b) || {}).has_app ? a.openAppButtonText : a.downloadAppButtonText) + "</a>";
}, checkmark:function() {
  return window.ActiveXObject ? '<span class="checkmark">&#x2713;</span>' : '<svg version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 98.5 98.5" enable-background="new 0 0 98.5 98.5" xml:space="preserve"><path class="checkmark" fill="none" stroke-width="8" stroke-miterlimit="10" d="M81.7,17.8C73.5,9.3,62,4,49.2,4C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"/></svg>';
}, iframe:function(a, b, c) {
  var d = document.createElement("iframe");
  d.src = "about:blank";
  d.style.overflow = "hidden";
  d.scrolling = "no";
  d.id = "branch-banner-iframe";
  d.className = "branch-animation";
  utils.addNonceAttribute(d);
  d.onload = function() {
    var e = utils.mobileUserAgent();
    e = "ios" === e || "ipad" === e ? "branch-banner-ios" : "android" === e ? "branch-banner-android" : "branch-banner-other";
    var f = d.contentDocument || d.contentWindow.document;
    f.head = f.createElement("head");
    f.body = f.createElement("body");
    f.body.className = e;
    banner_html.div(a, b, f);
    c(d);
  };
  document.body.appendChild(d);
}, div:function(a, b, c) {
  c = c || document;
  var d = c.createElement("div");
  d.id = "branch-banner";
  d.className = "branch-animation";
  d.innerHTML = banner_html.banner(a, b);
  c.body.appendChild(d);
  return d;
}, markup:function(a, b, c) {
  b = '<div id="branch-banner-form-container">' + banner_html.mobileAction(a, b) + "</div>";
  a.iframe ? banner_html.iframe(a, b, c) : (a = banner_html.div(a, b, document), c(a));
}};
// Input 12
var banner = function(a, b, c, d) {
  if (!banner_utils.shouldAppend(d, b)) {
    return a._publishEvent("willNotShowBanner"), null;
  }
  a._publishEvent("willShowBanner");
  var e, f = document.body.style.marginTop, g = document.body.style.marginBottom, k = function(h, l) {
    "function" === typeof h && (l = h, h = {});
    h = h || {};
    "top" === b.position ? e.style.top = "-" + banner_utils.bannerHeight : "bottom" === b.position && (e.style.bottom = "-" + banner_utils.bannerHeight);
    "number" === typeof b.forgetHide ? d.set("hideBanner", banner_utils.getDate(b.forgetHide), !0) : d.set("hideBanner", !0, !0);
    h.immediate ? ("top" === b.position ? document.body.style.marginTop = f : "bottom" === b.position && (document.body.style.marginBottom = g), banner_utils.removeClass(document.body, "branch-banner-is-active"), banner_utils.removeElement(e), banner_utils.removeElement(document.getElementById("branch-css")), l()) : (setTimeout(function() {
      banner_utils.removeElement(e);
      banner_utils.removeElement(document.getElementById("branch-css"));
      l();
    }, banner_utils.animationSpeed + banner_utils.animationDelay), setTimeout(function() {
      "top" === b.position ? document.body.style.marginTop = f : "bottom" === b.position && (document.body.style.marginBottom = g);
      banner_utils.removeClass(document.body, "branch-banner-is-active");
    }, banner_utils.animationDelay));
  };
  banner_html.markup(b, d, function(h) {
    function l() {
      "top" === b.position ? e.style.top = "0" : "bottom" === b.position && (e.style.bottom = "0");
      a._publishEvent("didShowBanner");
    }
    e = h;
    banner_css.css(b, e);
    c.channel = c.channel || "app banner";
    h = b.iframe ? e.contentWindow.document : document;
    if (utils.mobileUserAgent()) {
      b.open_app = b.open_app;
      b.append_deeplink_path = b.append_deeplink_path;
      b.make_new_link = b.make_new_link;
      b.deepview_type = "banner";
      a.deepview(c, b);
      var m = h.getElementById("branch-mobile-action");
      m && (m.onclick = function(r) {
        r.preventDefault();
        a.deepviewCta();
      });
    }
    m = banner_utils.getBodyStyle("margin-top");
    var q = banner_utils.getBodyStyle("margin-bottom");
    banner_utils.addClass(document.body, "branch-banner-is-active");
    "top" === b.position ? document.body.style.marginTop = banner_utils.addCSSLengths(banner_utils.bannerHeight, m) : "bottom" === b.position && (document.body.style.marginBottom = banner_utils.addCSSLengths(banner_utils.bannerHeight, q));
    if (m = h.getElementById("branch-banner-close")) {
      m.onclick = function(r) {
        r.preventDefault();
        a._publishEvent("willCloseBanner");
        k({}, function() {
          a._publishEvent("didCloseBanner");
        });
      };
    }
    if (h = h.getElementById("branch-banner-modal-background")) {
      h.onclick = function(r) {
        r.preventDefault();
        a._publishEvent("willCloseBanner");
        k({}, function() {
          a._publishEvent("didCloseBanner");
        });
      };
    }
    b.immediate ? l() : setTimeout(l, banner_utils.animationDelay);
  });
  return k;
};
// Input 13
var task_queue = function() {
  var a = [], b = function() {
    if (a.length) {
      a[0](function() {
        a.shift();
        b();
      });
    }
  };
  return function(c) {
    a.push(c);
    1 === a.length && b();
  };
};
// Input 14
var journeys_utils = {_callback_index:1};
function setDefaultBannerProperties() {
  journeys_utils.position = "top";
  journeys_utils.sticky = "absolute";
  journeys_utils.bannerHeight = "76px";
  journeys_utils.isFullPage = !1;
  journeys_utils.isHalfPage = !1;
}
setDefaultBannerProperties();
journeys_utils.divToInjectParents = [];
journeys_utils.isSafeAreaEnabled = !1;
journeys_utils.windowHeight = window.innerHeight;
journeys_utils.windowWidth = window.innerWidth;
window.innerHeight < window.innerWidth && (journeys_utils.windowHeight = window.innerWidth, journeys_utils.windowWidth = window.innerHeight);
journeys_utils.bodyMarginTop = 0;
journeys_utils.bodyMarginBottom = 0;
journeys_utils.exitAnimationIsRunning = !1;
journeys_utils.jsonRe = /<script type="application\/json">((.|\s)*?)<\/script>/;
journeys_utils.jsRe = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
journeys_utils.cssRe = /<style type="text\/css" id="branch-css">((.|\s)*?)<\/style>/;
journeys_utils.iframeCssRe = /<style type="text\/css" id="branch-iframe-css">((.|\s)*?)<\/style>/;
journeys_utils.spacerRe = /#branch-banner-spacer {((.|\s)*?)}/;
journeys_utils.findMarginRe = /margin-bottom: (.*?);/;
journeys_utils.branch = null;
journeys_utils.banner = null;
journeys_utils.isJourneyDisplayed = !1;
journeys_utils.animationSpeed = 250;
journeys_utils.animationDelay = 20;
journeys_utils.exitAnimationDisabled = !1;
journeys_utils.entryAnimationDisabled = !1;
journeys_utils.journeyDismissed = !1;
journeys_utils.exitAnimationDisabledPreviously = !1;
journeys_utils.previousPosition = "";
journeys_utils.previousDivToInjectParents = [];
journeys_utils.journeyLinkData = null;
journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight = function(a) {
  var b = /vh|%/gi;
  return b.test(a) ? a.replace(b, "") : !1;
};
journeys_utils.setPositionAndHeight = function(a) {
  setDefaultBannerProperties();
  var b = journeys_utils.getMetadata(a) || {};
  if (b && b.bannerHeight && b.position && b.sticky) {
    journeys_utils.bannerHeight = b.bannerHeight, journeys_utils.position = b.position, journeys_utils.sticky = b.sticky;
  } else {
    if (a = a.match(journeys_utils.spacerRe)) {
      journeys_utils.position = "top";
      if (a = a[1].match(journeys_utils.findMarginRe)) {
        journeys_utils.bannerHeight = a[1];
      }
      journeys_utils.sticky = "absolute";
    } else {
      journeys_utils.position = "bottom", journeys_utils.sticky = "fixed";
    }
  }
  if (a = journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(journeys_utils.bannerHeight)) {
    journeys_utils.bannerHeight = a / 100 * journeys_utils.windowHeight + "px", 100 > a ? journeys_utils.isHalfPage = !0 : journeys_utils.isFullPage = !0;
  }
};
journeys_utils.getMetadata = function(a) {
  if (a = a.match(journeys_utils.jsonRe)) {
    return safejson.parse(a[1]);
  }
};
journeys_utils.getIframeCss = function(a) {
  if (a = a.match(journeys_utils.iframeCssRe)) {
    return a[1];
  }
};
journeys_utils.getCtaText = function(a, b) {
  var c;
  b && a && a.ctaText && a.ctaText.has_app ? c = a.ctaText.has_app : a && a.ctaText && a.ctaText.no_app && (c = a.ctaText.no_app);
  return c;
};
journeys_utils.findInsertionDiv = function(a, b) {
  journeys_utils.divToInjectParents = [];
  if (b && b.injectorSelector && (a = document.querySelectorAll(b.injectorSelector))) {
    for (b = 0; b < a.length; b++) {
      journeys_utils.divToInjectParents.push(a[b].parentElement);
    }
  }
};
journeys_utils.getCss = function(a) {
  if (a = a.match(journeys_utils.cssRe)) {
    return a[1];
  }
};
journeys_utils.getJsAndAddToParent = function(a) {
  if (a = a.match(journeys_utils.jsRe)) {
    a = a[1];
    var b = document.createElement("script");
    b.id = "branch-journey-cta";
    utils.addNonceAttribute(b);
    b.innerHTML = a;
    document.body.appendChild(b);
  }
};
journeys_utils.removeScriptAndCss = function(a) {
  var b = a.match(journeys_utils.jsonRe), c = a.match(journeys_utils.jsRe), d = a.match(journeys_utils.cssRe), e = a.match(journeys_utils.iframeCssRe);
  b && (a = a.replace(journeys_utils.jsonRe, ""));
  c && (a = a.replace(journeys_utils.jsRe, ""));
  d && (a = a.replace(journeys_utils.cssRe, ""));
  e && (a = a.replace(journeys_utils.iframeCssRe, ""));
  return a;
};
journeys_utils.createIframe = function() {
  var a = document.createElement("iframe");
  a.src = "about:blank";
  a.style.overflow = "hidden";
  a.scrolling = "no";
  a.id = "branch-banner-iframe";
  a.className = "branch-animation";
  a.setAttribute("tabindex", "-1");
  utils.addNonceAttribute(a);
  return a;
};
journeys_utils.addHtmlToIframe = function(a, b, c) {
  c = "ios" === c || "ipad" === c ? "branch-banner-ios" : "android" === c ? "branch-banner-android" : "branch-banner-other";
  a = a.contentDocument || a.contentWindow.document;
  a.head = a.createElement("head");
  a.body = a.createElement("body");
  a.body.innerHTML = b;
  a.body.className = c;
  (b = a.querySelector('meta[name="accessibility"]')) && "wcag" === b.content && (b = a.createElement("script"), b.type = "text/javascript", b.text = "\n\t\t\tvar  focusableElements =\n\t\t\t\t\t'button, [href], input, select, textarea, [role=\"button\"], h1, [role=\"text\"]';\n\t\t\tvar modal = document.getElementById('branch-banner');\n\t\t\tvar focusableContent = modal.querySelectorAll(focusableElements);\n\t\t\tvar firstFocusableElement = focusableContent[0];\n\t\t\tvar lastFocusableElement = focusableContent[focusableContent.length - 1];\n\n\t\t\tdocument.addEventListener('keydown', function(e) {\n\t\t\t\tvar isTabPressed = e.key === 'Tab' || e.keyCode === 9;\n\t\t\t\n\t\t\t\tif (!isTabPressed) {\n\t\t\t\t\treturn;\n\t\t\t\t}\n\n\t\t\t\tif (e.shiftKey) {\n\t\t\t\t\tif (document.activeElement === firstFocusableElement) {\n\t\t\t\t\t\tlastFocusableElement.focus();\n\t\t\t\t\t\te.preventDefault();\n\t\t\t\t\t}\n\t\t\t\t} else if (document.activeElement === lastFocusableElement) {\n\t\t\t\t\tfirstFocusableElement.focus();\n\t\t\t\t\te.preventDefault();\n\t\t\t\t}\n\t\t\t});\n\t\t\tsetTimeout(function() { firstFocusableElement.focus() }, 100);\n\t\t", 
  a.querySelector("body").append(b));
};
journeys_utils.addIframeOuterCSS = function(a, b) {
  var c = document.createElement("style");
  c.type = "text/css";
  c.id = "branch-iframe-css";
  journeys_utils.bodyMarginTop = banner_utils.getBodyStyle("margin-top");
  var d = +journeys_utils.bodyMarginTop.slice(0, -2);
  journeys_utils.bodyMarginBottom = banner_utils.getBodyStyle("margin-bottom");
  var e = +journeys_utils.bodyMarginBottom.slice(0, -2), f = +journeys_utils.bannerHeight.slice(0, -2);
  a || ("top" === journeys_utils.position ? document.body.style.marginTop = (+f + d).toString() + "px" : "bottom" === journeys_utils.position && (document.body.style.marginBottom = (+f + e).toString() + "px"));
  0 < journeys_utils.divToInjectParents.length && journeys_utils.divToInjectParents.forEach(function(g) {
    var k, h = window.getComputedStyle(g);
    h && (k = journeys_utils.isFullPage && "fixed" === h.getPropertyValue("position"));
    k || (g.style.marginTop = journeys_utils.bannerHeight);
  });
  "top" === journeys_utils.previousPosition && journeys_utils.previousPosition !== journeys_utils.position && journeys_utils.exitAnimationDisabledPreviously && journeys_utils.previousDivToInjectParents && 0 < journeys_utils.previousDivToInjectParents.length && journeys_utils.previousDivToInjectParents.forEach(function(g) {
    g.style.marginTop = 0;
  });
  journeys_utils.exitAnimationDisabledPreviously = !1;
  journeys_utils.previousPosition = "";
  journeys_utils.previousDivToInjectParents = [];
  journeys_utils.journeyDismissed = !1;
  c.innerHTML = a ? a : generateIframeOuterCSS(b);
  utils.addNonceAttribute(c);
  document.head.appendChild(c);
};
function generateIframeOuterCSS(a) {
  var b = a = "";
  document.body.style.transition = "";
  document.getElementById("branch-banner-iframe") && (document.getElementById("branch-banner-iframe").style.transition = "");
  journeys_utils.entryAnimationDisabled || (a = "body { -webkit-transition: all " + 1.5 * journeys_utils.animationSpeed / 1000 + "s ease; }\n", document.body.style.transition = "all 0" + 1.5 * journeys_utils.animationSpeed / 1000 + "s ease", b = "-webkit-transition: all " + journeys_utils.animationSpeed / 1000 + "s ease; transition: all 0" + journeys_utils.animationSpeed / 1000 + "s ease;");
  return (a ? a : "") + ("#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%; left: 0; right: 0; border: 0; height: " + journeys_utils.bannerHeight + "; z-index: 99999; " + b + " }\n#branch-banner-iframe { position: " + journeys_utils.sticky + "; }\n@media only screen and (orientation: landscape) { body { " + ("top" === journeys_utils.position ? "margin-top: " : "margin-bottom: ") + (journeys_utils.isFullPage ? journeys_utils.windowWidth + "px" : journeys_utils.bannerHeight) + 
  "; }\n#branch-banner-iframe { height: " + (journeys_utils.isFullPage ? journeys_utils.windowWidth + "px" : journeys_utils.bannerHeight) + "; }");
}
journeys_utils.addIframeInnerCSS = function(a, b) {
  var c = document.createElement("style");
  c.type = "text/css";
  c.id = "branch-css";
  c.innerHTML = b;
  utils.addNonceAttribute(c);
  b = a.contentWindow.document;
  b.head.appendChild(c);
  if (journeys_utils.isHalfPage || journeys_utils.isFullPage) {
    c = b.getElementsByClassName("branch-banner-dismiss-background")[0];
    var d = b.getElementsByClassName("branch-banner-content")[0];
    !c && d && (d.style.height = journeys_utils.bannerHeight);
  }
  "top" === journeys_utils.position ? a.style.top = "-" + journeys_utils.bannerHeight : "bottom" === journeys_utils.position && (a.style.bottom = "-" + journeys_utils.bannerHeight);
  try {
    d = b.getElementsByClassName("branch-banner-content")[0];
    var e = window.getComputedStyle(d).getPropertyValue("background-color").split(", ");
    e[3] && 0 === parseFloat(e[3]) && (a.style.boxShadow = "none");
  } catch (f) {
  }
};
journeys_utils.addDynamicCtaText = function(a, b) {
  (a = a.contentWindow.document) && a.getElementById("branch-mobile-action") && (a = a.getElementById("branch-mobile-action"), a.innerHTML = b, a.setAttribute("aria-label", b));
};
journeys_utils.centerOverlay = function(a) {
  a && a.style && (a.style.bottom = "140px", a.style.width = "94%", a.style.borderRadius = "20px", a.style.margin = "auto");
};
journeys_utils.animateBannerEntrance = function(a, b) {
  banner_utils.addClass(document.body, "branch-banner-is-active");
  if (journeys_utils.isFullPage && "fixed" === journeys_utils.sticky) {
    var c = document.createElement("style");
    c.type = "text/css";
    c.innerHTML = ".branch-banner-no-scroll {overflow: hidden;}";
    document.head.appendChild(c);
    banner_utils.addClass(document.body, "branch-banner-no-scroll");
  }
  setTimeout(function() {
    b ? (a.style.top = null, a.style.bottom = null) : "top" === journeys_utils.position ? a.style.top = "0" : "bottom" === journeys_utils.position && (journeys_utils.journeyLinkData && journeys_utils.journeyLinkData.journey_link_data && !journeys_utils.journeyLinkData.journey_link_data.safeAreaRequired ? a.style.bottom = "0" : journeys_utils._dynamicallyRepositionBanner());
    journeys_utils.branch._publishEvent("didShowJourney", journeys_utils.journeyLinkData);
    journeys_utils.isJourneyDisplayed = !0;
  }, journeys_utils.animationDelay);
};
journeys_utils._resizeListener = function() {
  journeys_utils.isSafeAreaEnabled && journeys_utils._resetJourneysBannerPosition(!1, !1);
};
journeys_utils._scrollListener = function() {
  journeys_utils.isSafeAreaEnabled && (window.pageYOffset > window.innerHeight ? journeys_utils._resetJourneysBannerPosition(!0, !1) : journeys_utils._resetJourneysBannerPosition(!1, !1));
};
journeys_utils._dynamicallyRepositionBanner = function() {
  journeys_utils.isSafeAreaEnabled = !0;
  document.getElementById("branch-banner-iframe").style.transition = "all 0s";
  journeys_utils._resetJourneysBannerPosition(!1, !0);
  window.addEventListener("resize", journeys_utils._resizeListener);
  window.addEventListener("scroll", journeys_utils._scrollListener);
};
journeys_utils._resetJourneysBannerPosition = function(a, b) {
  var c = document.getElementById("branch-banner-iframe"), d = c.offsetHeight, e = c.offsetTop, f = window.innerHeight;
  if (b && 0 !== window.pageYOffset) {
    return c.style.bottom = "0", !1;
  }
  a ? c.style.top = f - d + d / 2 + "px" : f - e != d && (c.style.top = "" + (f - d) + "px");
};
journeys_utils._addSecondsToDate = function(a) {
  var b = new Date();
  return b.setSeconds(b.getSeconds() + a);
};
journeys_utils._findGlobalDismissPeriod = function(a) {
  a = a.globalDismissPeriod;
  if ("number" === typeof a) {
    return -1 === a ? !0 : journeys_utils._addSecondsToDate(a);
  }
};
journeys_utils.finalHookups = function(a, b, c, d, e, f, g, k) {
  if (d && e) {
    var h = e.contentWindow.document.querySelectorAll("#branch-mobile-action");
    Array.prototype.forEach.call(h, function(l) {
      l.addEventListener("click", function(m) {
        journeys_utils.branch._publishEvent("didClickJourneyCTA", journeys_utils.journeyLinkData);
        journeys_utils.journeyDismissed = !0;
        d();
        journeys_utils.animateBannerExit(e);
      });
    });
    journeys_utils._setupDismissBehavior(".branch-banner-continue", "didClickJourneyContinue", c, e, a, b, f, g, k, "click");
    journeys_utils._setupDismissBehavior(".branch-banner-close", "didClickJourneyClose", c, e, a, b, f, g, k, "click");
    journeys_utils._setupDismissBehavior(".branch-banner-dismiss-background", "didClickJourneyBackgroundDismiss", c, e, a, b, f, g, k, "click");
    journeys_utils._setupDismissBehavior(".branch-banner-dismiss-background", "didScrollJourneyBackgroundDismiss", c, e, a, b, f, g, k, "touchmove");
  }
};
journeys_utils._setupDismissBehavior = function(a, b, c, d, e, f, g, k, h, l) {
  a = d.contentWindow.document.querySelectorAll(a);
  Array.prototype.forEach.call(a, function(m) {
    m.addEventListener(l, function(q) {
      journeys_utils._handleJourneyDismiss(b, c, d, e, f, g, k, h);
    });
  });
};
journeys_utils._setJourneyDismiss = function(a, b, c) {
  var d = a.get("journeyDismissals", !0);
  d = d ? safejson.parse(d) : {};
  d[c] = {view_id:b, dismiss_time:Date.now()};
  a.set("journeyDismissals", safejson.stringify(d), !0);
  return d;
};
journeys_utils.decodeSymbols = function(a) {
  return void 0 === a || null === a ? null : a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&brvbar;/g, "\u00a6").replace(/&laquo;/g, "\u00ab").replace(/&acute;/g, "\u00b4").replace(/&middot;/g, "\u00b7").replace(/&raquo;/g, "\u00bb").replace(/&amp;/g, "&").replace(/&iquest;/g, "\u00bf").replace(/&times;/g, "\u00d7").replace(/&divide;/g, "\u00f7").replace(/&Agrave;/g, "\u00c0").replace(/&Aacute;/g, "\u00c1").replace(/&Acirc;/g, 
  "\u00c2").replace(/&Atilde;/g, "\u00c3").replace(/&Auml;/g, "\u00c4").replace(/&Aring;/g, "\u00c5").replace(/&AElig;/g, "\u00c6").replace(/&Ccedil;/g, "\u00c7").replace(/&Egrave;/g, "\u00c8").replace(/&Eacute;/g, "\u00c9").replace(/&Ecirc;/g, "\u00ca").replace(/&Euml;/g, "\u00cb").replace(/&Igrave;/g, "\u00cc").replace(/&Iacute;/g, "\u00cd").replace(/&Icirc;/g, "\u00ce").replace(/&Iuml;/g, "\u00cf").replace(/&ETH;/g, "\u00d0").replace(/&Ntilde;/g, "\u00d1").replace(/&Ograve;/g, "\u00d2").replace(/&Oacute;/g, 
  "\u00d3").replace(/&Ocirc;/g, "\u00d4").replace(/&Otilde;/g, "\u00d5").replace(/&Ouml;/g, "\u00d6").replace(/&Oslash;/g, "\u00d8").replace(/&Ugrave;/g, "\u00d9").replace(/&Uacute;/g, "\u00da").replace(/&Ucirc;/g, "\u00db").replace(/&Uuml;/g, "\u00dc").replace(/&Yacute;/g, "\u00dd").replace(/&THORN;/g, "\u00de").replace(/&szlig;/g, "\u00df").replace(/&agrave;/g, "\u00e0").replace(/&aacute;/g, "\u00e1").replace(/&acirc;/g, "\u00e2").replace(/&atilde;/g, "\u00e3").replace(/&auml;/g, "\u00e4").replace(/&aring;/g, 
  "\u00e5").replace(/&aelig;/g, "\u00e6").replace(/&ccedil;/g, "\u00e7").replace(/&egrave;/g, "\u00e8").replace(/&eacute;/g, "\u00e9").replace(/&ecirc;/g, "\u00ea").replace(/&euml;/g, "\u00eb").replace(/&igrave;/g, "\u00ec").replace(/&iacute;/g, "\u00ed").replace(/&icirc;/g, "\u00ee").replace(/&iuml;/g, "\u00ef").replace(/&eth;/g, "\u00f0").replace(/&ntilde;/g, "\u00f1").replace(/&ograve;/g, "\u00f2").replace(/&oacute;/g, "\u00f3").replace(/&ocirc;/g, "\u00f4").replace(/&otilde;/g, "\u00f5").replace(/&ouml;/g, 
  "\u00f6").replace(/&oslash;/g, "\u00f8").replace(/&ugrave;/g, "\u00f9").replace(/&uacute;/g, "\u00fa").replace(/&ucirc;/g, "\u00fb").replace(/&uuml;/g, "\u00fc").replace(/&yacute;/g, "\u00fd").replace(/&thorn;/g, "\u00fe").replace(/&yuml;/g, "\u00ff");
};
journeys_utils._getDismissRequestData = function(a, b) {
  var c = {}, d = utils.getHostedDeepLinkData();
  d && 0 < Object.keys(d).length && (c.hosted_deeplink_data = d);
  a = a._getPageviewRequestData(journeys_utils._getPageviewMetadata(null, c), null, journeys_utils.branch, !0);
  if (journeys_utils.journeyLinkData && journeys_utils.journeyLinkData.journey_link_data) {
    utils.addPropertyIfNotNull(a, "journey_id", journeys_utils.journeyLinkData.journey_link_data.journey_id);
    utils.addPropertyIfNotNull(a, "journey_name", journeys_utils.decodeSymbols(journeys_utils.journeyLinkData.journey_link_data.journey_name));
    utils.addPropertyIfNotNull(a, "view_id", journeys_utils.journeyLinkData.journey_link_data.view_id);
    utils.addPropertyIfNotNull(a, "view_name", journeys_utils.decodeSymbols(journeys_utils.journeyLinkData.journey_link_data.view_name));
    utils.addPropertyIfNotNull(a, "channel", journeys_utils.decodeSymbols(journeys_utils.journeyLinkData.journey_link_data.channel));
    utils.addPropertyIfNotNull(a, "campaign", journeys_utils.decodeSymbols(journeys_utils.journeyLinkData.journey_link_data.campaign));
    try {
      utils.addPropertyIfNotNull(a, "tags", JSON.stringify(journeys_utils.journeyLinkData.journey_link_data.tags));
    } catch (e) {
      a.tags = JSON.stringify([]);
    }
  }
  utils.addPropertyIfNotNull(a, "dismissal_source", b);
  return a;
};
journeys_utils._handleJourneyDismiss = function(a, b, c, d, e, f, g, k) {
  var h = g ? 0 : journeys_utils._findGlobalDismissPeriod(f);
  journeys_utils.branch._publishEvent(a, journeys_utils.journeyLinkData);
  journeys_utils.journeyDismissed = !0;
  journeys_utils.animateBannerExit(c);
  if (!g) {
    void 0 !== h && b.set("globalJourneysDismiss", h, !0);
    journeys_utils._setJourneyDismiss(b, d, e);
    var l = function() {
      journeys_utils.branch.removeListener(l);
      var m = journeys_utils._getDismissRequestData(k, utils.dismissEventToSourceMapping[a]);
      journeys_utils.branch._api(resources.dismiss, m, function(q, r) {
        !q && f && f.dismissRedirect ? window.location = f.dismissRedirect : !q && "object" === typeof r && r.template && k.shouldDisplayJourney(r, null, !1) && k.displayJourney(r.template, m, m.branch_view_id || r.event_data.branch_view_data.id, r.event_data.branch_view_data, !1, r.journey_link_data);
      });
    };
    journeys_utils.branch.addListener("branch_internal_event_didCloseJourney", l);
  }
};
journeys_utils._getPageviewMetadata = function(a, b) {
  a = utils.merge({url:a && a.url || utils.getWindowLocation(), user_agent:navigator.userAgent, language:navigator.language, screen_width:screen.width || -1, screen_height:screen.height || -1, window_device_pixel_ratio:window.devicePixelRatio || 1,}, b || {});
  a = utils.addPropertyIfNotNullorEmpty(a, "model", utils.userAgentData ? utils.userAgentData.model : "");
  return a = utils.addPropertyIfNotNullorEmpty(a, "os_version", utils.userAgentData ? utils.userAgentData.platformVersion : "");
};
journeys_utils.animateBannerExit = function(a, b) {
  journeys_utils.exitAnimationDisabled || (journeys_utils.exitAnimationIsRunning = !0);
  if (journeys_utils.entryAnimationDisabled && !journeys_utils.exitAnimationDisabled) {
    document.body.style.transition = "all 0" + 1.5 * journeys_utils.animationSpeed / 1000 + "s ease";
    document.getElementById("branch-banner-iframe").style.transition = "all 0" + journeys_utils.animationSpeed / 1000 + "s ease";
    var c = document.getElementById("branch-iframe-css").innerHTML + "\n";
    c += "body { -webkit-transition: all " + 1.5 * journeys_utils.animationSpeed / 1000 + "s ease; }\n";
    c += "#branch-banner-iframe { -webkit-transition: all " + journeys_utils.animationSpeed / 1000 + "s ease; }\n";
    document.getElementById("branch-iframe-css").innerHTML = "";
    document.getElementById("branch-iframe-css").innerHTML = c;
  }
  "top" === journeys_utils.position ? a.style.top = "-" + journeys_utils.bannerHeight : "bottom" === journeys_utils.position && (a.style.bottom = "-" + journeys_utils.bannerHeight);
  journeys_utils.branch._publishEvent("willCloseJourney", journeys_utils.journeyLinkData);
  setTimeout(function() {
    banner_utils.removeElement(a);
    banner_utils.removeElement(document.getElementById("branch-css"));
    banner_utils.removeElement(document.getElementById("branch-iframe-css"));
    banner_utils.removeElement(document.getElementById("branch-journey-cta"));
    (!journeys_utils.exitAnimationDisabled || journeys_utils.journeyDismissed) && journeys_utils.divToInjectParents && 0 < journeys_utils.divToInjectParents.length ? journeys_utils.divToInjectParents.forEach(function(d) {
      d.style.marginTop = 0;
    }) : (journeys_utils.exitAnimationDisabledPreviously = journeys_utils.exitAnimationDisabled, journeys_utils.previousPosition = journeys_utils.position, journeys_utils.previousDivToInjectParents = journeys_utils.divToInjectParents);
    "top" === journeys_utils.position ? document.body.style.marginTop = journeys_utils.bodyMarginTop : "bottom" === journeys_utils.position && (document.body.style.marginBottom = journeys_utils.bodyMarginBottom);
    banner_utils.removeClass(document.body, "branch-banner-is-active");
    banner_utils.removeClass(document.body, "branch-banner-no-scroll");
    journeys_utils.isSafeAreaEnabled && (journeys_utils.isSafeAreaEnabled = !1, window.removeEventListener("resize", journeys_utils._resizeListener), window.removeEventListener("scroll", journeys_utils._scrollListener));
    journeys_utils.branch._publishEvent("didCloseJourney", journeys_utils.journeyLinkData);
    b || journeys_utils.branch._publishEvent("branch_internal_event_didCloseJourney", journeys_utils.journeyLinkData);
    journeys_utils.isJourneyDisplayed = !1;
    setTimeout(function() {
      journeys_utils.exitAnimationIsRunning = !1;
    }, journeys_utils.animationSpeed);
  }, journeys_utils.exitAnimationDisabled ? 0 : journeys_utils.animationSpeed + journeys_utils.animationDelay);
};
journeys_utils.setJourneyLinkData = function(a) {
  var b = {banner_id:journeys_utils.branchViewId};
  a && "object" === typeof a && 0 < Object.keys(a || {}).length && (utils.removePropertiesFromObject(a, ["browser_fingerprint_id", "app_id", "source", "open_app", "link_click_id"]), b.journey_link_data = {}, utils.merge(b.journey_link_data, a));
  journeys_utils.journeyLinkData = b;
};
journeys_utils.getValueForKeyInBranchViewData = function(a) {
  return journeys_utils && journeys_utils.branch && journeys_utils.branch._branchViewData && journeys_utils.branch._branchViewData.data ? journeys_utils.branch._branchViewData.data[a] : !1;
};
journeys_utils.hasJourneyCtaLink = function() {
  return journeys_utils.getValueForKeyInBranchViewData("$journeys_cta") ? 0 < journeys_utils.getBranchViewDataItemOrUndefined("$journeys_cta").length : !1;
};
journeys_utils.getBranchViewDataItemOrUndefined = function(a) {
  if (journeys_utils.getValueForKeyInBranchViewData(a)) {
    return journeys_utils.branch._branchViewData.data[a];
  }
};
journeys_utils.getJourneyCtaLink = function() {
  return journeys_utils.getBranchViewDataItemOrUndefined("$journeys_cta");
};
journeys_utils.tryReplaceJourneyCtaLink = function(a) {
  try {
    if (journeys_utils.hasJourneyCtaLink()) {
      var b = 'validate("' + journeys_utils.getJourneyCtaLink() + '")';
      return a.replace(/validate[(].+[)];/g, b).replace("window.top.location.replace(", "window.top.location = ");
    }
  } catch (c) {
  }
  return a;
};
journeys_utils.trySetJourneyUrls = function(a, b = ["$android_url", "$ios_url", "$fallback_url", "$desktop_url"]) {
  if (!a) {
    return a;
  }
  var c = function(e) {
    return b.reduce((f, g) => {
      if (f[g]) {
        return f;
      }
      var k = journeys_utils.getBranchViewDataItemOrUndefined(g);
      k && (f[g] = k);
      return f;
    }, e);
  };
  try {
    var d = safejson.parse(a.data);
    a.data = JSON.stringify(c(d));
    return a;
  } catch (e) {
    return a;
  }
};
// Input 15
var branch_view = {};
function checkPreviousBanner() {
  return document.getElementById("branch-banner") || document.getElementById("branch-banner-iframe") || document.getElementById("branch-banner-container") ? !0 : !1;
}
function renderHtmlBlob(a, b, c, d) {
  var e = c ? "OPEN" : "GET";
  journeys_utils.setPositionAndHeight(b);
  var f = journeys_utils.getMetadata(b);
  f && (e = journeys_utils.getCtaText(f, c), journeys_utils.findInsertionDiv(a, f));
  var g = journeys_utils.getCss(b);
  journeys_utils.getJsAndAddToParent(b);
  var k = journeys_utils.getIframeCss(b);
  b = journeys_utils.removeScriptAndCss(b);
  var h = journeys_utils.createIframe();
  h.onload = function() {
    journeys_utils.addHtmlToIframe(h, b, utils.mobileUserAgent());
    journeys_utils.addIframeOuterCSS(k, f);
    journeys_utils.addIframeInnerCSS(h, g);
    journeys_utils.addDynamicCtaText(h, e);
    journeys_utils.branch._publishEvent("willShowJourney", journeys_utils.journeyLinkData);
    journeys_utils.animateBannerEntrance(h, k);
    d(h);
  };
  document.body.appendChild(h);
  return h;
}
function _areJourneysDismissedGlobally(a) {
  var b = a._storage.get("globalJourneysDismiss", !0);
  if (!0 === b || b > Date.now()) {
    return !0;
  }
  a._storage.remove("globalJourneysDismiss", !0);
  return !1;
}
branch_view.shouldDisplayJourney = function(a, b, c) {
  return !checkPreviousBanner() && utils.mobileUserAgent() && a.event_data && a.template ? c ? !0 : !a.event_data.branch_view_data.id || b && b.no_journeys || _areJourneysDismissedGlobally(journeys_utils.branch) ? (branch_view.callback_index = 1, !1) : !0 : !1;
};
branch_view.incrementPageviewAnalytics = function(a) {
  a = {event:"pageview", journey_displayed:!0, audience_rule_id:a.audience_rule_id, branch_view_id:a.branch_view_id};
  var b = session.get(journeys_utils.branch._storage) || {};
  b = b.hasOwnProperty("identity") ? b.identity : null;
  a = utils.addPropertyIfNotNull(a, "identity", b);
  journeys_utils.branch._api(resources.pageview, a, function(c, d) {
  });
};
branch_view.displayJourney = function(a, b, c, d, e, f) {
  if (!journeys_utils.exitAnimationIsRunning) {
    journeys_utils.branchViewId = c;
    journeys_utils.setJourneyLinkData(f);
    var g = d.audience_rule_id;
    (f = document.getElementById("branch-iframe-css")) && f.parentElement.removeChild(f);
    var k = document.createElement("div");
    k.id = "branch-banner";
    document.body.insertBefore(k, null);
    banner_utils.addClass(k, "branch-banner-is-active");
    var h = !1, l = b.callback_string, m = null, q = journeys_utils.branch._storage;
    if (a) {
      var r = journeys_utils.getMetadata(a) || {};
      a = journeys_utils.tryReplaceJourneyCtaLink(a);
      var w = window.setTimeout(function() {
        window[l] = function() {
        };
      }, utils.timeout);
      window[l] = function(n) {
        window.clearTimeout(w);
        h || (m = n, journeys_utils.finalHookups(c, g, q, m, null, r, e, branch_view));
      };
      renderHtmlBlob(document.body, a, b.has_app_websdk, function(n) {
        journeys_utils.banner = n;
        null === n ? h = !0 : (journeys_utils.finalHookups(c, g, q, m, n, r, e, branch_view), utils.navigationTimingAPIEnabled && (utils.instrumentation["journey-load-time"] = utils.timeSinceNavigationStart()), document.body.removeChild(k), utils.userPreferences.trackingDisabled || e || branch_view.incrementPageviewAnalytics(d));
      });
    } else {
      document.body.removeChild(k), utils.userPreferences.trackingDisabled || e || branch_view.incrementPageviewAnalytics(d);
    }
  }
};
branch_view._getPageviewRequestData = function(a, b, c, d) {
  journeys_utils.branch = c;
  b || (b = {});
  a || (a = {});
  journeys_utils.entryAnimationDisabled = b.disable_entry_animation || !1;
  journeys_utils.exitAnimationDisabled = b.disable_exit_animation || !1;
  var e = utils.merge({}, c._branchViewData), f = session.get(c._storage) || {}, g = f.hasOwnProperty("has_app") ? f.has_app : !1, k = f.hasOwnProperty("identity") ? f.identity : null, h = c._storage.get("journeyDismissals", !0), l = (b.user_language || utils.getBrowserLanguageCode() || "en").toLowerCase() || null, m = utils.getInitialReferrer(c._referringLink()), q = b.branch_view_id || utils.getParameterByName("_branch_view_id") || null;
  c = b.make_new_link ? null : utils.getClickIdAndSearchStringFromLink(c._referringLink(!0));
  e.event = d ? "dismiss" : "pageview";
  e.metadata = a;
  e = utils.addPropertyIfNotNull(e, "initial_referrer", m);
  e = utils.addPropertyIfNotNull(e, "branch_view_id", q);
  e = utils.addPropertyIfNotNull(e, "no_journeys", b.no_journeys);
  e = utils.addPropertyIfNotNull(e, "is_iframe", utils.isIframe());
  e = utils.addPropertyIfNotNull(e, "journey_dismissals", h);
  e = utils.addPropertyIfNotNull(e, "identity", k);
  e.user_language = l;
  e.open_app = b.open_app || !1;
  e.has_app_websdk = g;
  e.feature = "journeys";
  e.callback_string = "branch_view_callback__" + journeys_utils._callback_index++;
  e.data || (e.data = {});
  e.data = utils.merge(utils.getHostedDeepLinkData(), e.data);
  e.data = utils.merge(utils.whiteListJourneysLanguageData(f || {}), e.data);
  c && (e.data.link_click_id = c);
  (a = f.data ? safejson.parse(f.data) : null) && a["+referrer"] && (e.data["+referrer"] = a["+referrer"]);
  return e = utils.cleanLinkData(e);
};
// Input 16
var default_branch, callback_params = {NO_CALLBACK:0, CALLBACK_ERR:1, CALLBACK_ERR_DATA:2}, init_states = {NO_INIT:0, INIT_PENDING:1, INIT_FAILED:2, INIT_SUCCEEDED:3}, init_state_fail_codes = {NO_FAILURE:0, UNKNOWN_CAUSE:1, OPEN_FAILED:2, BFP_NOT_FOUND:3, HAS_APP_FAILED:4}, wrap = function(a, b, c) {
  return function() {
    var d = this, e = arguments[arguments.length - 1];
    if (a === callback_params.NO_CALLBACK || "function" !== typeof e) {
      var f = function(k) {
      };
      var g = Array.prototype.slice.call(arguments);
    } else {
      g = Array.prototype.slice.call(arguments, 0, arguments.length - 1) || [], f = e;
    }
    d._queue(function(k) {
      var h = function(l, m) {
        try {
          if (l && a === callback_params.NO_CALLBACK) {
            throw l;
          }
          a === callback_params.CALLBACK_ERR ? f(l) : a === callback_params.CALLBACK_ERR_DATA && f(l, m);
        } finally {
          k();
        }
      };
      if (!c) {
        if (d.init_state === init_states.INIT_PENDING) {
          return h(Error(utils.message(utils.messages.initPending)), null);
        }
        if (d.init_state === init_states.INIT_FAILED) {
          return h(Error(utils.message(utils.messages.initFailed, d.init_state_fail_code, d.init_state_fail_details)), null);
        }
        if (d.init_state === init_states.NO_INIT || !d.init_state) {
          return h(Error(utils.message(utils.messages.nonInit)), null);
        }
      }
      g.unshift(h);
      b.apply(d, g);
    });
  };
}, Branch = function() {
  if (!(this instanceof Branch)) {
    return default_branch || (default_branch = new Branch()), default_branch;
  }
  this._queue = task_queue();
  this._storage = new BranchStorage(["session", "cookie", "pojo"]);
  this._server = new Server();
  this._listeners = [];
  this.sdk = "web" + config.version;
  this.init_state = init_states.NO_INIT;
  this.init_state_fail_code = init_state_fail_codes.NO_FAILURE;
  this.init_state_fail_details = null;
};
Branch.prototype._api = function(a, b, c) {
  this.app_id && (b.app_id = this.app_id);
  this.branch_key && (b.branch_key = this.branch_key);
  (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && this.session_id && (b.session_id = this.session_id);
  (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && this.identity_id && (b.identity_id = this.identity_id);
  0 > a.endpoint.indexOf("/v1/") ? (a.params && a.params.developer_identity || a.queryPart && a.queryPart.developer_identity) && this.identity && (b.developer_identity = this.identity) : (a.params && a.params.identity || a.queryPart && a.queryPart.identity) && this.identity && (b.identity = this.identity);
  (a.params && a.params.link_click_id || a.queryPart && a.queryPart.link_click_id) && this.link_click_id && (b.link_click_id = this.link_click_id);
  (a.params && a.params.sdk || a.queryPart && a.queryPart.sdk) && this.sdk && (b.sdk = this.sdk);
  (a.params && a.params.browser_fingerprint_id || a.queryPart && a.queryPart.browser_fingerprint_id) && this.browser_fingerprint_id && (b.browser_fingerprint_id = this.browser_fingerprint_id);
  utils.userPreferences.trackingDisabled && (b.tracking_disabled = utils.userPreferences.trackingDisabled);
  return this._server.request(a, b, this._storage, function(d, e) {
    c(d, e);
  });
};
Branch.prototype._referringLink = function(a) {
  var b = session.get(this._storage);
  if (b = b && b.referring_link) {
    return b;
  }
  if (utils.userPreferences.enableExtendedJourneysAssist && a && (a = (b = session.get(this._storage, !0)) && b.referring_link, b = b && b.referringLinkExpiry, a && b)) {
    if ((new Date()).getTime() > b) {
      session.patch(this._storage, {referringLinkExpiry:null}, !0, !0);
    } else {
      return a;
    }
  }
  return (a = this._storage.get("click_id")) ? config.link_service_endpoint + "/c/" + a : null;
};
Branch.prototype._publishEvent = function(a, b) {
  for (var c = 0; c < this._listeners.length; c++) {
    this._listeners[c].event && this._listeners[c].event !== a || this._listeners[c].listener(a, b);
  }
};
Branch.prototype.init = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b, c) {
  utils.navigationTimingAPIEnabled && (utils.instrumentation["init-began-at"] = utils.timeSinceNavigationStart());
  var d = this;
  d.init_state = init_states.INIT_PENDING;
  utils.isKey(b) ? d.branch_key = b : d.app_id = b;
  c = c && utils.validateParameterType(c, "object") ? c : {};
  d.init_options = c;
  utils.retries = c && c.retries && Number.isInteger(c.retries) ? c.retries : utils.retries;
  utils.retry_delay = c && c.retry_delay && Number.isInteger(c.retry_delay) ? c.retry_delay : utils.retry_delay;
  utils.timeout = c && c.timeout && Number.isInteger(c.timeout) ? c.timeout : utils.timeout;
  utils.nonce = c && c.nonce ? c.nonce : utils.nonce;
  utils.debug = c && c.enableLogging ? c.enableLogging : utils.debug;
  utils.userPreferences.trackingDisabled = c && c.tracking_disabled && !0 === c.tracking_disabled ? !0 : !1;
  utils.userPreferences.enableExtendedJourneysAssist = c && c.enableExtendedJourneysAssist ? c.enableExtendedJourneysAssist : utils.userPreferences.enableExtendedJourneysAssist;
  utils.extendedJourneysAssistExpiryTime = c && c.extendedJourneysAssistExpiryTime && Number.isInteger(c.extendedJourneysAssistExpiryTime) ? c.extendedJourneysAssistExpiryTime : utils.extendedJourneysAssistExpiryTime;
  utils.userPreferences.allowErrorsInCallback = !1;
  utils.getClientHints();
  utils.userPreferences.trackingDisabled && utils.cleanApplicationAndSessionStorage(d);
  b = session.get(d._storage, !0);
  d.identity_id = b && b.identity_id;
  var e = function(n) {
    n.link_click_id && (d.link_click_id = n.link_click_id.toString());
    n.session_id && (d.session_id = n.session_id.toString());
    n.identity_id && (d.identity_id = n.identity_id.toString());
    n.identity && (d.identity = n.identity.toString());
    n.link && (d.sessionLink = n.link);
    n.referring_link && (n.referring_link = utils.processReferringLink(n.referring_link));
    !n.click_id && n.referring_link && (n.click_id = utils.getClickIdAndSearchStringFromLink(n.referring_link));
    d.browser_fingerprint_id = n.browser_fingerprint_id;
    return n;
  };
  b = session.get(d._storage);
  var f = c && "undefined" !== typeof c.branch_match_id && null !== c.branch_match_id ? c.branch_match_id : null, g = f || utils.getParamValue("_branch_match_id") || utils.hashValue("r"), k = !d.identity_id;
  d._branchViewEnabled = !!d._storage.get("branch_view_enabled");
  var h = function(n) {
    var p = {sdk:config.version, branch_key:d.branch_key}, t = session.get(d._storage) || {}, u = session.get(d._storage, !0) || {};
    u.browser_fingerprint_id && (p._t = u.browser_fingerprint_id);
    utils.isSafari11OrGreater() || utils.isIOSWKWebView() || d._api(resources._r, p, function(v, x) {
      v && (d.init_state_fail_code = init_state_fail_codes.BFP_NOT_FOUND, d.init_state_fail_details = v.message);
      x && (t.browser_fingerprint_id = x);
    });
    d._api(resources.hasApp, {browser_fingerprint_id:t.browser_fingerprint_id}, function(v, x) {
      v && (d.init_state_fail_code = init_state_fail_codes.HAS_APP_FAILED, d.init_state_fail_details = v.message);
      v || !x || t.has_app || (t.has_app = !0, session.update(d._storage, t), d._publishEvent("didDownloadApp"));
      n && n(null, t);
    });
  }, l = function(n) {
    k && (n.identity = d.identity);
    return n;
  }, m = function(n, p) {
    p && (p = e(p), utils.userPreferences.trackingDisabled || (p = l(p), session.set(d._storage, p, k)), d.init_state = init_states.INIT_SUCCEEDED, p.data_parsed = p.data && 0 !== p.data.length ? safejson.parse(p.data) : {});
    if (n) {
      return d.init_state = init_states.INIT_FAILED, d.init_state_fail_code || (d.init_state_fail_code = init_state_fail_codes.UNKNOWN_CAUSE, d.init_state_fail_details = n.message), a(n, p && utils.whiteListSessionData(p));
    }
    try {
      a(n, p && utils.whiteListSessionData(p));
    } catch (u) {
    } finally {
      d.renderFinalize();
    }
    n = utils.getAdditionalMetadata();
    (p = utils.validateParameterType(c.metadata, "object") ? c.metadata : null) && (p = utils.mergeHostedDeeplinkData(n.hosted_deeplink_data, p)) && 0 < Object.keys(p).length && (n.hosted_deeplink_data = p);
    var t = branch_view._getPageviewRequestData(journeys_utils._getPageviewMetadata(c, n), c, d, !1);
    d.renderQueue(function() {
      d._api(resources.pageview, t, function(u, v) {
        u || "object" !== typeof v || (u = t.branch_view_id ? !0 : !1, branch_view.shouldDisplayJourney(v, c, u) ? branch_view.displayJourney(v.template, t, t.branch_view_id || v.event_data.branch_view_data.id, v.event_data.branch_view_data, u, v.journey_link_data) : ((v.auto_branchify || !f && utils.getParamValue("branchify_url") && d._referringLink()) && this.branch.deepview({}, {make_new_link:!1, open_app:!0, auto_branchify:!0}), journeys_utils.branch._publishEvent("willNotShowJourney")));
        utils.userPreferences.trackingDisabled && (utils.userPreferences.allowErrorsInCallback = !0);
      });
    });
  }, q = function() {
    if ("undefined" !== typeof document.hidden) {
      var n = "hidden";
      var p = "visibilitychange";
    } else {
      "undefined" !== typeof document.mozHidden ? (n = "mozHidden", p = "mozvisibilitychange") : "undefined" !== typeof document.msHidden ? (n = "msHidden", p = "msvisibilitychange") : "undefined" !== typeof document.webkitHidden && (n = "webkitHidden", p = "webkitvisibilitychange");
    }
    p && !d.changeEventListenerAdded && (d.changeEventListenerAdded = !0, document.addEventListener(p, function() {
      document[n] || (h(null), "function" === typeof d._deepviewRequestForReplay && d._deepviewRequestForReplay());
    }, !1));
  };
  if (b && b.session_id && !g && !utils.getParamValue("branchify_url")) {
    session.update(d._storage, {data:""}), session.update(d._storage, {referring_link:""}), q(), h(m);
  } else {
    b = {sdk:config.version, branch_key:d.branch_key};
    var r = session.get(d._storage, !0) || {};
    r.browser_fingerprint_id && (b._t = r.browser_fingerprint_id);
    r.identity && (d.identity = r.identity);
    var w = parseInt(utils.getParamValue("[?&]_open_delay_ms"), 10);
    utils.isSafari11OrGreater() || utils.isIOSWKWebView() ? utils.delay(function() {
      d._api(resources.open, {link_identifier:g, browser_fingerprint_id:g || r.browser_fingerprint_id, alternative_browser_fingerprint_id:r.browser_fingerprint_id, options:c, initial_referrer:utils.getInitialReferrer(d._referringLink()), current_url:utils.getCurrentUrl(), screen_height:utils.getScreenHeight(), screen_width:utils.getScreenWidth(), model:utils.userAgentData ? utils.userAgentData.model : null, os_version:utils.userAgentData ? utils.userAgentData.platformVersion : null}, function(n, 
      p) {
        n && (d.init_state_fail_code = init_state_fail_codes.OPEN_FAILED, d.init_state_fail_details = n.message);
        n || "object" !== typeof p || (p.branch_view_enabled && (d._branchViewEnabled = !!p.branch_view_enabled, d._storage.set("branch_view_enabled", d._branchViewEnabled)), g && (p.click_id = g));
        q();
        m(n, p);
      });
    }, w) : d._api(resources._r, b, function(n, p) {
      if (n) {
        return d.init_state_fail_code = init_state_fail_codes.BFP_NOT_FOUND, d.init_state_fail_details = n.message, m(n, null);
      }
      utils.delay(function() {
        d._api(resources.open, {link_identifier:g, browser_fingerprint_id:g || p, alternative_browser_fingerprint_id:r.browser_fingerprint_id, options:c, initial_referrer:utils.getInitialReferrer(d._referringLink()), current_url:utils.getCurrentUrl(), screen_height:utils.getScreenHeight(), screen_width:utils.getScreenWidth(), model:utils.userAgentData ? utils.userAgentData.model : null, os_version:utils.userAgentData ? utils.userAgentData.platformVersion : null}, function(t, u) {
          t && (d.init_state_fail_code = init_state_fail_codes.OPEN_FAILED, d.init_state_fail_details = t.message);
          t || "object" !== typeof u || (u.branch_view_enabled && (d._branchViewEnabled = !!u.branch_view_enabled, d._storage.set("branch_view_enabled", d._branchViewEnabled)), g && (u.click_id = g));
          q();
          m(t, u);
        });
      }, w);
    });
  }
}, !0);
Branch.prototype.renderQueue = wrap(callback_params.NO_CALLBACK, function(a, b) {
  this._renderFinalized ? b() : (this._renderQueue = this._renderQueue || [], this._renderQueue.push(b));
  a(null, null);
});
Branch.prototype.renderFinalize = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  this._renderQueue && 0 < this._renderQueue.length && (this._renderQueue.forEach(function(b) {
    b.call(this);
  }), delete this._renderQueue);
  this._renderFinalized = !0;
  a(null, null);
});
Branch.prototype.data = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  var b = utils.whiteListSessionData(session.get(this._storage));
  b.referring_link = this._referringLink();
  b.data_parsed = b.data && 0 !== b.data.length ? safejson.parse(b.data) : {};
  a(null, b);
});
Branch.prototype.first = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  a(null, utils.whiteListSessionData(session.get(this._storage, !0)));
});
Branch.prototype.setIdentity = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b) {
  var c = this;
  this._api(resources.profile, {identity:b}, function(d, e) {
    d && a(d);
    e = e || {};
    c.identity_id = e.identity_id ? e.identity_id.toString() : null;
    c.sessionLink = e.link;
    c.identity = b;
    e.developer_identity = b;
    e.referring_data_parsed = e.referring_data ? safejson.parse(e.referring_data) : null;
    session.patch(c._storage, {identity:b, identity_id:c.identity_id}, !0);
    a(null, e);
  });
});
Branch.prototype.logout = wrap(callback_params.CALLBACK_ERR, function(a) {
  var b = this;
  this._api(resources.logout, {}, function(c, d) {
    c && a(c);
    d = d || {};
    d = {data_parsed:null, data:null, referring_link:null, click_id:null, link_click_id:null, identity:null, session_id:d.session_id, identity_id:d.identity_id, link:d.link, device_fingerprint_id:b.device_fingerprint_id || null};
    b.sessionLink = d.link;
    b.session_id = d.session_id;
    b.identity_id = d.identity_id;
    b.identity = null;
    session.patch(b._storage, d, !0, !0);
    a(null);
  });
});
Branch.prototype.getBrowserFingerprintId = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  var b = session.get(this._storage, !0) || {};
  a(null, b.browser_fingerprint_id || null);
});
Branch.prototype.crossPlatformIds = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  this._api(resources.crossPlatformIds, {user_data:safejson.stringify(utils.getUserData(this))}, function(b, c) {
    return a(b || null, c && c.user_data || null);
  });
});
Branch.prototype.lastAttributedTouchData = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b) {
  b = utils.validateParameterType(b, "number") ? b : null;
  var c = utils.getUserData(this);
  utils.addPropertyIfNotNull(c, "attribution_window", b);
  this._api(resources.lastAttributedTouchData, {user_data:safejson.stringify(c)}, function(d, e) {
    return a(d || null, e || null);
  });
});
Branch.prototype.track = wrap(callback_params.CALLBACK_ERR, function(a, b, c, d) {
  c = c || {};
  d = d || {};
  utils.nonce = d.nonce ? d.nonce : utils.nonce;
  if ("pageview" === b) {
    (b = utils.mergeHostedDeeplinkData(utils.getHostedDeepLinkData(), c)) && 0 < Object.keys(b).length && (c.hosted_deeplink_data = b);
    var e = branch_view._getPageviewRequestData(journeys_utils._getPageviewMetadata(d, c), d, this, !1);
    this._api(resources.pageview, e, function(f, g) {
      if (!f && "object" === typeof g) {
        var k = e.branch_view_id ? !0 : !1;
        branch_view.shouldDisplayJourney(g, d, k) ? branch_view.displayJourney(g.template, e, e.branch_view_id || g.event_data.branch_view_data.id, g.event_data.branch_view_data, k, g.journey_link_data) : journeys_utils.branch._publishEvent("willNotShowJourney");
      }
      "function" === typeof a && a.apply(this, arguments);
    });
  } else {
    console.warn("track method currently supports only pageview event.");
  }
});
Branch.prototype.logEvent = wrap(callback_params.CALLBACK_ERR, function(a, b, c, d, e) {
  b = utils.validateParameterType(b, "string") ? b : null;
  c = utils.validateParameterType(c, "object") ? c : null;
  e = utils.validateParameterType(e, "string") ? e : null;
  c = utils.separateEventAndCustomData(c);
  utils.isStandardEvent(b) ? (d = utils.validateParameterType(d, "array") ? d : null, this._api(resources.logStandardEvent, {name:b, user_data:safejson.stringify(utils.getUserData(this)), custom_data:safejson.stringify(c && c.custom_data || {}), event_data:safejson.stringify(c && c.event_data || {}), content_items:safejson.stringify(d || []), customer_event_alias:e}, function(f, g) {
    return a(f || null);
  })) : this._api(resources.logCustomEvent, {name:b, user_data:safejson.stringify(utils.getUserData(this)), custom_data:safejson.stringify(c && c.custom_data || {}), event_data:safejson.stringify(c && c.event_data || {}), content_items:safejson.stringify(d || []), customer_event_alias:e}, function(f, g) {
    return a(f || null);
  });
});
Branch.prototype.link = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b) {
  var c = utils.cleanLinkData(b), d = this.branch_key;
  this._api(resources.link, c, function(e, f) {
    if (e) {
      return a(e, utils.generateDynamicBNCLink(d, c));
    }
    a(null, f && f.url);
  });
});
Branch.prototype.sendSMS = function() {
  console.warn("SMS feature has been deprecated. This is no-op.");
};
Branch.prototype.qrCode = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b, c, d) {
  utils.cleanLinkData(b).qr_code_settings = safejson.stringify(utils.convertObjectValuesToString(c || {}));
  this._api(resources.qrCode, utils.cleanLinkData(b), function(e, f) {
    function g() {
    }
    e || (g.rawBuffer = f, g.base64 = function() {
      if (this.rawBuffer) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(this.rawBuffer)));
      }
      throw Error("QrCode.rawBuffer is empty.");
    });
    return a(e || null, g || null);
  });
});
Branch.prototype.deepview = wrap(callback_params.CALLBACK_ERR, function(a, b, c) {
  var d = this;
  c || (c = {});
  c.deepview_type = "undefined" === typeof c.deepview_type ? "deepview" : "banner";
  b.data = utils.merge(utils.getHostedDeepLinkData(), b.data);
  b = utils.isIframe() ? utils.merge({is_iframe:!0}, b) : b;
  b = utils.cleanLinkData(b);
  var e = utils.generateDynamicBNCLink(this.branch_key, b);
  if (c.open_app || null === c.open_app || "undefined" === typeof c.open_app) {
    b.open_app = !0;
  }
  b.append_deeplink_path = !!c.append_deeplink_path;
  b.deepview_type = c.deepview_type;
  var f = d._referringLink();
  f && !c.make_new_link && (b.link_click_id = utils.getClickIdAndSearchStringFromLink(f));
  b.banner_options = c;
  c.auto_branchify && (b.auto_branchify = !0);
  d._deepviewRequestForReplay = goog.bind(this._api, d, resources.deepview, b, function(g, k) {
    if (g) {
      return utils.userPreferences.trackingDisabled || (d._deepviewCta = function() {
        d._windowRedirect(e);
      }), a(g);
    }
    "function" === typeof k && (d._deepviewCta = k);
    a(null);
  });
  d._deepviewRequestForReplay();
});
Branch.prototype._windowRedirect = function(a) {
  window.top.location = a;
};
Branch.prototype.deepviewCta = wrap(callback_params.CALLBACK_ERR, function(a) {
  if ("undefined" === typeof this._deepviewCta) {
    return utils.userPreferences.trackingDisabled ? a(Error(utils.messages.trackingDisabled), null) : a(Error(utils.messages.deepviewNotCalled), null);
  }
  window.event && (window.event.preventDefault ? window.event.preventDefault() : window.event.returnValue = !1);
  this._publishEvent("didDeepviewCTA");
  this._deepviewCta();
  a();
});
Branch.prototype.referrals = function() {
  console.warn("Credits feature has been deprecated. This is no-op.");
};
Branch.prototype.getCode = function() {
  console.warn("Credits feature has been deprecated. This is no-op.");
};
Branch.prototype.validateCode = function() {
  console.warn("Credits feature has been deprecated. This is no-op.");
};
Branch.prototype.applyCode = function() {
  console.warn("Credits feature has been deprecated. This is no-op.");
};
Branch.prototype.credits = function() {
  console.warn("Credits feature has been deprecated. This is no-op.");
};
Branch.prototype.creditHistory = function() {
  console.warn("Credits feature has been deprecated. This is no-op.");
};
Branch.prototype.redeem = function() {
  console.warn("Credits feature has been deprecated. This is no-op.");
};
Branch.prototype.addListener = function(a, b) {
  "function" === typeof a && void 0 === b && (b = a, a = null);
  b && this._listeners.push({listener:b, event:a || null});
};
Branch.prototype.removeListener = function(a) {
  a && (this._listeners = this._listeners.filter(function(b) {
    if (b.listener !== a) {
      return b;
    }
  }));
};
function _setBranchViewData(a, b, c) {
  c = c || {};
  try {
    a._branchViewData = safejson.parse(safejson.stringify(c));
  } finally {
    a._branchViewData = a._branchViewData || {};
  }
  b();
}
Branch.prototype.setBranchViewData = wrap(callback_params.CALLBACK_ERR, function(a, b) {
  _setBranchViewData.call(null, this, a, b);
}, !0);
Branch.prototype.closeJourney = wrap(callback_params.CALLBACK_ERR, function(a) {
  var b = this;
  b.renderQueue(function() {
    if (journeys_utils.banner && journeys_utils.isJourneyDisplayed) {
      b._publishEvent("didCallJourneyClose", journeys_utils.journeyLinkData), journeys_utils.animateBannerExit(journeys_utils.banner, !0);
    } else {
      return a("Journey already dismissed.");
    }
  });
  a();
});
Branch.prototype.banner = wrap(callback_params.CALLBACK_ERR, function(a, b, c) {
  if (utils.mobileUserAgent()) {
    c = c || {};
    _setBranchViewData.call(null, this, function() {
    }, c);
    "undefined" === typeof b.showAgain && "undefined" !== typeof b.forgetHide && (b.showAgain = b.forgetHide);
    var d = {icon:utils.cleanBannerText(b.icon) || "", title:utils.cleanBannerText(b.title) || "", description:utils.cleanBannerText(b.description) || "", reviewCount:"number" === typeof b.reviewCount && 0 < b.reviewCount ? Math.floor(b.reviewCount) : null, rating:"number" === typeof b.rating && 5 >= b.rating && 0 < b.rating ? Math.round(2 * b.rating) / 2 : null, openAppButtonText:utils.cleanBannerText(b.openAppButtonText) || "View in app", downloadAppButtonText:utils.cleanBannerText(b.downloadAppButtonText) || 
    "Download App", iframe:"undefined" === typeof b.iframe ? !0 : b.iframe, showiOS:"undefined" === typeof b.showiOS ? !0 : b.showiOS, showiPad:"undefined" === typeof b.showiPad ? !0 : b.showiPad, showAndroid:"undefined" === typeof b.showAndroid ? !0 : b.showAndroid, showBlackberry:"undefined" === typeof b.showBlackberry ? !0 : b.showBlackberry, showWindowsPhone:"undefined" === typeof b.showWindowsPhone ? !0 : b.showWindowsPhone, showKindle:"undefined" === typeof b.showKindle ? !0 : b.showKindle, 
    disableHide:!!b.disableHide, forgetHide:"number" === typeof b.forgetHide ? b.forgetHide : !!b.forgetHide, respectDNT:"undefined" === typeof b.respectDNT ? !1 : b.respectDNT, position:b.position || "top", customCSS:b.customCSS || "", mobileSticky:"undefined" === typeof b.mobileSticky ? !1 : b.mobileSticky, buttonBorderColor:b.buttonBorderColor || "", buttonBackgroundColor:b.buttonBackgroundColor || "", buttonFontColor:b.buttonFontColor || "", buttonBorderColorHover:b.buttonBorderColorHover || 
    "", buttonBackgroundColorHover:b.buttonBackgroundColorHover || "", buttonFontColorHover:b.buttonFontColorHover || "", make_new_link:!!b.make_new_link, open_app:!!b.open_app, immediate:!!b.immediate, append_deeplink_path:!!b.append_deeplink_path};
    "undefined" !== typeof b.showMobile && (d.showiOS = b.showMobile, d.showAndroid = b.showMobile, d.showBlackberry = b.showMobile, d.showWindowsPhone = b.showMobile, d.showKindle = b.showMobile);
    c.data = utils.merge(utils.getHostedDeepLinkData(), c.data);
    var e = this;
    e.renderQueue(function() {
      e.closeBannerPointer = banner(e, d, c, e._storage);
    });
  } else {
    console.info("banner functionality is not supported on desktop");
  }
  a();
});
Branch.prototype.closeBanner = wrap(0, function(a) {
  var b = this;
  b.renderQueue(function() {
    b.closeBannerPointer && (b._publishEvent("willCloseBanner"), b.closeBannerPointer(function() {
      b._publishEvent("didCloseBanner");
    }));
  });
  a();
});
Branch.prototype.autoAppIndex = function() {
  console.warn("autoAppIndex feature has been deprecated. This is no-op.");
};
Branch.prototype.trackCommerceEvent = wrap(callback_params.CALLBACK_ERR, function(a, b, c, d) {
  var e = this;
  e.renderQueue(function() {
    var f = utils.validateCommerceEventParams(b, c);
    if (f) {
      return a(Error(f));
    }
    e._api(resources.commerceEvent, {event:b, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, d || {}), initial_referrer:utils.getInitialReferrer(e._referringLink()), commerce_data:c}, function(g, k) {
      a(g || null);
    });
  });
  a();
});
Branch.prototype.disableTracking = wrap(callback_params.CALLBACK_ERR, function(a, b) {
  if (!1 === b || "false" === b) {
    utils.userPreferences.trackingDisabled = !1, utils.userPreferences.allowErrorsInCallback = !1, this.branch_key && this.init_options && (!0 === this.init_options.tracking_disabled && delete this.init_options.tracking_disabled, this.init(this.branch_key, this.init_options));
  } else if (void 0 === b || !0 === b || "true" === b) {
    utils.cleanApplicationAndSessionStorage(this), utils.userPreferences.trackingDisabled = !0, utils.userPreferences.allowErrorsInCallback = !0, this.closeBanner(), this.closeJourney();
  }
  a();
}, !0);
Branch.prototype.setAPIResponseCallback = wrap(callback_params.NO_CALLBACK, function(a, b) {
  this._server.onAPIResponse = b;
  a();
}, !0);
Branch.prototype.referringLink = function(a) {
  return this._referringLink(a);
};
// Input 17
var branch_instance = new Branch();
if (window.branch && window.branch._q) {
  for (var queue = window.branch._q, i = 0; i < queue.length; i++) {
    var task = queue[i];
    branch_instance[task[0]].apply(branch_instance, task[1]);
  }
}
"function" === typeof define && define.amd ? define("branch", function() {
  return branch_instance;
}) : "object" === typeof exports && (module.exports = branch_instance);
window && (window.branch = branch_instance);
})();
