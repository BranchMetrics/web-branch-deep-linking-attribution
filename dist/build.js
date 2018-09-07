(function() {// Input 0
var $jscomp = {scope:{}};
$jscomp.defineProperty = "function" == typeof Object.defineProperties ? Object.defineProperty : function(a, b, c) {
  if (c.get || c.set) {
    throw new TypeError("ES3 does not support getters and setters.");
  }
  a != Array.prototype && a != Object.prototype && (a[b] = c.value);
};
$jscomp.getGlobal = function(a) {
  return "undefined" != typeof window && window === a ? a : "undefined" != typeof global && null != global ? global : a;
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.SYMBOL_PREFIX = "jscomp_symbol_";
$jscomp.initSymbol = function() {
  $jscomp.initSymbol = function() {
  };
  $jscomp.global.Symbol || ($jscomp.global.Symbol = $jscomp.Symbol);
};
$jscomp.symbolCounter_ = 0;
$jscomp.Symbol = function(a) {
  return $jscomp.SYMBOL_PREFIX + (a || "") + $jscomp.symbolCounter_++;
};
$jscomp.initSymbolIterator = function() {
  $jscomp.initSymbol();
  var a = $jscomp.global.Symbol.iterator;
  a || (a = $jscomp.global.Symbol.iterator = $jscomp.global.Symbol("iterator"));
  "function" != typeof Array.prototype[a] && $jscomp.defineProperty(Array.prototype, a, {configurable:!0, writable:!0, value:function() {
    return $jscomp.arrayIterator(this);
  }});
  $jscomp.initSymbolIterator = function() {
  };
};
$jscomp.arrayIterator = function(a) {
  var b = 0;
  return $jscomp.iteratorPrototype(function() {
    return b < a.length ? {done:!1, value:a[b++]} : {done:!0};
  });
};
$jscomp.iteratorPrototype = function(a) {
  $jscomp.initSymbolIterator();
  a = {next:a};
  a[$jscomp.global.Symbol.iterator] = function() {
    return this;
  };
  return a;
};
$jscomp.array = $jscomp.array || {};
$jscomp.iteratorFromArray = function(a, b) {
  $jscomp.initSymbolIterator();
  a instanceof String && (a += "");
  var c = 0, d = {next:function() {
    if (c < a.length) {
      var e = c++;
      return {value:b(e, a[e]), done:!1};
    }
    d.next = function() {
      return {done:!0, value:void 0};
    };
    return d.next();
  }};
  d[Symbol.iterator] = function() {
    return d;
  };
  return d;
};
$jscomp.polyfill = function(a, b, c, d) {
  if (b) {
    c = $jscomp.global;
    a = a.split(".");
    for (d = 0;d < a.length - 1;d++) {
      var e = a[d];
      e in c || (c[e] = {});
      c = c[e];
    }
    a = a[a.length - 1];
    d = c[a];
    b = b(d);
    b != d && null != b && $jscomp.defineProperty(c, a, {configurable:!0, writable:!0, value:b});
  }
};
$jscomp.checkStringArgs = function(a, b, c) {
  if (null == a) {
    throw new TypeError("The 'this' value for String.prototype." + c + " must not be null or undefined");
  }
  if (b instanceof RegExp) {
    throw new TypeError("First argument to String.prototype." + c + " must not be a regular expression");
  }
  return a + "";
};
$jscomp.polyfill("String.prototype.includes", function(a) {
  return a ? a : function(a, c) {
    return -1 !== $jscomp.checkStringArgs(this, a, "includes").indexOf(a, c || 0);
  };
}, "es6-impl", "es3");
$jscomp.polyfill("Number.isFinite", function(a) {
  return a ? a : function(a) {
    return "number" !== typeof a ? !1 : !isNaN(a) && Infinity !== a && -Infinity !== a;
  };
}, "es6-impl", "es3");
$jscomp.polyfill("Number.isInteger", function(a) {
  return a ? a : function(a) {
    return Number.isFinite(a) ? a === Math.floor(a) : !1;
  };
}, "es6-impl", "es3");
var COMPILED = !0, goog = goog || {};
goog.global = this;
goog.isDef = function(a) {
  return void 0 !== a;
};
goog.exportPath_ = function(a, b, c) {
  a = a.split(".");
  c = c || goog.global;
  a[0] in c || !c.execScript || c.execScript("var " + a[0]);
  for (var d;a.length && (d = a.shift());) {
    !a.length && goog.isDef(b) ? c[d] = b : c = c[d] && Object.prototype.hasOwnProperty.call(c, d) ? c[d] : c[d] = {};
  }
};
goog.define = function(a, b) {
  var c = b;
  COMPILED || (goog.global.CLOSURE_UNCOMPILED_DEFINES && Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_UNCOMPILED_DEFINES, a) ? c = goog.global.CLOSURE_UNCOMPILED_DEFINES[a] : goog.global.CLOSURE_DEFINES && Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_DEFINES, a) && (c = goog.global.CLOSURE_DEFINES[a]));
  goog.exportPath_(a, c);
};
goog.DEBUG = !0;
goog.LOCALE = "en";
goog.TRUSTED_SITE = !0;
goog.STRICT_MODE_COMPATIBLE = !1;
goog.DISALLOW_TEST_ONLY_CODE = COMPILED && !goog.DEBUG;
goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING = !1;
goog.provide = function(a) {
  if (goog.isInModuleLoader_()) {
    throw Error("goog.provide can not be used within a goog.module.");
  }
  if (!COMPILED && goog.isProvided_(a)) {
    throw Error('Namespace "' + a + '" already declared.');
  }
  goog.constructNamespace_(a);
};
goog.constructNamespace_ = function(a, b) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[a];
    for (var c = a;(c = c.substring(0, c.lastIndexOf("."))) && !goog.getObjectByName(c);) {
      goog.implicitNamespaces_[c] = !0;
    }
  }
  goog.exportPath_(a, b);
};
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;
goog.module = function(a) {
  if (!goog.isString(a) || !a || -1 == a.search(goog.VALID_MODULE_RE_)) {
    throw Error("Invalid module identifier");
  }
  if (!goog.isInModuleLoader_()) {
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
      return goog.loadedModules_[a];
    }
    if (!goog.implicitNamespaces_[a]) {
      return a = goog.getObjectByName(a), null != a ? a : null;
    }
  }
  return null;
};
goog.moduleLoaderState_ = null;
goog.isInModuleLoader_ = function() {
  return null != goog.moduleLoaderState_;
};
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInModuleLoader_()) {
    throw Error("goog.module.declareLegacyNamespace must be called from within a goog.module");
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw Error("goog.module must be called prior to goog.module.declareLegacyNamespace.");
  }
  goog.moduleLoaderState_.declareLegacyNamespace = !0;
};
goog.setTestOnly = function(a) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    throw a = a || "", Error("Importing test-only code into non-debug environment" + (a ? ": " + a : "."));
  }
};
goog.forwardDeclare = function(a) {
};
COMPILED || (goog.isProvided_ = function(a) {
  return a in goog.loadedModules_ || !goog.implicitNamespaces_[a] && goog.isDefAndNotNull(goog.getObjectByName(a));
}, goog.implicitNamespaces_ = {"goog.module":!0});
goog.getObjectByName = function(a, b) {
  for (var c = a.split("."), d = b || goog.global, e;e = c.shift();) {
    if (goog.isDefAndNotNull(d[e])) {
      d = d[e];
    } else {
      return null;
    }
  }
  return d;
};
goog.globalize = function(a, b) {
  var c = b || goog.global, d;
  for (d in a) {
    c[d] = a[d];
  }
};
goog.addDependency = function(a, b, c, d) {
  if (goog.DEPENDENCIES_ENABLED) {
    var e;
    a = a.replace(/\\/g, "/");
    var f = goog.dependencies_;
    d && "boolean" !== typeof d || (d = d ? {module:"goog"} : {});
    for (var g = 0;e = b[g];g++) {
      f.nameToPath[e] = a, f.loadFlags[a] = d;
    }
    for (d = 0;b = c[d];d++) {
      a in f.requires || (f.requires[a] = {}), f.requires[a][b] = !0;
    }
  }
};
goog.ENABLE_DEBUG_LOADER = !0;
goog.logToConsole_ = function(a) {
  goog.global.console && goog.global.console.error(a);
};
goog.require = function(a) {
  if (!COMPILED) {
    goog.ENABLE_DEBUG_LOADER && goog.IS_OLD_IE_ && goog.maybeProcessDeferredDep_(a);
    if (goog.isProvided_(a)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(a);
      }
    } else {
      if (goog.ENABLE_DEBUG_LOADER) {
        var b = goog.getPathFromDeps_(a);
        if (b) {
          goog.writeScripts_(b);
        } else {
          throw a = "goog.require could not find: " + a, goog.logToConsole_(a), Error(a);
        }
      }
    }
    return null;
  }
};
goog.basePath = "";
goog.nullFunction = function() {
};
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
    return a.instance_ = new a;
  };
};
goog.instantiatedSingletons_ = [];
goog.LOAD_MODULE_USING_EVAL = !0;
goog.SEAL_MODULE_EXPORTS = goog.DEBUG;
goog.loadedModules_ = {};
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;
goog.TRANSPILE = "detect";
goog.TRANSPILER = "transpile.js";
goog.DEPENDENCIES_ENABLED && (goog.dependencies_ = {loadFlags:{}, nameToPath:{}, requires:{}, visited:{}, written:{}, deferred:{}}, goog.inHtmlDocument_ = function() {
  var a = goog.global.document;
  return null != a && "write" in a;
}, goog.findBasePath_ = function() {
  if (goog.isDef(goog.global.CLOSURE_BASE_PATH)) {
    goog.basePath = goog.global.CLOSURE_BASE_PATH;
  } else {
    if (goog.inHtmlDocument_()) {
      for (var a = goog.global.document.getElementsByTagName("SCRIPT"), b = a.length - 1;0 <= b;--b) {
        var c = a[b].src, d = c.lastIndexOf("?"), d = -1 == d ? c.length : d;
        if ("base.js" == c.substr(d - 7, 7)) {
          goog.basePath = c.substr(0, d - 7);
          break;
        }
      }
    }
  }
}, goog.importScript_ = function(a, b) {
  (goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_)(a, b) && (goog.dependencies_.written[a] = !0);
}, goog.IS_OLD_IE_ = !(goog.global.atob || !goog.global.document || !goog.global.document.all), goog.importProcessedScript_ = function(a, b, c) {
  goog.importScript_("", 'goog.retrieveAndExec_("' + a + '", ' + b + ", " + c + ");");
}, goog.queuedModules_ = [], goog.wrapModule_ = function(a, b) {
  return goog.LOAD_MODULE_USING_EVAL && goog.isDef(goog.global.JSON) ? "goog.loadModule(" + goog.global.JSON.stringify(b + "\n//# sourceURL=" + a + "\n") + ");" : 'goog.loadModule(function(exports) {"use strict";' + b + "\n;return exports});\n//# sourceURL=" + a + "\n";
}, goog.loadQueuedModules_ = function() {
  var a = goog.queuedModules_.length;
  if (0 < a) {
    var b = goog.queuedModules_;
    goog.queuedModules_ = [];
    for (var c = 0;c < a;c++) {
      goog.maybeProcessDeferredPath_(b[c]);
    }
  }
}, goog.maybeProcessDeferredDep_ = function(a) {
  goog.isDeferredModule_(a) && goog.allDepsAreAvailable_(a) && (a = goog.getPathFromDeps_(a), goog.maybeProcessDeferredPath_(goog.basePath + a));
}, goog.isDeferredModule_ = function(a) {
  var b = (a = goog.getPathFromDeps_(a)) && goog.dependencies_.loadFlags[a] || {}, c = b.lang || "es3";
  return a && ("goog" == b.module || goog.needsTranspile_(c)) ? goog.basePath + a in goog.dependencies_.deferred : !1;
}, goog.allDepsAreAvailable_ = function(a) {
  if ((a = goog.getPathFromDeps_(a)) && a in goog.dependencies_.requires) {
    for (var b in goog.dependencies_.requires[a]) {
      if (!goog.isProvided_(b) && !goog.isDeferredModule_(b)) {
        return !1;
      }
    }
  }
  return !0;
}, goog.maybeProcessDeferredPath_ = function(a) {
  if (a in goog.dependencies_.deferred) {
    var b = goog.dependencies_.deferred[a];
    delete goog.dependencies_.deferred[a];
    goog.globalEval(b);
  }
}, goog.loadModuleFromUrl = function(a) {
  goog.retrieveAndExec_(a, !0, !1);
}, goog.writeScriptSrcNode_ = function(a) {
  goog.global.document.write('<script type="text/javascript" src="' + a + '">\x3c/script>');
}, goog.appendScriptSrcNode_ = function(a) {
  var b = goog.global.document, c = b.createElement("script");
  c.type = "text/javascript";
  c.src = a;
  c.defer = !1;
  c.async = !1;
  b.head.appendChild(c);
}, goog.writeScriptTag_ = function(a, b) {
  if (goog.inHtmlDocument_()) {
    var c = goog.global.document;
    if (!goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING && "complete" == c.readyState) {
      if (/\bdeps.js$/.test(a)) {
        return !1;
      }
      throw Error('Cannot write "' + a + '" after document load');
    }
    if (void 0 === b) {
      if (goog.IS_OLD_IE_) {
        var d = " onreadystatechange='goog.onScriptLoad_(this, " + ++goog.lastNonModuleScriptIndex_ + ")' ";
        c.write('<script type="text/javascript" src="' + a + '"' + d + ">\x3c/script>");
      } else {
        goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING ? goog.appendScriptSrcNode_(a) : goog.writeScriptSrcNode_(a);
      }
    } else {
      c.write('<script type="text/javascript">' + goog.protectScriptTag_(b) + "\x3c/script>");
    }
    return !0;
  }
  return !1;
}, goog.protectScriptTag_ = function(a) {
  return a.replace(/<\/(SCRIPT)/ig, "\\x3c\\$1");
}, goog.needsTranspile_ = function(a) {
  if ("always" == goog.TRANSPILE) {
    return !0;
  }
  if ("never" == goog.TRANSPILE) {
    return !1;
  }
  goog.requiresTranspilation_ || (goog.requiresTranspilation_ = goog.createRequiresTranspilation_());
  if (a in goog.requiresTranspilation_) {
    return goog.requiresTranspilation_[a];
  }
  throw Error("Unknown language mode: " + a);
}, goog.requiresTranspilation_ = null, goog.lastNonModuleScriptIndex_ = 0, goog.onScriptLoad_ = function(a, b) {
  "complete" == a.readyState && goog.lastNonModuleScriptIndex_ == b && goog.loadQueuedModules_();
  return !0;
}, goog.writeScripts_ = function(a) {
  function b(a) {
    if (!(a in e.written || a in e.visited)) {
      e.visited[a] = !0;
      if (a in e.requires) {
        for (var f in e.requires[a]) {
          if (!goog.isProvided_(f)) {
            if (f in e.nameToPath) {
              b(e.nameToPath[f]);
            } else {
              throw Error("Undefined nameToPath for " + f);
            }
          }
        }
      }
      a in d || (d[a] = !0, c.push(a));
    }
  }
  var c = [], d = {}, e = goog.dependencies_;
  b(a);
  for (a = 0;a < c.length;a++) {
    var f = c[a];
    goog.dependencies_.written[f] = !0;
  }
  var g = goog.moduleLoaderState_;
  goog.moduleLoaderState_ = null;
  for (a = 0;a < c.length;a++) {
    if (f = c[a]) {
      var k = e.loadFlags[f] || {}, h = goog.needsTranspile_(k.lang || "es3");
      "goog" == k.module || h ? goog.importProcessedScript_(goog.basePath + f, "goog" == k.module, h) : goog.importScript_(goog.basePath + f);
    } else {
      throw goog.moduleLoaderState_ = g, Error("Undefined script input");
    }
  }
  goog.moduleLoaderState_ = g;
}, goog.getPathFromDeps_ = function(a) {
  return a in goog.dependencies_.nameToPath ? goog.dependencies_.nameToPath[a] : null;
}, goog.findBasePath_(), goog.global.CLOSURE_NO_DEPS || goog.importScript_(goog.basePath + "deps.js"));
goog.hasBadLetScoping = null;
goog.useSafari10Workaround = function() {
  if (null == goog.hasBadLetScoping) {
    var a;
    try {
      a = !eval('"use strict";let x = 1; function f() { return typeof x; };f() == "number";');
    } catch (b) {
      a = !1;
    }
    goog.hasBadLetScoping = a;
  }
  return goog.hasBadLetScoping;
};
goog.workaroundSafari10EvalBug = function(a) {
  return "(function(){" + a + "\n;})();\n";
};
goog.loadModule = function(a) {
  var b = goog.moduleLoaderState_;
  try {
    goog.moduleLoaderState_ = {moduleName:void 0, declareLegacyNamespace:!1};
    var c;
    if (goog.isFunction(a)) {
      c = a.call(void 0, {});
    } else {
      if (goog.isString(a)) {
        goog.useSafari10Workaround() && (a = goog.workaroundSafari10EvalBug(a)), c = goog.loadModuleFromSource_.call(void 0, a);
      } else {
        throw Error("Invalid module definition");
      }
    }
    var d = goog.moduleLoaderState_.moduleName;
    if (!goog.isString(d) || !d) {
      throw Error('Invalid module name "' + d + '"');
    }
    goog.moduleLoaderState_.declareLegacyNamespace ? goog.constructNamespace_(d, c) : goog.SEAL_MODULE_EXPORTS && Object.seal && "object" == typeof c && null != c && Object.seal(c);
    goog.loadedModules_[d] = c;
  } finally {
    goog.moduleLoaderState_ = b;
  }
};
goog.loadModuleFromSource_ = function(a) {
  eval(a);
  return {};
};
goog.normalizePath_ = function(a) {
  a = a.split("/");
  for (var b = 0;b < a.length;) {
    "." == a[b] ? a.splice(b, 1) : b && ".." == a[b] && a[b - 1] && ".." != a[b - 1] ? a.splice(--b, 2) : b++;
  }
  return a.join("/");
};
goog.loadFileSync_ = function(a) {
  if (goog.global.CLOSURE_LOAD_FILE_SYNC) {
    return goog.global.CLOSURE_LOAD_FILE_SYNC(a);
  }
  try {
    var b = new goog.global.XMLHttpRequest;
    b.open("get", a, !1);
    b.send();
    return 0 == b.status || 200 == b.status ? b.responseText : null;
  } catch (c) {
    return null;
  }
};
goog.retrieveAndExec_ = function(a, b, c) {
  if (!COMPILED) {
    var d = a;
    a = goog.normalizePath_(a);
    var e = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_, f = goog.loadFileSync_(a);
    if (null == f) {
      throw Error('Load of "' + a + '" failed');
    }
    c && (f = goog.transpile_.call(goog.global, f, a));
    f = b ? goog.wrapModule_(a, f) : f + ("\n//# sourceURL=" + a);
    goog.IS_OLD_IE_ ? (goog.dependencies_.deferred[d] = f, goog.queuedModules_.push(d)) : e(a, f);
  }
};
goog.transpile_ = function(a, b) {
  var c = goog.global.$jscomp;
  c || (goog.global.$jscomp = c = {});
  var d = c.transpile;
  if (!d) {
    var e = goog.basePath + goog.TRANSPILER, f = goog.loadFileSync_(e);
    if (f) {
      eval(f + "\n//# sourceURL=" + e);
      if (goog.global.$gwtExport && goog.global.$gwtExport.$jscomp && !goog.global.$gwtExport.$jscomp.transpile) {
        throw Error('The transpiler did not properly export the "transpile" method. $gwtExport: ' + JSON.stringify(goog.global.$gwtExport));
      }
      goog.global.$jscomp.transpile = goog.global.$gwtExport.$jscomp.transpile;
      c = goog.global.$jscomp;
      d = c.transpile;
    }
  }
  d || (d = c.transpile = function(a, b) {
    goog.logToConsole_(b + " requires transpilation but no transpiler was found.");
    return a;
  });
  return d(a, b);
};
goog.typeOf = function(a) {
  var b = typeof a;
  if ("object" == b) {
    if (a) {
      if (a instanceof Array) {
        return "array";
      }
      if (a instanceof Object) {
        return b;
      }
      var c = Object.prototype.toString.call(a);
      if ("[object Window]" == c) {
        return "object";
      }
      if ("[object Array]" == c || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) {
        return "array";
      }
      if ("[object Function]" == c || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) {
        return "function";
      }
    } else {
      return "null";
    }
  } else {
    if ("function" == b && "undefined" == typeof a.call) {
      return "object";
    }
  }
  return b;
};
goog.isNull = function(a) {
  return null === a;
};
goog.isDefAndNotNull = function(a) {
  return null != a;
};
goog.isArray = function(a) {
  return "array" == goog.typeOf(a);
};
goog.isArrayLike = function(a) {
  var b = goog.typeOf(a);
  return "array" == b || "object" == b && "number" == typeof a.length;
};
goog.isDateLike = function(a) {
  return goog.isObject(a) && "function" == typeof a.getFullYear;
};
goog.isString = function(a) {
  return "string" == typeof a;
};
goog.isBoolean = function(a) {
  return "boolean" == typeof a;
};
goog.isNumber = function(a) {
  return "number" == typeof a;
};
goog.isFunction = function(a) {
  return "function" == goog.typeOf(a);
};
goog.isObject = function(a) {
  var b = typeof a;
  return "object" == b && null != a || "function" == b;
};
goog.getUid = function(a) {
  return a[goog.UID_PROPERTY_] || (a[goog.UID_PROPERTY_] = ++goog.uidCounter_);
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
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(a) {
  var b = goog.typeOf(a);
  if ("object" == b || "array" == b) {
    if (a.clone) {
      return a.clone();
    }
    var b = "array" == b ? [] : {}, c;
    for (c in a) {
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
      var c = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(c, d);
      return a.apply(b, c);
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
    var b = c.slice();
    b.push.apply(b, arguments);
    return a.apply(this, b);
  };
};
goog.mixin = function(a, b) {
  for (var c in b) {
    a[c] = b[c];
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return +new Date;
};
goog.globalEval = function(a) {
  if (goog.global.execScript) {
    goog.global.execScript(a, "JavaScript");
  } else {
    if (goog.global.eval) {
      if (null == goog.evalWorksForGlobals_) {
        if (goog.global.eval("var _evalTest_ = 1;"), "undefined" != typeof goog.global._evalTest_) {
          try {
            delete goog.global._evalTest_;
          } catch (d) {
          }
          goog.evalWorksForGlobals_ = !0;
        } else {
          goog.evalWorksForGlobals_ = !1;
        }
      }
      if (goog.evalWorksForGlobals_) {
        goog.global.eval(a);
      } else {
        var b = goog.global.document, c = b.createElement("SCRIPT");
        c.type = "text/javascript";
        c.defer = !1;
        c.appendChild(b.createTextNode(a));
        b.body.appendChild(c);
        b.body.removeChild(c);
      }
    } else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.getCssName = function(a, b) {
  if ("." == String(a).charAt(0)) {
    throw Error('className passed in goog.getCssName must not start with ".". You passed: ' + a);
  }
  var c = function(a) {
    return goog.cssNameMapping_[a] || a;
  }, d = function(a) {
    a = a.split("-");
    for (var b = [], d = 0;d < a.length;d++) {
      b.push(c(a[d]));
    }
    return b.join("-");
  }, d = goog.cssNameMapping_ ? "BY_WHOLE" == goog.cssNameMappingStyle_ ? c : d : function(a) {
    return a;
  }, d = b ? a + "-" + d(b) : d(a);
  return goog.global.CLOSURE_CSS_NAME_MAP_FN ? goog.global.CLOSURE_CSS_NAME_MAP_FN(d) : d;
};
goog.setCssNameMapping = function(a, b) {
  goog.cssNameMapping_ = a;
  goog.cssNameMappingStyle_ = b;
};
!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING && (goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING);
goog.getMsg = function(a, b) {
  b && (a = a.replace(/\{\$([^}]+)}/g, function(a, d) {
    return null != b && d in b ? b[d] : a;
  }));
  return a;
};
goog.getMsgWithFallback = function(a, b) {
  return a;
};
goog.exportSymbol = function(a, b, c) {
  goog.exportPath_(a, b, c);
};
goog.exportProperty = function(a, b, c) {
  a[b] = c;
};
goog.inherits = function(a, b) {
  function c() {
  }
  c.prototype = b.prototype;
  a.superClass_ = b.prototype;
  a.prototype = new c;
  a.prototype.constructor = a;
  a.base = function(a, c, f) {
    for (var d = Array(arguments.length - 2), e = 2;e < arguments.length;e++) {
      d[e - 2] = arguments[e];
    }
    return b.prototype[c].apply(a, d);
  };
};
goog.base = function(a, b, c) {
  var d = arguments.callee.caller;
  if (goog.STRICT_MODE_COMPATIBLE || goog.DEBUG && !d) {
    throw Error("arguments.caller not defined.  goog.base() cannot be used with strict mode code. See http://www.ecma-international.org/ecma-262/5.1/#sec-C");
  }
  if (d.superClass_) {
    for (var e = Array(arguments.length - 1), f = 1;f < arguments.length;f++) {
      e[f - 1] = arguments[f];
    }
    return d.superClass_.constructor.apply(a, e);
  }
  e = Array(arguments.length - 2);
  for (f = 2;f < arguments.length;f++) {
    e[f - 2] = arguments[f];
  }
  for (var f = !1, g = a.constructor;g;g = g.superClass_ && g.superClass_.constructor) {
    if (g.prototype[b] === d) {
      f = !0;
    } else {
      if (f) {
        return g.prototype[b].apply(a, e);
      }
    }
  }
  if (a[b] === d) {
    return a.constructor.prototype[b].apply(a, e);
  }
  throw Error("goog.base called from a method of one name to a method of a different name");
};
goog.scope = function(a) {
  if (goog.isInModuleLoader_()) {
    throw Error("goog.scope is not supported within a goog.module.");
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
  if (!goog.defineClass.SEAL_CLASS_INSTANCES) {
    return a;
  }
  var c = !goog.defineClass.isUnsealable_(b), d = function() {
    var b = a.apply(this, arguments) || this;
    b[goog.UID_PROPERTY_] = b[goog.UID_PROPERTY_];
    this.constructor === d && c && Object.seal instanceof Function && Object.seal(b);
    return b;
  };
  return d;
};
goog.defineClass.isUnsealable_ = function(a) {
  return a && a.prototype && a.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_];
};
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
goog.defineClass.applyProperties_ = function(a, b) {
  for (var c in b) {
    Object.prototype.hasOwnProperty.call(b, c) && (a[c] = b[c]);
  }
  for (var d = 0;d < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length;d++) {
    c = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[d], Object.prototype.hasOwnProperty.call(b, c) && (a[c] = b[c]);
  }
};
goog.tagUnsealableClass = function(a) {
  !COMPILED && goog.defineClass.SEAL_CLASS_INSTANCES && (a.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_] = !0);
};
goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = "goog_defineClass_legacy_unsealable";
goog.createRequiresTranspilation_ = function() {
  function a(a, b) {
    d ? c[a] = !0 : b() ? c[a] = !1 : d = c[a] = !0;
  }
  function b(a) {
    try {
      return !!eval(a);
    } catch (f) {
      return !1;
    }
  }
  var c = {es3:!1}, d = !1;
  a("es5", function() {
    return b("[1,].length==1");
  });
  a("es6", function() {
    return b('(()=>{"use strict";class X{constructor(){if(new.target!=String)throw 1;this.x=42}}let q=Reflect.construct(X,[],String);if(q.x!=42||!(q instanceof String))throw 1;for(const a of[2,3]){if(a==2)continue;function f(z={a}){let a=0;return z.a}{function f(){return 0;}}return f()==3}})()');
  });
  a("es6-impl", function() {
    return !0;
  });
  a("es7", function() {
    return b("2 ** 2 == 4");
  });
  a("es8", function() {
    return b("async () => 1, true");
  });
  return c;
};
// Input 1
goog.json = {};
goog.json.USE_NATIVE_JSON = !1;
goog.json.isValid = function(a) {
  return /^\s*$/.test(a) ? !1 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, "@").replace(/(?:"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)[\s\u2028\u2029]*(?=:|,|]|}|$)/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""));
};
goog.json.parse = goog.json.USE_NATIVE_JSON ? goog.global.JSON.parse : function(a) {
  a = String(a);
  if (goog.json.isValid(a)) {
    try {
      return eval("(" + a + ")");
    } catch (b) {
    }
  }
  throw Error("Invalid JSON string: " + a);
};
goog.json.unsafeParse = goog.json.USE_NATIVE_JSON ? goog.global.JSON.parse : function(a) {
  return eval("(" + a + ")");
};
goog.json.serialize = goog.json.USE_NATIVE_JSON ? goog.global.JSON.stringify : function(a, b) {
  return (new goog.json.Serializer(b)).serialize(a);
};
goog.json.Serializer = function(a) {
  this.replacer_ = a;
};
goog.json.Serializer.prototype.serialize = function(a) {
  var b = [];
  this.serializeInternal(a, b);
  return b.join("");
};
goog.json.Serializer.prototype.serializeInternal = function(a, b) {
  if (null == a) {
    b.push("null");
  } else {
    if ("object" == typeof a) {
      if (goog.isArray(a)) {
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
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(a, b) {
  b.push('"', a.replace(goog.json.Serializer.charsToReplace_, function(a) {
    var b = goog.json.Serializer.charToJsonCharCache_[a];
    b || (b = "\\u" + (a.charCodeAt(0) | 65536).toString(16).substr(1), goog.json.Serializer.charToJsonCharCache_[a] = b);
    return b;
  }), '"');
};
goog.json.Serializer.prototype.serializeNumber_ = function(a, b) {
  b.push(isFinite(a) && !isNaN(a) ? String(a) : "null");
};
goog.json.Serializer.prototype.serializeArray = function(a, b) {
  var c = a.length;
  b.push("[");
  for (var d = "", e = 0;e < c;e++) {
    b.push(d), d = a[e], this.serializeInternal(this.replacer_ ? this.replacer_.call(a, String(e), d) : d, b), d = ",";
  }
  b.push("]");
};
goog.json.Serializer.prototype.serializeObject_ = function(a, b) {
  b.push("{");
  var c = "", d;
  for (d in a) {
    if (Object.prototype.hasOwnProperty.call(a, d)) {
      var e = a[d];
      "function" != typeof e && (b.push(c), this.serializeString_(d, b), b.push(":"), this.serializeInternal(this.replacer_ ? this.replacer_.call(a, d, e) : e, b), c = ",");
    }
  }
  b.push("}");
};
// Input 2
var config = {app_service_endpoint:"https://app.link", link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:"2.45.0"};
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
// Input 5
var utils = {}, DEBUG = !0, message;
utils.retries = 2;
utils.retry_delay = 200;
utils.timeout = 5000;
utils.nonce = "";
utils.instrumentation = {};
utils.navigationTimingAPIEnabled = function() {
  return !!(window.performance && window.performance.timing && window.performance.timing.navigationStart);
};
utils.timeSinceNavigationStart = function() {
  return (Date.now() - window.performance.timing.navigationStart).toString();
};
utils.currentRequestBrttTag = "";
utils.calculateBrtt = function(a) {
  return a && "number" === typeof a ? (Date.now() - a).toString() : null;
};
utils.userPreferences = {trackingDisabled:!1, whiteListedEndpointsWithData:{"/v1/open":{link_identifier:"\\d+"}, "/v1/pageview":{event:"pageview"}, "/v1/dismiss":{event:"dismiss"}}, allowErrorsInCallback:!1, shouldBlockRequest:function(a, b) {
  var c = document.createElement("a");
  c.href = a;
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
    for (var d in c) {
      var e = new RegExp(c[d]);
      if (!b.hasOwnProperty(d) || !e.test(b[d])) {
        return !0;
      }
    }
  }
  return !1;
}};
utils.generateDynamicBNCLink = function(a, b) {
  if (a || b) {
    for (var c = config.link_service_endpoint + "/a/" + a + "?", d = "tags alias channel feature stage campaign type duration sdk source data".split(" "), e = 0;e < d.length;e++) {
      var f = d[e], g = b[f];
      if (g) {
        if ("tags" === f && Array.isArray(g)) {
          for (var k = 0;k < g.length;k++) {
            c = ("?" === c[c.length - 1] ? c + f : c + "&" + f) + "=" + encodeURIComponent(g[k]);
          }
        } else {
          if ("string" === typeof g && 0 < g.length || "number" === typeof g) {
            "data" === f && "string" === typeof g && (g = utils.base64encode(g)), c = ("?" === c[c.length - 1] ? c + f : c + "&" + f) + "=" + encodeURIComponent(g);
          }
        }
      }
    }
    return c;
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
  a = a.replace(/\$(\d)/g, function(a, c) {
    return b[parseInt(c, 10) - 1];
  });
  c && (a += "\n Failure Code:" + c);
  d && (a += "\n Failure Details:" + d);
  DEBUG && console && console.log(a);
  return a;
};
utils.whiteListSessionData = function(a) {
  return {data:a.data || "", data_parsed:a.data_parsed || {}, has_app:a.has_app || null, identity:a.identity || null, referring_identity:a.referring_identity || null, referring_link:a.referring_link || null};
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
  Object.keys(c).forEach(function(a) {
    b.test(a) && (d[a] = c[a]);
  });
  return d;
};
utils.getWindowLocation = function() {
  return utils.isIframe() ? document.referrer : String(window.location);
};
utils.getParameterByName = function(a) {
  var b;
  a = a.replace(/[\[\]]/g, "\\$&");
  b = utils.getWindowLocation();
  return (a = (new RegExp("[?&]" + a + "(=([^&#]*)|&|#|$)")).exec(b)) && a[2] ? decodeURIComponent(a[2].replace(/\+/g, " ")) : "";
};
utils.cleanLinkData = function(a) {
  a.source = "web-sdk";
  var b = a.data;
  switch(typeof b) {
    case "string":
      try {
        b = safejson.parse(b);
      } catch (c) {
        b = {_bncNoEval:!0};
      }
      break;
    case "object":
      break;
    default:
      b = {};
  }
  b.$canonical_url || (b.$canonical_url = utils.getWindowLocation());
  b.$og_title || (b.$og_title = utils.getOpenGraphContent("title"));
  b.$og_description || (b.$og_description = utils.getOpenGraphContent("description"));
  b.$og_image_url || (b.$og_image_url = utils.getOpenGraphContent("image"));
  b.$og_video || (b.$og_video = utils.getOpenGraphContent("video"));
  "string" === typeof b.$desktop_url && (b.$desktop_url = b.$desktop_url.replace(/#r:[a-z0-9-_]+$/i, "").replace(/([\?\&]_branch_match_id=\d+)/, ""));
  try {
    safejson.parse(b);
  } catch (c) {
    b = goog.json.serialize(b);
  }
  a.data = b;
  return a;
};
utils.getClickIdAndSearchStringFromLink = function(a) {
  function b(a) {
    return "" !== a;
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
utils.merge = function(a, b) {
  a && "object" === typeof a || (a = {});
  if (!b || "object" !== typeof b) {
    return a;
  }
  for (var c in b) {
    b.hasOwnProperty(c) && (a[c] = b[c]);
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
utils.mobileUserAgent = function() {
  var a = navigator.userAgent;
  return a.match(/android/i) ? "android" : a.match(/ipad/i) ? "ipad" : a.match(/i(os|p(hone|od))/i) ? "ios" : a.match(/\(BB[1-9][0-9]*\;/i) ? "blackberry" : a.match(/Windows Phone/i) ? "windows_phone" : a.match(/Kindle/i) || a.match(/Silk/i) || a.match(/KFTT/i) || a.match(/KFOT/i) || a.match(/KFJWA/i) || a.match(/KFJWI/i) || a.match(/KFSOWI/i) || a.match(/KFTHWA/i) || a.match(/KFTHWI/i) || a.match(/KFAPWA/i) || a.match(/KFAPWI/i) ? "kindle" : !1;
};
function isSafariBrowser(a) {
  return !!/^((?!chrome|android|crios|fxios).)*safari/i.test(a);
}
function isGreaterThanVersion(a, b) {
  b = b || 11;
  var c = /version\/([^ ]*)/i.exec(a);
  if (c && c[1]) {
    try {
      if (parseFloat(c[1]) >= b) {
        return !0;
      }
    } catch (d) {
    }
  }
  return !1;
}
utils.isSafari11OrGreater = function() {
  var a = navigator.userAgent;
  return isSafariBrowser(a) ? isGreaterThanVersion(a, 11) : !1;
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
  return a.replace(/(\-\w)/g, function(a) {
    return a[1].toUpperCase();
  });
};
utils.base64encode = function(a) {
  var b = "", c, d, e, f, g, k, h = 0;
  a = a.replace(/\r\n/g, "\n");
  d = "";
  for (e = 0;e < a.length;e++) {
    f = a.charCodeAt(e), 128 > f ? d += String.fromCharCode(f) : (127 < f && 2048 > f ? d += String.fromCharCode(f >> 6 | 192) : (d += String.fromCharCode(f >> 12 | 224), d += String.fromCharCode(f >> 6 & 63 | 128)), d += String.fromCharCode(f & 63 | 128));
  }
  for (a = d;h < a.length;) {
    c = a.charCodeAt(h++), d = a.charCodeAt(h++), e = a.charCodeAt(h++), f = c >> 2, c = (c & 3) << 4 | d >> 4, g = (d & 15) << 2 | e >> 6, k = e & 63, isNaN(d) ? k = g = 64 : isNaN(e) && (k = 64), b = b + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(f) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(g) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(k);
  }
  return b;
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
  var c = document.querySelector('meta[property="og:' + a + '"]');
  c && c.content && (b = c.content);
  return b;
};
utils.prioritizeDeeplinkPaths = function(a, b) {
  if (!b || "object" !== typeof b || 0 === Object.keys(b).length) {
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
  for (var c = {hostedIOS:null, hostedAndroid:null, applinksIOS:null, applinksAndroid:null, twitterIOS:null, twitterAndroid:null}, d = 0;d < a.length;d++) {
    if ((a[d].getAttribute("name") || a[d].getAttribute("property")) && a[d].getAttribute("content")) {
      var e = a[d].getAttribute("name"), f = a[d].getAttribute("property"), e = e || f, f = e.split(":");
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
  var a;
  try {
    navigator.languages && 0 < navigator.languages.length ? a = navigator.languages[0] : navigator.language && (a = navigator.language), a = a.substring(0, 2).toUpperCase();
  } catch (b) {
    a = null;
  }
  return a;
};
utils.calculateDiffBetweenArrays = function(a, b) {
  var c = [];
  b.forEach(function(b) {
    -1 === a.indexOf(b) && c.push(b);
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
    a.products.forEach(function(a) {
      "object" !== typeof a && (e = commerceEventMessages.invalidProductType);
      d = d.concat(utils.calculateDiffBetweenArrays(b, Object.keys(a)));
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
  if (!a || "string" !== typeof a || -1 === validCommerceEvents.indexOf(a.toLowerCase())) {
    return commerceEventMessages.missingPurchaseEvent;
  }
  if (!b || "object" !== typeof b || 0 === Object.keys(b).length) {
    return commerceEventMessages.missingCommerceData;
  }
  var c = validateCommerceDataKeys(b);
  return c ? c : null;
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
  if (c) {
    if ("object" === typeof c && 0 === Object.keys(c).length) {
      return a;
    }
    a[b] = c;
  }
  return a;
};
utils.openGraphDataAsObject = function() {
  var a = {}, a = utils.addPropertyIfNotNull(a, "$og_title", utils.getOpenGraphContent("title")), a = utils.addPropertyIfNotNull(a, "$og_description", utils.getOpenGraphContent("description")), a = utils.addPropertyIfNotNull(a, "$og_image_url", utils.getOpenGraphContent("image"));
  return (a = utils.addPropertyIfNotNull(a, "$og_video", utils.getOpenGraphContent("video"))) && 0 < Object.keys(a).length ? a : null;
};
utils.getAdditionalMetadata = function() {
  var a = {}, a = utils.addPropertyIfNotNull(a, "og_data", utils.openGraphDataAsObject()), a = utils.addPropertyIfNotNull(a, "hosted_deeplink_data", utils.getHostedDeepLinkData()), a = utils.addPropertyIfNotNull(a, "title", utils.getTitle()), a = utils.addPropertyIfNotNull(a, "description", utils.getDescription());
  return (a = utils.addPropertyIfNotNull(a, "canonical_url", utils.getCanonicalURL())) && 0 < Object.keys(a).length ? a : {};
};
utils.removePropertiesFromObject = function(a, b) {
  if (a && "object" === typeof a && !Array.isArray(a) && 0 < Object.keys(a).length && b && Array.isArray(b) && 0 < b.length) {
    for (var c in a) {
      a.hasOwnProperty(c) && -1 < b.indexOf(c) && delete a[c];
    }
  }
};
var BRANCH_STANDARD_EVENTS = "ADD_TO_CART ADD_TO_WISHLIST VIEW_CART INITIATE_PURCHASE ADD_PAYMENT_INFO PURCHASE SPEND_CREDITS SEARCH VIEW_ITEM VIEW_ITEMS RATE SHARE COMPLETE_REGISTRATION COMPLETE_TUTORIAL ACHIEVE_LEVEL UNLOCK_ACHIEVEMENT".split(" "), BRANCH_STANDARD_EVENT_DATA = "transaction_id revenue currency shipping tax coupon affiliation search_query description".split(" ");
utils.isStandardEvent = function(a) {
  return -1 < BRANCH_STANDARD_EVENTS.indexOf(a);
};
utils.separateEventAndCustomData = function(a) {
  if (!a || 0 === Object.keys(a).length) {
    return null;
  }
  for (var b = utils.calculateDiffBetweenArrays(BRANCH_STANDARD_EVENT_DATA, Object.keys(a)), c = {}, d = 0;d < b.length;d++) {
    var e = b[d];
    c[e] = a[e];
    delete a[e];
  }
  return {custom_data:utils.convertObjectValuesToString(c), event_data:a};
};
utils.validateParameterType = function(a, b) {
  return a && b ? "array" === b ? Array.isArray(a) : typeof a === b && !Array.isArray(a) : !1;
};
utils.getUserData = function(a) {
  var b = {}, b = utils.addPropertyIfNotNull(b, "http_origin", document.URL), b = utils.addPropertyIfNotNull(b, "user_agent", navigator.userAgent), b = utils.addPropertyIfNotNull(b, "language", utils.getBrowserLanguageCode()), b = utils.addPropertyIfNotNull(b, "screen_width", screen.width), b = utils.addPropertyIfNotNull(b, "screen_height", screen.height), b = utils.addPropertyIfNotNull(b, "http_referrer", document.referrer), b = utils.addPropertyIfNotNull(b, "browser_fingerprint_id", a.browser_fingerprint_id), 
  b = utils.addPropertyIfNotNull(b, "developer_identity", a.identity), b = utils.addPropertyIfNotNull(b, "sdk", "web");
  return b = utils.addPropertyIfNotNull(b, "sdk_version", config.version);
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
utils.convertObjectValuesToString = function(a) {
  if (utils.validateParameterType(a, "object") && 0 !== Object.keys(a).length) {
    for (var b in a) {
      a.hasOwnProperty(b) && (a[b] = utils.validateParameterType(a[b], "object") || utils.validateParameterType(a[b], "array") ? safejson.stringify(a[b]) : a[b].toString());
    }
    return a;
  }
};
utils.mergeHostedDeeplinkData = function(a, b) {
  var c = a ? utils.merge({}, a) : {};
  return b && 0 < Object.keys(b).length ? 0 < Object.keys(c).length ? utils.merge(c, b) : utils.merge({}, b) : c;
};
utils.addNonceAttribute = function(a) {
  "" !== utils.nonce && a.setAttribute("nonce", utils.nonce);
};
// Input 6
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
      } else {
        if (b === validationTypes.ARRAY) {
          if (!(e instanceof Array)) {
            return utils.message(utils.messages.invalidType, [c, d, "an array"]);
          }
        } else {
          if (b === validationTypes.NUMBER) {
            if ("number" !== typeof e) {
              return utils.message(utils.messages.invalidType, [c, d, "a number"]);
            }
          } else {
            if (b === validationTypes.BOOLEAN) {
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
          }
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
var branch_id = /^[0-9]{15,20}$/;
function defaults(a) {
  var b = {browser_fingerprint_id:validator(!0, branch_id), identity_id:validator(!0, branch_id), sdk:validator(!0, validationTypes.STRING), session_id:validator(!0, branch_id)};
  return utils.merge(a, b);
}
resources.open = {destination:config.api_endpoint, endpoint:"/v1/open", method:utils.httpMethod.POST, params:{browser_fingerprint_id:validator(!1, branch_id), alternative_browser_fingerprint_id:validator(!1, branch_id), identity_id:validator(!1, branch_id), link_identifier:validator(!1, validationTypes.STRING), sdk:validator(!1, validationTypes.STRING), options:validator(!1, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), tracking_disabled:validator(!1, validationTypes.BOOLEAN)}};
resources._r = {destination:config.app_service_endpoint, endpoint:"/_r", method:utils.httpMethod.GET, jsonp:!0, params:{sdk:validator(!0, validationTypes.STRING), _t:validator(!1, branch_id), branch_key:validator(!0, validationTypes.STRING)}};
resources.linkClick = {destination:"", endpoint:"", method:utils.httpMethod.GET, queryPart:{link_url:validator(!0, validationTypes.STRING)}, params:{click:validator(!0, validationTypes.STRING)}};
resources.SMSLinkSend = {destination:config.link_service_endpoint, endpoint:"/c", method:utils.httpMethod.POST, queryPart:{link_url:validator(!0, validationTypes.STRING)}, params:{sdk:validator(!1, validationTypes.STRING), phone:validator(!0, validationTypes.STRING)}};
resources.getCode = {destination:config.api_endpoint, endpoint:"/v1/referralcode", method:utils.httpMethod.POST, params:defaults({amount:validator(!0, validationTypes.NUMBER), bucket:validator(!1, validationTypes.STRING), calculation_type:validator(!0, validationTypes.NUMBER), creation_source:validator(!0, validationTypes.NUMBER), expiration:validator(!1, validationTypes.STRING), location:validator(!0, validationTypes.NUMBER), prefix:validator(!1, validationTypes.STRING), type:validator(!0, validationTypes.STRING)})};
resources.validateCode = {destination:config.api_endpoint, endpoint:"/v1/referralcode", method:utils.httpMethod.POST, queryPart:{code:validator(!0, validationTypes.STRING)}, params:defaults({})};
resources.applyCode = {destination:config.api_endpoint, endpoint:"/v1/applycode", method:utils.httpMethod.POST, queryPart:{code:validator(!0, validationTypes.STRING)}, params:defaults({})};
resources.logout = {destination:config.api_endpoint, endpoint:"/v1/logout", method:utils.httpMethod.POST, params:defaults({session_id:validator(!0, branch_id)})};
resources.profile = {destination:config.api_endpoint, endpoint:"/v1/profile", method:utils.httpMethod.POST, params:defaults({identity_id:validator(!0, branch_id), identity:validator(!0, validationTypes.STRING)})};
resources.referrals = {destination:config.api_endpoint, endpoint:"/v1/referrals", method:utils.httpMethod.GET, queryPart:{identity_id:validator(!0, branch_id)}, params:defaults({})};
resources.creditHistory = {destination:config.api_endpoint, endpoint:"/v1/credithistory", method:utils.httpMethod.GET, params:defaults({begin_after_id:validator(!1, branch_id), bucket:validator(!1, validationTypes.STRING), direction:validator(!1, validationTypes.NUMBER), length:validator(!1, validationTypes.NUMBER), link_click_id:validator(!1, branch_id)})};
resources.credits = {destination:config.api_endpoint, endpoint:"/v1/credits", method:utils.httpMethod.GET, params:defaults({branch_key:validator(!0, validationTypes.STRING), identity:validator(!0, validationTypes.STRING)})};
resources.redeem = {destination:config.api_endpoint, endpoint:"/v1/redeem", method:utils.httpMethod.POST, params:defaults({amount:validator(!0, validationTypes.NUMBER), bucket:validator(!0, validationTypes.STRING), identity_id:validator(!0, branch_id)})};
resources.link = {destination:config.api_endpoint, endpoint:"/v1/url", method:utils.httpMethod.POST, ref:"obj", params:defaults({alias:validator(!1, validationTypes.STRING), campaign:validator(!1, validationTypes.STRING), channel:validator(!1, validationTypes.STRING), data:validator(!1, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), identity_id:validator(!0, branch_id), stage:validator(!1, validationTypes.STRING), tags:validator(!1, validationTypes.ARRAY), type:validator(!1, 
validationTypes.NUMBER), source:validator(!1, validationTypes.STRING), instrumentation:validator(!1, validationTypes.STRING)})};
resources.deepview = {destination:config.api_endpoint, endpoint:"/v1/deepview", jsonp:!0, method:utils.httpMethod.POST, params:defaults({campaign:validator(!1, validationTypes.STRING), _t:validator(!1, branch_id), channel:validator(!1, validationTypes.STRING), data:validator(!0, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), link_click_id:validator(!1, validationTypes.STRING), open_app:validator(!1, validationTypes.BOOLEAN), append_deeplink_path:validator(!1, validationTypes.BOOLEAN), 
stage:validator(!1, validationTypes.STRING), tags:validator(!1, validationTypes.ARRAY), deepview_type:validator(!0, validationTypes.STRING), source:validator(!0, validationTypes.STRING)})};
resources.hasApp = {destination:config.api_endpoint, endpoint:"/v1/has-app", method:utils.httpMethod.GET, params:{browser_fingerprint_id:validator(!0, branch_id), instrumentation:validator(!1, validationTypes.STRING)}};
resources.event = {destination:config.api_endpoint, endpoint:"/v1/event", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!0, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), tracking_disabled:validator(!1, validationTypes.BOOLEAN)})};
resources.commerceEvent = {destination:config.api_endpoint, endpoint:"/v1/event", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!1, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), commerce_data:validator(!0, validationTypes.OBJECT)})};
resources.logStandardEvent = {destination:config.api_endpoint, endpoint:"/v2/event/standard", method:utils.httpMethod.POST, params:{name:validator(!0, validationTypes.STRING), user_data:validator(!0, validationTypes.STRING), custom_data:validator(!1, validationTypes.STRING), event_data:validator(!1, validationTypes.STRING), content_items:validator(!1, validationTypes.STRING)}};
resources.logCustomEvent = {destination:config.api_endpoint, endpoint:"/v2/event/custom", method:utils.httpMethod.POST, params:{name:validator(!0, validationTypes.STRING), user_data:validator(!0, validationTypes.STRING), custom_data:validator(!1, validationTypes.STRING)}};
resources.pageview = {destination:config.api_endpoint, endpoint:"/v1/pageview", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!1, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), tracking_disabled:validator(!1, validationTypes.BOOLEAN), branch_view_id:validator(!1, validationTypes.STRING), no_journeys:validator(!1, validationTypes.BOOLEAN), user_language:validator(!1, validationTypes.STRING), open_app:validator(!1, 
validationTypes.BOOLEAN), has_app_websdk:validator(!1, validationTypes.BOOLEAN), source:validator(!1, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), is_iframe:validator(!1, validationTypes.BOOLEAN), data:validator(!1, validationTypes.OBJECT), callback_string:validator(!1, validationTypes.STRING), journey_displayed:validator(!1, validationTypes.BOOLEAN), audience_rule_id:validator(!1, validationTypes.STRING), journey_dismissals:validator(!1, validationTypes.OBJECT)})};
resources.dismiss = {destination:config.api_endpoint, endpoint:"/v1/dismiss", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!1, validationTypes.OBJECT), initial_referrer:validator(!1, validationTypes.STRING), tracking_disabled:validator(!1, validationTypes.BOOLEAN), branch_view_id:validator(!1, validationTypes.STRING), no_journeys:validator(!1, validationTypes.BOOLEAN), user_language:validator(!1, validationTypes.STRING), open_app:validator(!1, 
validationTypes.BOOLEAN), has_app_websdk:validator(!1, validationTypes.BOOLEAN), source:validator(!1, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), is_iframe:validator(!1, validationTypes.BOOLEAN), data:validator(!1, validationTypes.OBJECT), callback_string:validator(!1, validationTypes.STRING), journey_displayed:validator(!1, validationTypes.BOOLEAN), audience_rule_id:validator(!1, validationTypes.STRING), journey_dismissals:validator(!1, validationTypes.OBJECT)})};
// Input 7
var COOKIE_MS = 31536E6, BRANCH_KEY_PREFIX = "BRANCH_WEBSDK_KEY", storage, BranchStorage = function(a) {
  for (var b = 0;b < a.length;b++) {
    var c = this[a[b]], c = "function" === typeof c ? c() : c;
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
  var b;
  try {
    b = a && localStorage ? localStorage : sessionStorage;
  } catch (c) {
    return {isEnabled:function() {
      return !1;
    }};
  }
  return {getAll:function() {
    if ("undefined" === typeof b) {
      return null;
    }
    var a = null, d;
    for (d in b) {
      0 === d.indexOf(BRANCH_KEY_PREFIX) && (null === a && (a = {}), a[trimPrefix(d)] = retrieveValue(b.getItem(d)));
    }
    return a;
  }, get:function(a, d) {
    return retrieveValue(d && localStorage ? localStorage.getItem(prefix(a)) : b.getItem(prefix(a)));
  }, set:function(a, d, e) {
    e && localStorage ? localStorage.setItem(prefix(a), d) : b.setItem(prefix(a), d);
  }, remove:function(a, d) {
    d && localStorage ? localStorage.removeItem(prefix(a)) : b.removeItem(prefix(a));
  }, clear:function() {
    Object.keys(b).forEach(function(a) {
      0 === a.indexOf(BRANCH_KEY_PREFIX) && b.removeItem(a);
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
  var a = function(a, c) {
    c && (a = prefix(a));
    document.cookie = a + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
  };
  return {getAll:function() {
    for (var a = {}, c = document.cookie.split(";"), d = 0;d < c.length;d++) {
      var e = processCookie(c[d]);
      e && e.hasOwnProperty("name") && e.hasOwnProperty("value") && isBranchCookie(e.name) && (a[trimPrefix(e.name)] = e.value);
    }
    return a;
  }, get:function(a) {
    a = prefix(a);
    for (var b = document.cookie.split(";"), d = 0;d < b.length;d++) {
      var e = processCookie(b[d]);
      if (e && e.hasOwnProperty("name") && e.hasOwnProperty("value") && e.name === a) {
        return e.value;
      }
    }
    return null;
  }, set:function(a, c) {
    var b = prefix(a);
    document.cookie = b + "=" + c + "; path=/";
  }, remove:function(b) {
    a(b, !0);
  }, clear:function() {
    for (var b = document.cookie.split(";"), c = 0;c < b.length;c++) {
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
// Input 8
var session = {get:function(a, b) {
  try {
    return safejson.parse(a.get(b ? "branch_session_first" : "branch_session", b)) || null;
  } catch (c) {
    return null;
  }
}, set:function(a, b, c) {
  a.set("branch_session", goog.json.serialize(b));
  c && a.set("branch_session_first", goog.json.serialize(b), !0);
}, update:function(a, b) {
  if (b) {
    var c = session.get(a) || {}, c = utils.merge(c, b);
    a.set("branch_session", goog.json.serialize(c));
  }
}};
// Input 9
var Server = function() {
};
Server.prototype._jsonp_callback_index = 0;
Server.prototype.serializeObject = function(a, b) {
  if ("undefined" === typeof a) {
    return "";
  }
  var c = [];
  if (a instanceof Array) {
    for (var d = 0;d < a.length;d++) {
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
  var c, d, e = a.destination + a.endpoint, f = /^[0-9]{15,20}$/, g = /key_(live|test)_[A-Za-z0-9]{32}/, k = function(b, c) {
    "undefined" === typeof c && (c = {});
    if (b.branch_key && g.test(b.branch_key)) {
      return c.branch_key = b.branch_key, c;
    }
    if (b.app_id && f.test(b.app_id)) {
      return c.app_id = b.app_id, c;
    }
    if (b.instrumentation) {
      c.instrumentation = b.instrumentation;
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
  if ("POST" === a.method || "/v1/credithistory" === a.endpoint) {
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
  window[g] = function(a) {
    window.clearTimeout(h);
    d(null, a);
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
Server.prototype.XHRRequest = function(a, b, c, d, e, f) {
  var g = Date.now(), k = utils.currentRequestBrttTag, h = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
  h.ontimeout = function() {
    utils.addPropertyIfNotNull(utils.instrumentation, k, utils.calculateBrtt(g));
    e(Error(utils.messages.timeout), null, 504);
  };
  h.onerror = function(a) {
    e(Error(a.error || "Error in API: " + h.status), null, h.status);
  };
  h.onreadystatechange = function() {
    var a;
    if (4 === h.readyState) {
      if (utils.addPropertyIfNotNull(utils.instrumentation, k, utils.calculateBrtt(g)), 200 === h.status) {
        if (f) {
          a = h.responseText;
        } else {
          try {
            a = safejson.parse(h.responseText);
          } catch (m) {
            a = {};
          }
        }
        e(null, a, h.status);
      } else {
        if (402 === h.status) {
          e(Error("Not enough credits to redeem."), null, h.status);
        } else {
          if ("4" === h.status.toString().substring(0, 1) || "5" === h.status.toString().substring(0, 1)) {
            h.responseURL && h.responseURL.includes("v2/event") ? e(h.responseText, null, h.status) : e(Error("Error in API: " + h.status), null, h.status);
          }
        }
      }
    }
  };
  try {
    h.open(c, a, !0), h.timeout = utils.timeout, h.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), h.send(b);
  } catch (l) {
    d.set("use_jsonp", !0), this.jsonpRequest(a, b, c, e);
  }
};
Server.prototype.request = function(a, b, c, d) {
  var e = this;
  utils.currentRequestBrttTag = "/v1/pageview" === a.endpoint && b && b.journey_displayed ? a.endpoint + "-1-brtt" : a.endpoint + "-brtt";
  ("/v1/url" === a.endpoint || "/v1/has-app" === a.endpoint) && 1 < Object.keys(utils.instrumentation).length && (delete utils.instrumentation["-brtt"], b.instrumentation = safejson.stringify(utils.merge({}, utils.instrumentation)), utils.instrumentation = {});
  if (utils.userPreferences.trackingDisabled) {
    for (var f = ["browser_fingerprint_id", "alternative_browser_fingerprint_id", "identity_id", "session_id"], g = 0;g < f.length;g++) {
      b.hasOwnProperty(f[g]) && delete b[f[g]];
    }
  }
  f = this.getUrl(a, b);
  if (f.error) {
    return d(Error(safejson.stringify({message:f.error, endpoint:a.endpoint, data:b})));
  }
  var k, h = "";
  "GET" === a.method ? k = f.url + "?" + f.data : (k = f.url, h = f.data);
  var l = utils.retries, m = function(a, b, c) {
    a && 0 < l && "5" === (c || "").toString().substring(0, 1) ? (l--, window.setTimeout(function() {
      n();
    }, utils.retry_delay)) : d(a, b);
  };
  if (utils.userPreferences.trackingDisabled && utils.userPreferences.shouldBlockRequest(k, b)) {
    return utils.userPreferences.allowErrorsInCallback ? m(Error(utils.messages.trackingDisabled), null, 300) : m(null, {}, 200);
  }
  var n = function() {
    c.get("use_jsonp") || a.jsonp ? e.jsonpRequest(k, b, a.method, m) : e.XHRRequest(k, h, a.method, c, m);
  };
  n();
};
// Input 10
var banner_utils = {animationSpeed:250, animationDelay:20, bannerHeight:"76px", error_timeout:2000, success_timeout:3000, removeElement:function(a) {
  a && a.parentNode.removeChild(a);
}, hasClass:function(a, b) {
  return !!a.className.match(new RegExp("(\\s|^)" + b + "(\\s|$)"));
}, addClass:function(a, b) {
  a && !banner_utils.hasClass(a, b) && (a.className += " " + b);
}, removeClass:function(a, b) {
  a && banner_utils.hasClass(a, b) && (a.className = a.className.replace(new RegExp("(\\s|^)" + b + "(\\s|$)"), " "));
}, getDate:function(a) {
  var b = new Date;
  return b.setDate(b.getDate() + a);
}, getBodyStyle:function(a) {
  return document.body.currentStyle ? document.body.currentStyle[utils.snakeToCamel(a)] : window.getComputedStyle(document.body).getPropertyValue(a);
}, addCSSLengths:function(a, b) {
  var c = function(a) {
    if (!a) {
      return 0;
    }
    var b = a.replace(/[0-9,\.]/g, "");
    a = a.match(/\d+/g);
    var d = parseInt(0 < a.length ? a[0] : "0", 10), g = function() {
      return Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / 100;
    }, k = function() {
      return Math.max(document.documentElement.clientHeight, window.innerHeight || 0) / 100;
    };
    return parseInt({px:function(a) {
      return a;
    }, em:function(a) {
      return document.body.currentStyle ? a * c(document.body.currentStyle.fontSize) : a * parseFloat(window.getComputedStyle(document.body).fontSize);
    }, rem:function(a) {
      return document.documentElement.currentStyle ? a * c(document.documentElement.currentStyle.fontSize) : a * parseFloat(window.getComputedStyle(document.documentElement).fontSize);
    }, vw:function(a) {
      return a * g();
    }, vh:function(a) {
      return a * k();
    }, vmin:function(a) {
      return a * Math.min(k(), g());
    }, vmax:function(a) {
      return a * Math.max(k(), g());
    }, "%":function() {
      return document.body.clientWidth / 100 * d;
    }}[b](d), 10);
  };
  return (c(a) + c(b)).toString() + "px";
}, shouldAppend:function(a, b) {
  var c = a.get("hideBanner", !0);
  if (b.respectDNT && navigator && Number(navigator.doNotTrack)) {
    return !1;
  }
  try {
    "string" === typeof c && (c = safejson.parse(c));
  } catch (e) {
    c = !1;
  }
  var c = "number" === typeof c ? new Date >= new Date(c) : !c, d = b.forgetHide;
  "number" === typeof d && (d = !1);
  return !document.getElementById("branch-banner") && !document.getElementById("branch-banner-iframe") && (c || d) && (b.showDesktop && !utils.mobileUserAgent() || b.showAndroid && "android" === utils.mobileUserAgent() || b.showiPad && "ipad" === utils.mobileUserAgent() || b.showiOS && "ios" === utils.mobileUserAgent() || b.showBlackberry && "blackberry" === utils.mobileUserAgent() || b.showWindowsPhone && "windows_phone" === utils.mobileUserAgent() || b.showKindle && "kindle" === utils.mobileUserAgent());
}};
// Input 11
var banner_css = {banner:function(a) {
  return ".branch-banner-is-active { -webkit-transition: all " + 1.5 * banner_utils.animationSpeed / 1000 + "s ease; transition: all 0" + 1.5 * banner_utils.animationSpeed / 1000 + "s ease; }\n#branch-banner { width:100%; z-index: 99999; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all " + banner_utils.animationSpeed / 1000 + "s ease; transition: all 0" + banner_utils.animationSpeed / 
  1000 + "s ease; }\n#branch-banner .button{ border: 1px solid " + (a.buttonBorderColor || ("dark" === a.theme ? "transparent" : "#ccc")) + "; background: " + (a.buttonBackgroundColor || "#fff") + "; color: " + (a.buttonFontColor || "#000") + "; cursor: pointer; margin-top: 0px; font-size: 14px; display: inline-block; margin-left: 5px; font-weight: 400; text-decoration: none;  border-radius: 4px; padding: 6px 12px; transition: all .2s ease;}\n#branch-banner .button:hover {  border: 1px solid " + 
  (a.buttonBorderColorHover || ("dark" === a.theme ? "transparent" : "#BABABA")) + "; background: " + (a.buttonBackgroundColorHover || "#E0E0E0") + "; color: " + (a.buttonFontColorHover || "#000") + ";}\n#branch-banner .button:focus { outline: none; }\n#branch-banner * { margin-right: 4px; position: relative; line-height: 1.2em; }\n#branch-banner-close { font-weight: 400; cursor: pointer; float: left; z-index: 2;padding: 0 5px 0 5px; margin-right: 0; }\n#branch-banner .content { width:100%; overflow: hidden; height: " + 
  banner_utils.bannerHeight + "; background: rgba(255, 255, 255, 0.95); color: #333; " + ("top" === a.position ? "border-bottom" : "border-top") + ': 1px solid #ddd; }\n#branch-banner-close { color: #000; font-size: 24px; top: 14px; opacity: .5; transition: opacity .3s ease; }\n#branch-banner-close:hover { opacity: 1; }\n#branch-banner .title { font-size: 18px; font-weight:bold; color: #555; }\n#branch-banner .description { font-size: 12px; font-weight: normal; color: #777; max-height: 30px; overflow: hidden; }\n#branch-banner .icon { float: left; padding-bottom: 40px; margin-right: 10px; margin-left: 5px; }\n#branch-banner .icon img { width: 63px; height: 63px; margin-right: 0; }\n#branch-banner .reviews { font-size:13px; margin: 1px 0 3px 0; color: #777; }\n#branch-banner .reviews .star { display:inline-block; position: relative; margin-right:0; }\n#branch-banner .reviews .star span { display: inline-block; margin-right: 0; color: #555; position: absolute; top: 0; left: 0; }\n#branch-banner .reviews .review-count { font-size:10px; }\n#branch-banner .reviews .star .half { width: 50%; overflow: hidden; display: block; }\n#branch-banner .content .left { padding: 6px 5px 6px 5px; }\n#branch-banner .vertically-align-middle { top: 50%; transform: translateY(-50%); -webkit-transform: translateY(-50%); -ms-transform: translateY(-50%); }\n#branch-banner .details > * { display: block; }\n#branch-banner .content .left { height: 63px; }\n#branch-banner .content .right { float: right; height: 63px; margin-bottom: 50px; padding-top: 22px; z-index: 1; }\n#branch-banner .right > div { float: left; }\n#branch-banner-action { top: 17px; }\n#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }\n#branch-banner .theme-dark.content { background: rgba(51, 51, 51, 0.95); }\n#branch-banner .theme-dark #branch-banner-close{ color: #fff; text-shadow: 0 1px 1px rgba(0, 0, 0, .15); }\n#branch-banner .theme-dark .details { text-shadow: 0 1px 1px rgba(0, 0, 0, .15); }\n#branch-banner .theme-dark .title { color: #fff; }\n#branch-banner .theme-dark .description { color: #fff; }\n#branch-banner .theme-dark .reviews { color: #888; }\n#branch-banner .theme-dark .reviews .star span{ color: #fff; }\n#branch-banner .theme-dark .reviews .review-count{ color: #fff; }\n';
}, desktop:"#branch-banner { position: fixed; min-width: 600px; }\n#branch-sms-block * { vertical-align: bottom; font-size: 15px; }\n#branch-sms-block { display: inline-block; }\n#branch-banner input{ border: 1px solid #ccc;  font-weight: 400;  border-radius: 4px; height: 30px; padding: 5px 7px 4px; width: 145px; font-size: 14px;}\n#branch-banner input:focus { outline: none; }\n#branch-banner input.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }\n#branch-banner .branch-icon-wrapper { width:25px; height: 25px; vertical-align: middle; display: inline-block; margin-top: -18px; }\n@keyframes branch-spinner { 0% { transform: rotate(0deg); -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); } 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg); -ms-transform: rotate(360deg); } }\n@-webkit-keyframes branch-spinner { 0% { transform: rotate(0deg); -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); } 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg); -ms-transform: rotate(360deg); } }\n#branch-spinner { -webkit-animation: branch-spinner 1s ease-in-out infinite; animation: branch-spinner 1s ease-in-out infinite; transition: all 0.7s ease-in-out; border:2px solid #ddd; border-bottom-color:#428bca; width:80%; height:80%; border-radius:50%; -webkit-font-smoothing: antialiased !important; }\n#branch-banner .theme-dark input { border-color: transparent; }\n", 
nonie:"#branch-banner .checkmark { stroke: #428bca; stroke-dashoffset: 745.74853515625; stroke-dasharray: 745.74853515625; -webkit-animation: dash 2s ease-out forwards; animation: dash 2s ease-out forwards; }\n@-webkit-keyframes dash { 0% { stroke-dashoffset: 745.748535 15625; } 100% { stroke-dashoffset: 0; } }\n@keyframes dash { 0% { stroke-dashoffset: 745.74853515625; } 100% { stroke-dashoffset: 0; } }\n", ie:"#branch-banner .checkmark { color: #428bca; font-size: 22px; }\n", mobile:"#branch-banner { position: absolute; }\n#branch-banner .content .left .details .title { font-size: 12px; }\n#branch-mobile-action { white-space: nowrap; }\n#branch-banner .content .left .details .description { font-size: 11px; font-weight: normal; }\n@media only screen and (min-device-width: 320px) and (max-device-width: 350px) { #branch-banner .content .right { max-width: 120px; } }\n@media only screen and (min-device-width: 351px) and (max-device-width: 400px) and (orientation: landscape) { #branch-banner .content .right { max-width: 150px; } }\n@media only screen and (min-device-width: 401px) and (max-device-width: 480px) and (orientation: landscape) { #branch-banner .content .right { max-width: 180px; } }\n", 
ios:"", android:"#branch-banner #branch-banner-close,#branch-banner .theme-dark #branch-banner-close { height:17px; width: 17px; text-align: center; font-size: 15px; top: 24px;  border-radius:14px; border:0; line-height:14px; color:#b1b1b3; background:#efefef; padding: 0; opacity: 1; }\n#branch-banner .button { top: 0; text-decoration:none; border-bottom: 3px solid #A4C639; padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; margin-top: 2px;  font-weight: bold; background-color: #A4C639; border-radius: 5px; }\n#branch-banner .button:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }\n", 
blackberry:"", windows_phone:"", kindle:""};
banner_css.iframe = "body { -webkit-transition: all " + 1.5 * banner_utils.animationSpeed / 1000 + "s ease; transition: all 0" + 1.5 * banner_utils.animationSpeed / 1000 + "s ease; }\n#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%; left: 0; right: 0; border: 0; height: " + banner_utils.bannerHeight + "; z-index: 99999; -webkit-transition: all " + banner_utils.animationSpeed / 1000 + "s ease; transition: all 0" + banner_utils.animationSpeed / 1000 + "s ease; }\n";
banner_css.inneriframe = "body { margin: 0; }\n";
banner_css.iframe_position = function(a, b) {
  return "#branch-banner-iframe { position: " + ("top" !== b || a ? "fixed" : "absolute") + "; }\n";
};
banner_css.css = function(a, b) {
  var c = banner_css.banner(a), d = utils.mobileUserAgent();
  "ios" !== d && "ipad" !== d || !a.showiOS ? "android" === d && a.showAndroid ? c += banner_css.mobile + banner_css.android : "blackberry" === d && a.showBlackberry ? c += banner_css.mobile + banner_css.blackberry : "windows_phone" === d && a.showWindowsPhone ? c += banner_css.mobile + banner_css.windows_phone : "kindle" === d && a.showKindle ? c += banner_css.mobile + banner_css.kindle : (c += banner_css.desktop, c = window.ActiveXObject ? c + banner_css.ie : c + banner_css.nonie) : c += banner_css.mobile + 
  banner_css.ios;
  c += a.customCSS;
  a.iframe && (c += banner_css.inneriframe, d = document.createElement("style"), d.type = "text/css", d.id = "branch-iframe-css", utils.addNonceAttribute(d), d.innerHTML = banner_css.iframe + (utils.mobileUserAgent() ? banner_css.iframe_position(a.mobileSticky, a.position) : banner_css.iframe_position(a.desktopSticky, a.position)), (document.head || document.getElementsByTagName("head")[0]).appendChild(d));
  d = document.createElement("style");
  d.type = "text/css";
  d.id = "branch-css";
  d.innerHTML = c;
  utils.addNonceAttribute(d);
  c = a.iframe ? b.contentWindow.document : document;
  (c = c.head || c.getElementsByTagName("head")[0]) && "function" === typeof c.appendChild && c.appendChild(d);
  "top" === a.position ? b.style.top = "-" + banner_utils.bannerHeight : "bottom" === a.position && (b.style.bottom = "-" + banner_utils.bannerHeight);
};
// Input 12
var banner_html = {banner:function(a, b) {
  var c = '<div class="content' + (a.theme ? " theme-" + a.theme : "") + '"><div class="right">' + b + '</div><div class="left">' + (a.disableHide ? "" : '<div id="branch-banner-close" class="branch-animation" aria-label="Close">&times;</div>') + '<div class="icon"><img src="' + a.icon + '" alt="Application icon"></div><div class="details vertically-align-middle"><div class="title">' + a.title + "</div>", d;
  if (a.rating || a.reviewCount) {
    if (a.rating) {
      d = "";
      for (var e = 0;5 > e;e++) {
        d += '<span class="star"><svg class="star" fill="#555555" height="12" viewBox="3 2 20 19" width="12"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/><path d="M0 0h24v24H0z" fill="none"/><foreignObject display="none"><span class="star">\u2606</span></foreignObject></svg>', a.rating > e && (d += e + 1 > a.rating && a.rating % 1 ? '<span class="half"><svg fill="#555555" height="12" viewBox="3 2 20 19" width="12"><defs><path d="M0 0h24v24H0V0z" id="a"/></defs><clipPath id="b"><use overflow="visible" xlink:href="#a"/></clipPath><path clip-path="url(#b)" d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg><foreignObject display="none"><span class="half">\u2605</span></foreignObject></span>' : 
        '<span class="full"><svg fill="#555555" height="12" viewBox="3 2 20 19" width="12"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/><path d="M0 0h24v24H0z" fill="none"/><foreignObject display="none"><span class="full">\u2605</span></foreignObject></svg> </span>'), d += "</span>";
      }
      d = '<span class="stars">' + d + "</span>";
    } else {
      d = "";
    }
    d = '<div class="reviews">' + d + (a.reviewCount ? '<span class="review-count">' + a.reviewCount + "</span>" : "") + "</div>";
  } else {
    d = "";
  }
  return c + d + '<div class="description">' + a.description + "</div></div></div></div>";
}, mobileAction:function(a, b) {
  return '<a id="branch-mobile-action" class="button" href="#" target="_parent">' + ((session.get(b) || {}).has_app ? a.openAppButtonText : a.downloadAppButtonText) + "</a>";
}, desktopAction:function(a) {
  return '<div class="branch-icon-wrapper" id="branch-loader-wrapper" style="opacity: 0;"><div id="branch-spinner"></div></div><div id="branch-sms-block"><form id="sms-form"><input type="phone" aria-label="Enter phone number" class="branch-animation" name="branch-sms-phone" id="branch-sms-phone" placeholder="' + a.phonePreviewText + '"><button type="submit" id="branch-sms-send" class="branch-animation button">' + a.sendLinkText + "</button></form></div>";
}, checkmark:function() {
  return window.ActiveXObject ? '<span class="checkmark">&#x2713;</span>' : '<svg version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 98.5 98.5" enable-background="new 0 0 98.5 98.5" xml:space="preserve"><path class="checkmark" fill="none" stroke-width="8" stroke-miterlimit="10" d="M81.7,17.8C73.5,9.3,62,4,49.2,4C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"/></svg>';
}, iframe:function(a, b) {
  var c = document.createElement("iframe");
  c.src = "about:blank";
  c.style.overflow = "hidden";
  c.scrolling = "no";
  c.id = "branch-banner-iframe";
  c.className = "branch-animation";
  utils.addNonceAttribute(c);
  document.body.appendChild(c);
  var d = utils.mobileUserAgent(), d = '<html><head></head><body class="' + ("ios" === d || "ipad" === d ? "branch-banner-ios" : "android" === d ? "branch-banner-android" : "branch-banner-desktop") + '"><div id="branch-banner" class="branch-animation">' + banner_html.banner(a, b) + "</body></html>";
  c.contentWindow.document.open();
  c.contentWindow.document.write(d);
  c.contentWindow.document.close();
  return c;
}, div:function(a, b) {
  var c = document.createElement("div");
  c.id = "branch-banner";
  c.className = "branch-animation";
  c.innerHTML = banner_html.banner(a, b);
  document.body.appendChild(c);
  return c;
}, markup:function(a, b) {
  var c = '<div id="branch-sms-form-container">' + (utils.mobileUserAgent() ? banner_html.mobileAction(a, b) : banner_html.desktopAction(a)) + "</div>";
  return a.iframe ? banner_html.iframe(a, c) : banner_html.div(a, c);
}};
// Input 13
var sendSMS = function(a, b, c, d) {
  var e = a.getElementById("branch-sms-phone"), f = a.getElementById("branch-sms-send"), g = a.getElementById("branch-loader-wrapper"), k = a.getElementById("branch-sms-form-container"), h, l = function() {
    f.removeAttribute("disabled");
    e.removeAttribute("disabled");
    f.style.opacity = "1";
    e.style.opacity = "1";
    g.style.opacity = "0";
  }, m = function() {
    h = a.createElement("div");
    h.className = "branch-icon-wrapper";
    h.id = "branch-checkmark";
    h.style = "opacity: 0;";
    h.innerHTML = banner_html.checkmark();
    k.appendChild(h);
    f.style.opacity = "0";
    e.style.opacity = "0";
    g.style.opacity = "0";
    setTimeout(function() {
      h.style.opacity = "1";
    }, banner_utils.animationDelay);
    e.value = "";
  }, n = function() {
    l();
    f.style.background = "#FFD4D4";
    e.className = "error";
    setTimeout(function() {
      f.style.background = "#FFFFFF";
      e.className = "";
    }, banner_utils.error_timeout);
  };
  if (e) {
    var p = e.value;
    /^\d{7,}$/.test(p.replace(/[\s()+\-\.]|ext/gi, "")) ? (b._publishEvent("willSendBannerSMS"), f.setAttribute("disabled", ""), e.setAttribute("disabled", ""), f.style.opacity = ".4", e.style.opacity = ".4", g.style.opacity = "1", e.className = "", b.sendSMS(p, d, c, function(a) {
      a ? (b._publishEvent("sendBannerSMSError"), n()) : (b._publishEvent("didSendBannerSMS"), m(), setTimeout(function() {
        k.removeChild(h);
        l();
      }, banner_utils.success_timeout));
    })) : n();
  }
}, banner = function(a, b, c, d) {
  function e() {
    "top" === b.position ? f.style.top = "0" : "bottom" === b.position && (f.style.bottom = "0");
    a._publishEvent("didShowBanner");
  }
  if (!banner_utils.shouldAppend(d, b)) {
    return a._publishEvent("willNotShowBanner"), null;
  }
  a._publishEvent("willShowBanner");
  var f = banner_html.markup(b, d);
  banner_css.css(b, f);
  c.channel = c.channel || "app banner";
  var g = b.iframe ? f.contentWindow.document : document;
  if (utils.mobileUserAgent()) {
    b.open_app = b.open_app;
    b.append_deeplink_path = b.append_deeplink_path;
    b.make_new_link = b.make_new_link;
    b.deepview_type = "banner";
    a.deepview(c, b);
    var k = g.getElementById("branch-mobile-action");
    k && (k.onclick = function(b) {
      b.preventDefault();
      a.deepviewCta();
    });
  } else {
    g.getElementById("sms-form") ? g.getElementById("sms-form").addEventListener("submit", function(d) {
      d.preventDefault();
      sendSMS(g, a, b, c);
    }) : f.onload = function() {
      g = f.contentWindow.document;
      g.getElementById("sms-form") && g.getElementById("sms-form").addEventListener("submit", function(d) {
        d.preventDefault();
        sendSMS(g, a, b, c);
      });
    };
  }
  var k = banner_utils.getBodyStyle("margin-top"), h = document.body.style.marginTop, l = banner_utils.getBodyStyle("margin-bottom"), m = document.body.style.marginBottom, n = g.getElementById("branch-banner-close"), p = function(a, c) {
    "function" === typeof a && (c = a, a = {});
    a = a || {};
    "top" === b.position ? f.style.top = "-" + banner_utils.bannerHeight : "bottom" === b.position && (f.style.bottom = "-" + banner_utils.bannerHeight);
    "number" === typeof b.forgetHide ? d.set("hideBanner", banner_utils.getDate(b.forgetHide), !0) : d.set("hideBanner", !0, !0);
    a.immediate ? ("top" === b.position ? document.body.style.marginTop = h : "bottom" === b.position && (document.body.style.marginBottom = m), banner_utils.removeClass(document.body, "branch-banner-is-active"), banner_utils.removeElement(f), banner_utils.removeElement(document.getElementById("branch-css")), c()) : (setTimeout(function() {
      banner_utils.removeElement(f);
      banner_utils.removeElement(document.getElementById("branch-css"));
      c();
    }, banner_utils.animationSpeed + banner_utils.animationDelay), setTimeout(function() {
      "top" === b.position ? document.body.style.marginTop = h : "bottom" === b.position && (document.body.style.marginBottom = m);
      banner_utils.removeClass(document.body, "branch-banner-is-active");
    }, banner_utils.animationDelay));
  };
  n && (n.onclick = function(b) {
    b.preventDefault();
    a._publishEvent("willCloseBanner");
    p({}, function() {
      a._publishEvent("didCloseBanner");
    });
  });
  banner_utils.addClass(document.body, "branch-banner-is-active");
  "top" === b.position ? document.body.style.marginTop = banner_utils.addCSSLengths(banner_utils.bannerHeight, k) : "bottom" === b.position && (document.body.style.marginBottom = banner_utils.addCSSLengths(banner_utils.bannerHeight, l));
  b.immediate ? e() : setTimeout(e, banner_utils.animationDelay);
  return p;
};
// Input 14
var journeys_utils = {_callback_index:1, position:"top", sticky:"absolute", bannerHeight:"76px", isFullPage:!1, isHalfPage:!1, divToInjectParents:[]};
journeys_utils.windowHeight = window.innerHeight;
journeys_utils.windowWidth = window.innerWidth;
window.innerHeight < window.innerWidth && (journeys_utils.windowHeight = window.innerWidth, journeys_utils.windowWidth = window.innerHeight);
journeys_utils.bodyMarginTop = 0;
journeys_utils.bodyMarginBottom = 0;
journeys_utils.jsonRe = /<script type="application\/json">((.|\s)*?)<\/script>/;
journeys_utils.jsRe = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
journeys_utils.cssRe = /<style type="text\/css" id="branch-css">((.|\s)*?)<\/style>/;
journeys_utils.spacerRe = /#branch-banner-spacer {((.|\s)*?)}/;
journeys_utils.findMarginRe = /margin-bottom: (.*?);/;
journeys_utils.journeyLinkDataRe = /<script id="journeyLinkData" type="application\/json">((.|\s)*?)<\/script>/;
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
journeys_utils.setPositionAndHeight = function(a) {
  var b = journeys_utils.getMetadata(a);
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
  if (-1 !== journeys_utils.bannerHeight.indexOf("vh") || -1 !== journeys_utils.bannerHeight.indexOf("%")) {
    a = journeys_utils.bannerHeight.indexOf("vh") ? journeys_utils.bannerHeight.slice(0, -2) : journeys_utils.bannerHeight.slice(0, -1), journeys_utils.bannerHeight = a / 100 * journeys_utils.windowHeight + "px", 100 > a ? journeys_utils.isHalfPage = !0 : journeys_utils.isFullPage = !0;
  }
};
journeys_utils.getMetadata = function(a) {
  if (a = a.match(journeys_utils.jsonRe)) {
    return safejson.parse(a[1]);
  }
};
journeys_utils.getCtaText = function(a, b) {
  var c;
  b && a && a.ctaText && a.ctaText.has_app ? c = a.ctaText.has_app : a && a.ctaText && a.ctaText.no_app && (c = a.ctaText.no_app);
  return c;
};
journeys_utils.findInsertionDiv = function(a, b) {
  journeys_utils.divToInjectParents = [];
  if (b && b.injectorSelector) {
    var c = document.querySelectorAll(b.injectorSelector);
    if (c) {
      for (var d = 0;d < c.length;d++) {
        journeys_utils.divToInjectParents.push(c[d].parentElement);
      }
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
  var b = a.match(journeys_utils.jsonRe), c = a.match(journeys_utils.jsRe), d = a.match(journeys_utils.cssRe), e = a.match(journeys_utils.journeyLinkDataRe);
  b && (a = a.replace(journeys_utils.jsonRe, ""));
  c && (a = a.replace(journeys_utils.jsRe, ""));
  d && (a = a.replace(journeys_utils.cssRe, ""));
  e && (a = a.replace(journeys_utils.journeyLinkDataRe, ""));
  return a;
};
journeys_utils.createAndAppendIframe = function() {
  var a = document.createElement("iframe");
  a.src = "about:blank";
  a.style.overflow = "hidden";
  a.scrolling = "no";
  a.id = "branch-banner-iframe";
  a.className = "branch-animation";
  a.title = "Branch Banner";
  a.setAttribute("aria-label", "Branch Banner");
  utils.addNonceAttribute(a);
  document.body.appendChild(a);
  return a;
};
journeys_utils.createIframeInnerHTML = function(a, b) {
  return '<html><head></head><body class="' + ("ios" === b || "ipad" === b ? "branch-banner-ios" : "android" === b ? "branch-banner-android" : "branch-banner-desktop") + '">' + a + "</body></html>";
};
journeys_utils.addHtmlToIframe = function(a, b) {
  a.contentWindow.document.open();
  a.contentWindow.document.write(b);
  a.contentWindow.document.close();
};
journeys_utils.addIframeOuterCSS = function() {
  var a = document.createElement("style");
  a.type = "text/css";
  a.id = "branch-iframe-css";
  journeys_utils.bodyMarginTop = banner_utils.getBodyStyle("margin-top");
  var b = +journeys_utils.bodyMarginTop.slice(0, -2);
  journeys_utils.bodyMarginBottom = banner_utils.getBodyStyle("margin-bottom");
  var c = +journeys_utils.bodyMarginBottom.slice(0, -2), d = +journeys_utils.bannerHeight.slice(0, -2);
  "top" === journeys_utils.position ? document.body.style.marginTop = (+d + b).toString() + "px" : "bottom" === journeys_utils.position && (document.body.style.marginBottom = (+d + c).toString() + "px");
  0 < journeys_utils.divToInjectParents.length && journeys_utils.divToInjectParents.forEach(function(a) {
    var b, c = window.getComputedStyle(a);
    c && (b = journeys_utils.isFullPage && "fixed" === c.getPropertyValue("position"));
    b || (a.style.marginTop = journeys_utils.bannerHeight);
  });
  "top" === journeys_utils.previousPosition && journeys_utils.previousPosition !== journeys_utils.position && journeys_utils.exitAnimationDisabledPreviously && journeys_utils.previousDivToInjectParents && 0 < journeys_utils.previousDivToInjectParents.length && journeys_utils.previousDivToInjectParents.forEach(function(a) {
    a.style.marginTop = 0;
  });
  journeys_utils.exitAnimationDisabledPreviously = !1;
  journeys_utils.previousPosition = "";
  journeys_utils.previousDivToInjectParents = [];
  journeys_utils.journeyDismissed = !1;
  a.innerHTML = generateIframeOuterCSS();
  utils.addNonceAttribute(a);
  document.head.appendChild(a);
};
function generateIframeOuterCSS() {
  var a = "", b = "";
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
  var d = a.contentWindow.document;
  d.head.appendChild(c);
  if (journeys_utils.isHalfPage || journeys_utils.isFullPage) {
    var e = d.getElementsByClassName("branch-banner-content")[0];
    e && (e.style.height = journeys_utils.bannerHeight);
  }
  "top" === journeys_utils.position ? a.style.top = "-" + journeys_utils.bannerHeight : "bottom" === journeys_utils.position && (a.style.bottom = "-" + journeys_utils.bannerHeight);
  try {
    var e = d.getElementsByClassName("branch-banner-content")[0], f = window.getComputedStyle(e).getPropertyValue("background-color").split(", ");
    f[3] && 0 === parseFloat(f[3]) && (a.style.boxShadow = "none");
  } catch (g) {
  }
};
journeys_utils.addDynamicCtaText = function(a, b) {
  a.contentWindow.document.getElementById("branch-mobile-action").innerHTML = b;
};
journeys_utils.animateBannerEntrance = function(a) {
  banner_utils.addClass(document.body, "branch-banner-is-active");
  journeys_utils.isFullPage && "fixed" === journeys_utils.sticky && banner_utils.addClass(document.body, "branch-banner-no-scroll");
  setTimeout(function() {
    "top" === journeys_utils.position ? a.style.top = "0" : "bottom" === journeys_utils.position && (a.style.bottom = "0");
    journeys_utils.branch._publishEvent("didShowJourney", journeys_utils.journeyLinkData);
    journeys_utils.isJourneyDisplayed = !0;
  }, journeys_utils.animationDelay);
};
journeys_utils._addSecondsToDate = function(a) {
  var b = new Date;
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
    Array.prototype.forEach.call(h, function(a) {
      a.addEventListener("click", function(a) {
        journeys_utils.branch._publishEvent("didClickJourneyCTA", journeys_utils.journeyLinkData);
        journeys_utils.journeyDismissed = !0;
        d();
        journeys_utils.animateBannerExit(e);
      });
    });
    journeys_utils._setupDismissBehavior(".branch-banner-continue", "didClickJourneyContinue", c, e, a, b, f, g, k);
    journeys_utils._setupDismissBehavior(".branch-banner-close", "didClickJourneyClose", c, e, a, b, f, g, k);
  }
};
journeys_utils._setupDismissBehavior = function(a, b, c, d, e, f, g, k, h) {
  a = d.contentWindow.document.querySelectorAll(a);
  Array.prototype.forEach.call(a, function(a) {
    a.addEventListener("click", function(a) {
      journeys_utils._handleJourneyDismiss(b, c, d, e, f, g, k, h);
    });
  });
};
journeys_utils._setJourneyDismiss = function(a, b, c) {
  var d = a.get("journeyDismissals", !0), d = d ? safejson.parse(d) : {};
  d[c] = {view_id:b, dismiss_time:Date.now()};
  a.set("journeyDismissals", safejson.stringify(d), !0);
  return d;
};
journeys_utils._getDismissRequestData = function(a) {
  var b = {}, c = utils.getHostedDeepLinkData();
  c && 0 < Object.keys(c).length && (b.hosted_deeplink_data = c);
  return a._getPageviewRequestData(journeys_utils._getPageviewMetadata(null, b), null, journeys_utils.branch, !0);
};
journeys_utils._handleJourneyDismiss = function(a, b, c, d, e, f, g, k) {
  var h = g ? 0 : journeys_utils._findGlobalDismissPeriod(f);
  journeys_utils.branch._publishEvent(a, journeys_utils.journeyLinkData);
  journeys_utils.journeyDismissed = !0;
  journeys_utils.animateBannerExit(c);
  if (!g) {
    if (void 0 !== h && b.set("globalJourneysDismiss", h, !0), journeys_utils._setJourneyDismiss(b, d, e), f.dismissRedirect) {
      window.location = f.dismissRedirect;
    } else {
      var l = function() {
        journeys_utils.branch.removeListener(l);
        var a = journeys_utils._getDismissRequestData(k);
        journeys_utils.branch._api(resources.dismiss, a, function(b, c) {
          !b && "object" === typeof c && c.template && k.shouldDisplayJourney(c, null, !1) && k.displayJourney(c.template, a, a.branch_view_id || c.event_data.branch_view_data.id, c.event_data.branch_view_data, !1);
        });
      };
      journeys_utils.branch.addListener("branch_internal_event_didCloseJourney", l);
    }
  }
};
journeys_utils._getPageviewMetadata = function(a, b) {
  return utils.merge({url:a && a.url || utils.getWindowLocation(), user_agent:navigator.userAgent, language:navigator.language, screen_width:screen.width || -1, screen_height:screen.height || -1}, b || {});
};
journeys_utils.animateBannerExit = function(a, b) {
  if (journeys_utils.entryAnimationDisabled && !journeys_utils.exitAnimationDisabled) {
    document.body.style.transition = "all 0" + 1.5 * journeys_utils.animationSpeed / 1000 + "s ease";
    document.getElementById("branch-banner-iframe").style.transition = "all 0" + journeys_utils.animationSpeed / 1000 + "s ease";
    var c = document.getElementById("branch-iframe-css").innerHTML + "\n", c = c + ("body { -webkit-transition: all " + 1.5 * journeys_utils.animationSpeed / 1000 + "s ease; }\n"), c = c + ("#branch-banner-iframe { -webkit-transition: all " + journeys_utils.animationSpeed / 1000 + "s ease; }\n");
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
    (!journeys_utils.exitAnimationDisabled || journeys_utils.journeyDismissed) && journeys_utils.divToInjectParents && 0 < journeys_utils.divToInjectParents.length ? journeys_utils.divToInjectParents.forEach(function(a) {
      a.style.marginTop = 0;
    }) : (journeys_utils.exitAnimationDisabledPreviously = journeys_utils.exitAnimationDisabled, journeys_utils.previousPosition = journeys_utils.position, journeys_utils.previousDivToInjectParents = journeys_utils.divToInjectParents);
    "top" === journeys_utils.position ? document.body.style.marginTop = journeys_utils.bodyMarginTop : "bottom" === journeys_utils.position && (document.body.style.marginBottom = journeys_utils.bodyMarginBottom);
    banner_utils.removeClass(document.body, "branch-banner-is-active");
    banner_utils.removeClass(document.body, "branch-banner-no-scroll");
    journeys_utils.branch._publishEvent("didCloseJourney", journeys_utils.journeyLinkData);
    b || journeys_utils.branch._publishEvent("branch_internal_event_didCloseJourney", journeys_utils.journeyLinkData);
    journeys_utils.isJourneyDisplayed = !1;
  }, journeys_utils.exitAnimationDisabled ? 0 : journeys_utils.animationSpeed + journeys_utils.animationDelay);
};
journeys_utils.setJourneyLinkData = function(a) {
  var b = {banner_id:journeys_utils.branchViewId};
  if (a = a.match(journeys_utils.journeyLinkDataRe)) {
    a = a[1];
    var c = "";
    try {
      c = safejson.parse(a);
    } catch (d) {
    }
    c && (utils.removePropertiesFromObject(c.journey_link_data, ["browser_fingerprint_id", "app_id", "source", "open_app", "link_click_id"]), b = utils.merge(b, c));
  }
  journeys_utils.journeyLinkData = b;
};
// Input 15
var branch_view = {};
function checkPreviousBanner() {
  return document.getElementById("branch-banner") || document.getElementById("branch-banner-iframe") || document.getElementById("branch-banner-container") ? !0 : !1;
}
function renderHtmlBlob(a, b, c) {
  journeys_utils.setJourneyLinkData(b);
  var d = c ? "OPEN" : "GET";
  journeys_utils.setPositionAndHeight(b);
  var e = journeys_utils.getMetadata(b);
  e && (d = journeys_utils.getCtaText(e, c), journeys_utils.findInsertionDiv(a, e));
  a = journeys_utils.getCss(b);
  journeys_utils.getJsAndAddToParent(b);
  b = journeys_utils.removeScriptAndCss(b);
  c = journeys_utils.createAndAppendIframe();
  b = journeys_utils.createIframeInnerHTML(b, utils.mobileUserAgent());
  journeys_utils.addHtmlToIframe(c, b);
  journeys_utils.addIframeOuterCSS();
  journeys_utils.addIframeInnerCSS(c, a);
  journeys_utils.addDynamicCtaText(c, d);
  journeys_utils.branch._publishEvent("willShowJourney", journeys_utils.journeyLinkData);
  journeys_utils.animateBannerEntrance(c);
  return c;
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
  journeys_utils.branch._api(resources.pageview, {event:"pageview", journey_displayed:!0, audience_rule_id:a.audience_rule_id, branch_view_id:a.branch_view_id}, function(a, c) {
  });
};
branch_view.displayJourney = function(a, b, c, d, e) {
  journeys_utils.branchViewId = c;
  var f = d.audience_rule_id, g = document.getElementById("branch-iframe-css");
  g && g.parentElement.removeChild(g);
  g = document.createElement("div");
  g.id = "branch-banner";
  document.body.insertBefore(g, null);
  banner_utils.addClass(g, "branch-banner-is-active");
  var k = !1, h = b.callback_string, l = null, m = null, n = journeys_utils.branch._storage;
  if (a) {
    var p = journeys_utils.getMetadata(a) || {}, q = window.setTimeout(function() {
      window[h] = function() {
      };
    }, utils.timeout);
    window[h] = function(a) {
      window.clearTimeout(q);
      k || (m = a, journeys_utils.finalHookups(c, f, n, m, l, p, e, branch_view));
    };
    l = renderHtmlBlob(document.body, a, b.has_app_websdk);
    journeys_utils.banner = l;
    if (null === l) {
      k = !0;
      return;
    }
    journeys_utils.finalHookups(c, f, n, m, l, p, e, branch_view);
    utils.navigationTimingAPIEnabled && (utils.instrumentation["journey-load-time"] = utils.timeSinceNavigationStart());
  }
  document.body.removeChild(g);
  utils.userPreferences.trackingDisabled || e || branch_view.incrementPageviewAnalytics(d);
};
branch_view._getPageviewRequestData = function(a, b, c, d) {
  journeys_utils.branch = c;
  b || (b = {});
  a || (a = {});
  journeys_utils.entryAnimationDisabled = b.disable_entry_animation || !1;
  journeys_utils.exitAnimationDisabled = b.disable_exit_animation || !1;
  var e = utils.merge({}, c._branchViewData), f = session.get(c._storage) || {}, g = f.hasOwnProperty("has_app") ? f.has_app : !1, k = c._storage.get("journeyDismissals", !0), h = (b.user_language || utils.getBrowserLanguageCode() || "en").toLowerCase() || null, l = utils.getInitialReferrer(c._referringLink()), m = b.branch_view_id || utils.getParameterByName("_branch_view_id") || null;
  c = b.make_new_link ? null : utils.getClickIdAndSearchStringFromLink(c._referringLink());
  e.event = d ? "dismiss" : "pageview";
  e.metadata = a;
  e = utils.addPropertyIfNotNull(e, "initial_referrer", l);
  e = utils.addPropertyIfNotNull(e, "branch_view_id", m);
  e = utils.addPropertyIfNotNull(e, "no_journeys", b.no_journeys);
  e = utils.addPropertyIfNotNull(e, "is_iframe", utils.isIframe());
  e = utils.addPropertyIfNotNull(e, "journey_dismissals", k);
  e.user_language = h;
  e.open_app = b.open_app || !1;
  e.has_app_websdk = g;
  e.feature = "journeys";
  e.callback_string = "branch_view_callback__" + journeys_utils._callback_index++;
  e.data || (e.data = {});
  e.data = utils.merge(utils.getHostedDeepLinkData(), e.data);
  e.data = utils.merge(utils.whiteListJourneysLanguageData(f || {}), e.data);
  c && (e.data.link_click_id = c);
  return e = utils.cleanLinkData(e);
};
// Input 16
var appindexing = {state:{}};
appindexing.state.androidAppIndexingTagsPresent = !1;
appindexing.state.iosAppIndexingTagsPresent = !1;
appindexing.state.androidDetailsComplete = !1;
appindexing.state.iosDetailsComplete = !1;
appindexing.options = {};
function addAppIndexingTag(a) {
  var b;
  "android" === a && appindexing.state.androidDetailsComplete && (b = "android-app://" + appindexing.options.androidPackageName + "/" + appindexing.options.androidURL, b = addBranchTrackingParams(b), writeToDOM(b));
  "ios" === a && appindexing.state.iosDetailsComplete && (b = "ios-app://" + appindexing.options.iosAppId + "/" + appindexing.options.iosURL, b = addBranchTrackingParams(b), writeToDOM(b));
}
function addBranchTrackingParams(a) {
  var b = {"~channel":"Firebase App Indexing", "~feature":"Auto App Indexing", $canonical_url:utils.getWindowLocation()};
  if ("object" === typeof appindexing.options.data) {
    for (var c in appindexing.options.data) {
      appindexing.options.data.hasOwnProperty(c) && !b.hasOwnProperty(c) && (b[c] = appindexing.options.data[c]);
    }
  }
  c = -1 < a.indexOf("?") ? "&" : "?";
  return a + c + "link_click_id=a-" + btoa(safejson.stringify(b));
}
function writeToDOM(a) {
  var b = document.createElement("link");
  b.setAttribute("rel", "alternate");
  b.setAttribute("href", a);
  document.head.appendChild(b);
}
appindexing.updateAppIndexingTagsIfPresent = function() {
  var a = document.getElementsByTagName("link"), b = a.length;
  if (b) {
    for (var c = 0;c < b;c++) {
      var d = a[c], e = d.href;
      e && (e.includes("ios-app") && (appindexing.state.iosAppIndexingTagsPresent = !0, d.setAttribute("href", addBranchTrackingParams(e))), e.includes("android-app") && (appindexing.state.androidAppIndexingTagsPresent = !0, d.setAttribute("href", addBranchTrackingParams(e))));
    }
  }
};
appindexing.insertAppIndexingTagsFromConfig = function(a) {
  "android" === a && "string" === typeof appindexing.options.androidPackageName && "string" === typeof appindexing.options.androidURL && (appindexing.state.androidDetailsComplete = !0, addAppIndexingTag("android"));
  "ios" === a && "string" === typeof appindexing.options.iosAppId && "string" === typeof appindexing.options.iosURL && (appindexing.state.iosDetailsComplete = !0, addAppIndexingTag("ios"));
};
appindexing.populateConfigFromAppLinksTags = function(a) {
  for (var b = document.getElementsByTagName("meta"), c = 0;c < b.length;c++) {
    var d = b[c];
    "ios" === a && "al:ios:app_store_id" === d.getAttribute("property") && (appindexing.options.iosAppId = d.getAttribute("content"));
    "ios" === a && "al:ios:url" === d.getAttribute("property") && (appindexing.options.iosURL = d.getAttribute("content").replace("://", "/"));
    "android" === a && "al:android:package" === d.getAttribute("property") && (appindexing.options.androidPackageName = d.getAttribute("content"));
    "android" === a && "al:android:url" === d.getAttribute("property") && (appindexing.options.androidURL = d.getAttribute("content").replace("://", "/"));
  }
  appindexing.insertAppIndexingTagsFromConfig(a);
};
// Input 17
var default_branch, callback_params = {NO_CALLBACK:0, CALLBACK_ERR:1, CALLBACK_ERR_DATA:2}, init_states = {NO_INIT:0, INIT_PENDING:1, INIT_FAILED:2, INIT_SUCCEEDED:3}, init_state_fail_codes = {NO_FAILURE:0, UNKNOWN_CAUSE:1, OPEN_FAILED:2, BFP_NOT_FOUND:3, HAS_APP_FAILED:4}, wrap = function(a, b, c) {
  return function() {
    var d = this, e, f, g = arguments[arguments.length - 1];
    a === callback_params.NO_CALLBACK || "function" !== typeof g ? (f = function(a) {
    }, e = Array.prototype.slice.call(arguments)) : (e = Array.prototype.slice.call(arguments, 0, arguments.length - 1) || [], f = g);
    d._queue(function(g) {
      var h = function(b, c) {
        try {
          if (b && a === callback_params.NO_CALLBACK) {
            throw b;
          }
          a === callback_params.CALLBACK_ERR ? f(b) : a === callback_params.CALLBACK_ERR_DATA && f(b, c);
        } finally {
          g();
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
      e.unshift(h);
      b.apply(d, e);
    });
  };
}, Branch = function() {
  if (!(this instanceof Branch)) {
    return default_branch || (default_branch = new Branch), default_branch;
  }
  this._queue = task_queue();
  this._storage = new BranchStorage(["session", "cookie", "pojo"]);
  this._server = new Server;
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
  (a.params && a.params.link_click_id || a.queryPart && a.queryPart.link_click_id) && this.link_click_id && (b.link_click_id = this.link_click_id);
  (a.params && a.params.sdk || a.queryPart && a.queryPart.sdk) && this.sdk && (b.sdk = this.sdk);
  (a.params && a.params.browser_fingerprint_id || a.queryPart && a.queryPart.browser_fingerprint_id) && this.browser_fingerprint_id && (b.browser_fingerprint_id = this.browser_fingerprint_id);
  utils.userPreferences.trackingDisabled && (b.tracking_disabled = utils.userPreferences.trackingDisabled);
  return this._server.request(a, b, this._storage, function(a, b) {
    c(a, b);
  });
};
Branch.prototype._referringLink = function() {
  var a = session.get(this._storage);
  return (a = a && a.referring_link) ? a : (a = this._storage.get("click_id")) ? config.link_service_endpoint + "/c/" + a : null;
};
Branch.prototype._publishEvent = function(a, b) {
  for (var c = 0;c < this._listeners.length;c++) {
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
  utils.userPreferences.trackingDisabled = c && c.tracking_disabled && !0 === c.tracking_disabled ? !0 : !1;
  utils.userPreferences.allowErrorsInCallback = !1;
  utils.userPreferences.trackingDisabled && utils.cleanApplicationAndSessionStorage(d);
  var e = function(a) {
    a.link_click_id && (d.link_click_id = a.link_click_id.toString());
    a.session_id && (d.session_id = a.session_id.toString());
    a.identity_id && (d.identity_id = a.identity_id.toString());
    a.link && (d.sessionLink = a.link);
    a.referring_link && (a.referring_link = utils.processReferringLink(a.referring_link));
    !a.click_id && a.referring_link && (a.click_id = utils.getClickIdAndSearchStringFromLink(a.referring_link));
    d.browser_fingerprint_id = a.browser_fingerprint_id;
    return a;
  };
  b = session.get(d._storage);
  var f = (c && "undefined" !== typeof c.branch_match_id && null !== c.branch_match_id ? c.branch_match_id : null) || utils.getParamValue("_branch_match_id") || utils.hashValue("r"), g = !b || !b.identity_id;
  d._branchViewEnabled = !!d._storage.get("branch_view_enabled");
  var k = function(a) {
    var b = {sdk:config.version, branch_key:d.branch_key}, c = session.get(d._storage) || {}, e = session.get(d._storage, !0) || {};
    e.browser_fingerprint_id && (b._t = e.browser_fingerprint_id);
    utils.isSafari11OrGreater() || d._api(resources._r, b, function(a, b) {
      a && (d.init_state_fail_code = init_state_fail_codes.BFP_NOT_FOUND, d.init_state_fail_details = a.message);
      b && (c.browser_fingerprint_id = b);
    });
    d._api(resources.hasApp, {browser_fingerprint_id:c.browser_fingerprint_id}, function(b, e) {
      b && (d.init_state_fail_code = init_state_fail_codes.HAS_APP_FAILED, d.init_state_fail_details = b.message);
      b || !e || c.has_app || (c.has_app = !0, session.update(d._storage, c), d._publishEvent("didDownloadApp"));
      a && a(null, c);
    });
  }, h = function(b, f) {
    f && (f = e(f), utils.userPreferences.trackingDisabled || session.set(d._storage, f, g), d.init_state = init_states.INIT_SUCCEEDED, f.data_parsed = f.data && 0 !== f.data.length ? safejson.parse(f.data) : {});
    if (b) {
      return d.init_state = init_states.INIT_FAILED, d.init_state_fail_code || (d.init_state_fail_code = init_state_fail_codes.UNKNOWN_CAUSE, d.init_state_fail_details = b.message), a(b, f && utils.whiteListSessionData(f));
    }
    try {
      a(b, f && utils.whiteListSessionData(f));
    } catch (r) {
    } finally {
      d.renderFinalize();
    }
    var h = utils.getAdditionalMetadata(), k = utils.validateParameterType(c.metadata, "object") ? c.metadata : null;
    k && (k = utils.mergeHostedDeeplinkData(h.hosted_deeplink_data, k)) && 0 < Object.keys(k).length && (h.hosted_deeplink_data = k);
    var l = branch_view._getPageviewRequestData(journeys_utils._getPageviewMetadata(c, h), c, d, !1);
    d.renderQueue(function() {
      d._api(resources.pageview, l, function(a, b) {
        if (!a && "object" === typeof b) {
          var d = l.branch_view_id ? !0 : !1;
          branch_view.shouldDisplayJourney(b, c, d) ? branch_view.displayJourney(b.template, l, l.branch_view_id || b.event_data.branch_view_data.id, b.event_data.branch_view_data, d) : journeys_utils.branch._publishEvent("willNotShowJourney");
        }
        utils.userPreferences.trackingDisabled && (utils.userPreferences.allowErrorsInCallback = !0);
      });
    });
  }, l = function() {
    var a, b;
    "undefined" !== typeof document.hidden ? (a = "hidden", b = "visibilitychange") : "undefined" !== typeof document.mozHidden ? (a = "mozHidden", b = "mozvisibilitychange") : "undefined" !== typeof document.msHidden ? (a = "msHidden", b = "msvisibilitychange") : "undefined" !== typeof document.webkitHidden && (a = "webkitHidden", b = "webkitvisibilitychange");
    b && !d.changeEventListenerAdded && (d.changeEventListenerAdded = !0, document.addEventListener(b, function() {
      document[a] || (k(null), "function" === typeof d._deepviewRequestForReplay && d._deepviewRequestForReplay());
    }, !1));
  };
  if (b && b.session_id && !f) {
    session.update(d._storage, {data:""}), session.update(d._storage, {referring_link:""}), l(), k(h);
  } else {
    b = {sdk:config.version, branch_key:d.branch_key};
    var m = session.get(d._storage, !0) || {};
    m.browser_fingerprint_id && (b._t = m.browser_fingerprint_id);
    utils.isSafari11OrGreater() ? d._api(resources.open, {link_identifier:f, browser_fingerprint_id:f || m.browser_fingerprint_id, alternative_browser_fingerprint_id:m.browser_fingerprint_id, options:c, initial_referrer:utils.getInitialReferrer(d._referringLink())}, function(a, b) {
      a && (d.init_state_fail_code = init_state_fail_codes.OPEN_FAILED, d.init_state_fail_details = a.message);
      a || "object" !== typeof b || (b.branch_view_enabled && (d._branchViewEnabled = !!b.branch_view_enabled, d._storage.set("branch_view_enabled", d._branchViewEnabled)), f && (b.click_id = f));
      l();
      h(a, b);
    }) : d._api(resources._r, b, function(a, b) {
      if (a) {
        return d.init_state_fail_code = init_state_fail_codes.BFP_NOT_FOUND, d.init_state_fail_details = a.message, h(a, null);
      }
      d._api(resources.open, {link_identifier:f, browser_fingerprint_id:f || b, alternative_browser_fingerprint_id:m.browser_fingerprint_id, options:c, initial_referrer:utils.getInitialReferrer(d._referringLink())}, function(a, b) {
        a && (d.init_state_fail_code = init_state_fail_codes.OPEN_FAILED, d.init_state_fail_details = a.message);
        a || "object" !== typeof b || (b.branch_view_enabled && (d._branchViewEnabled = !!b.branch_view_enabled, d._storage.set("branch_view_enabled", d._branchViewEnabled)), f && (b.click_id = f));
        l();
        h(a, b);
      });
    });
  }
}, !0);
Branch.prototype.renderQueue = wrap(callback_params.NO_CALLBACK, function(a, b) {
  this._renderFinalized ? b() : (this._renderQueue = this._renderQueue || [], this._renderQueue.push(b));
  a(null, null);
});
Branch.prototype.renderFinalize = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  this._renderQueue && 0 < this._renderQueue.length && (this._renderQueue.forEach(function(a) {
    a.call(this);
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
    e.referring_data_parsed = e.referring_data ? safejson.parse(e.referring_data) : null;
    session.update(c._storage, e);
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
    b.identity = d.identity;
    session.update(b._storage, d);
    a(null);
  });
});
Branch.prototype.getBrowserFingerprintId = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  var b = session.get(this._storage, !0) || {};
  a(null, b.browser_fingerprint_id || null);
});
Branch.prototype.track = wrap(callback_params.CALLBACK_ERR, function(a, b, c, d) {
  c = c || {};
  d = d || {};
  utils.nonce = d.nonce ? d.nonce : utils.nonce;
  if ("pageview" === b) {
    (b = utils.mergeHostedDeeplinkData(utils.getHostedDeepLinkData(), c)) && 0 < Object.keys(b).length && (c.hosted_deeplink_data = b);
    var e = branch_view._getPageviewRequestData(journeys_utils._getPageviewMetadata(d, c), d, this, !1);
    this._api(resources.pageview, e, function(b, c) {
      if (!b && "object" === typeof c) {
        var f = e.branch_view_id ? !0 : !1;
        branch_view.shouldDisplayJourney(c, d, f) ? branch_view.displayJourney(c.template, e, e.branch_view_id || c.event_data.branch_view_data.id, c.event_data.branch_view_data, f) : journeys_utils.branch._publishEvent("willNotShowJourney");
      }
      "function" === typeof a && a.apply(this, arguments);
    });
  } else {
    this._api(resources.event, {event:b, metadata:utils.merge({url:utils.getWindowLocation(), user_agent:navigator.userAgent, language:navigator.language}, c), initial_referrer:utils.getInitialReferrer(this._referringLink())}, function(b, c) {
      "function" === typeof a && a.apply(this, arguments);
    });
  }
});
Branch.prototype.logEvent = wrap(callback_params.CALLBACK_ERR, function(a, b, c, d) {
  b = utils.validateParameterType(b, "string") ? b : null;
  c = utils.validateParameterType(c, "object") ? c : null;
  utils.isStandardEvent(b) ? (d = utils.validateParameterType(d, "array") ? d : null, c = utils.separateEventAndCustomData(c), this._api(resources.logStandardEvent, {name:b, user_data:safejson.stringify(utils.getUserData(this)), custom_data:safejson.stringify(c && c.custom_data || {}), event_data:safejson.stringify(c && c.event_data || {}), content_items:safejson.stringify(d || [])}, function(b, c) {
    return a(b || null);
  })) : this._api(resources.logCustomEvent, {name:b, user_data:safejson.stringify(utils.getUserData(this)), custom_data:safejson.stringify(utils.convertObjectValuesToString(c) || {})}, function(b, c) {
    return a(b || null);
  });
});
Branch.prototype.link = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b) {
  var c = utils.cleanLinkData(b), d = this.branch_key;
  this._api(resources.link, c, function(b, f) {
    if (b) {
      return a(null, utils.generateDynamicBNCLink(d, c));
    }
    a(null, f && f.url);
  });
});
Branch.prototype.sendSMS = wrap(callback_params.CALLBACK_ERR, function(a, b, c, d) {
  function e(c) {
    f._api(resources.SMSLinkSend, {link_url:c, phone:b}, function(b) {
      a(b || null);
    });
  }
  var f = this;
  if ("function" === typeof d) {
    d = {};
  } else {
    if ("undefined" === typeof d || null === d) {
      d = {};
    }
  }
  d.make_new_link = d.make_new_link || !1;
  c.channel && "app banner" !== c.channel || (c.channel = "sms");
  var g = f._referringLink();
  g && !d.make_new_link ? e(utils.getClickIdAndSearchStringFromLink(g)) : f._api(resources.link, utils.cleanLinkData(c), function(b, c) {
    if (b) {
      return a(b);
    }
    var d = c.url;
    /(bnc.lt\/|app\.link\/)/.test(d) || (d = config.link_service_endpoint + "/" + utils.extractDeeplinkPath(d));
    f._api(resources.linkClick, {link_url:d, click:"click"}, function(b, c) {
      if (b) {
        return a(b);
      }
      e(c.click_id);
    });
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
  d._deepviewRequestForReplay = goog.bind(this._api, d, resources.deepview, b, function(b, c) {
    if (b) {
      return utils.userPreferences.trackingDisabled || (d._deepviewCta = function() {
        d._windowRedirect(e);
      }), a(b);
    }
    "function" === typeof c && (d._deepviewCta = c);
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
Branch.prototype.referrals = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  this._api(resources.referrals, {}, a);
});
Branch.prototype.getCode = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b) {
  b.type = "credit";
  b.creation_source = b.creation_source || 2;
  this._api(resources.getCode, b, a);
});
Branch.prototype.validateCode = wrap(callback_params.CALLBACK_ERR, function(a, b) {
  this._api(resources.validateCode, {code:b}, a);
});
Branch.prototype.applyCode = wrap(callback_params.CALLBACK_ERR, function(a, b) {
  this._api(resources.applyCode, {code:b}, a);
});
Branch.prototype.credits = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  this._api(resources.credits, {branch_key:this.branch_key, identity:this.identity}, a);
});
Branch.prototype.creditHistory = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b) {
  this._api(resources.creditHistory, b || {}, a);
});
Branch.prototype.redeem = wrap(callback_params.CALLBACK_ERR, function(a, b, c) {
  this._api(resources.redeem, {amount:b, bucket:c}, function(b) {
    a(b || null);
  });
});
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
});
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
  c = c || {};
  _setBranchViewData.call(null, this, function() {
  }, c);
  "undefined" === typeof b.showAgain && "undefined" !== typeof b.forgetHide && (b.showAgain = b.forgetHide);
  var d = {icon:utils.cleanBannerText(b.icon) || "", title:utils.cleanBannerText(b.title) || "", description:utils.cleanBannerText(b.description) || "", reviewCount:"number" === typeof b.reviewCount && 0 < b.reviewCount ? Math.floor(b.reviewCount) : null, rating:"number" === typeof b.rating && 5 >= b.rating && 0 < b.rating ? Math.round(2 * b.rating) / 2 : null, openAppButtonText:utils.cleanBannerText(b.openAppButtonText) || "View in app", downloadAppButtonText:utils.cleanBannerText(b.downloadAppButtonText) || 
  "Download App", sendLinkText:utils.cleanBannerText(b.sendLinkText) || "Send Link", phonePreviewText:utils.cleanBannerText(b.phonePreviewText) || "(999) 999-9999", iframe:"undefined" === typeof b.iframe ? !0 : b.iframe, showiOS:"undefined" === typeof b.showiOS ? !0 : b.showiOS, showiPad:"undefined" === typeof b.showiPad ? !0 : b.showiPad, showAndroid:"undefined" === typeof b.showAndroid ? !0 : b.showAndroid, showBlackberry:"undefined" === typeof b.showBlackberry ? !0 : b.showBlackberry, showWindowsPhone:"undefined" === 
  typeof b.showWindowsPhone ? !0 : b.showWindowsPhone, showKindle:"undefined" === typeof b.showKindle ? !0 : b.showKindle, showDesktop:"undefined" === typeof b.showDesktop ? !0 : b.showDesktop, disableHide:!!b.disableHide, forgetHide:"number" === typeof b.forgetHide ? b.forgetHide : !!b.forgetHide, respectDNT:"undefined" === typeof b.respectDNT ? !1 : b.respectDNT, position:b.position || "top", customCSS:b.customCSS || "", mobileSticky:"undefined" === typeof b.mobileSticky ? !1 : b.mobileSticky, 
  desktopSticky:"undefined" === typeof b.desktopSticky ? !0 : b.desktopSticky, buttonBorderColor:b.buttonBorderColor || "", buttonBackgroundColor:b.buttonBackgroundColor || "", buttonFontColor:b.buttonFontColor || "", buttonBorderColorHover:b.buttonBorderColorHover || "", buttonBackgroundColorHover:b.buttonBackgroundColorHover || "", buttonFontColorHover:b.buttonFontColorHover || "", make_new_link:!!b.make_new_link, open_app:!!b.open_app, immediate:!!b.immediate, append_deeplink_path:!!b.append_deeplink_path};
  "undefined" !== typeof b.showMobile && (d.showiOS = b.showMobile, d.showAndroid = b.showMobile, d.showBlackberry = b.showMobile, d.showWindowsPhone = b.showMobile, d.showKindle = b.showMobile);
  c.data = utils.merge(utils.getHostedDeepLinkData(), c.data);
  var e = this;
  e.renderQueue(function() {
    e.closeBannerPointer = banner(e, d, c, e._storage);
  });
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
Branch.prototype.autoAppIndex = wrap(callback_params.CALLBACK_ERR, function(a, b) {
  b = b || {};
  appindexing.updateAppIndexingTagsIfPresent();
  appindexing.options = b;
  appindexing.state.androidAppIndexingTagsPresent || (appindexing.insertAppIndexingTagsFromConfig("android"), appindexing.state.androidDetailsComplete || appindexing.populateConfigFromAppLinksTags("android"));
  appindexing.state.iosAppIndexingTagsPresent || (appindexing.insertAppIndexingTagsFromConfig("ios"), appindexing.state.iosDetailsComplete || appindexing.populateConfigFromAppLinksTags("ios"));
  appindexing.state.iosDetailsComplete || appindexing.state.androidDetailsComplete ? a(null) : a("Firebase App Indexing tags were not added to your webpage. Please check your configuration.");
});
Branch.prototype.trackCommerceEvent = wrap(callback_params.CALLBACK_ERR, function(a, b, c, d) {
  var e = this;
  e.renderQueue(function() {
    var f = utils.validateCommerceEventParams(b, c);
    if (f) {
      return a(Error(f));
    }
    e._api(resources.commerceEvent, {event:b, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, d || {}), initial_referrer:utils.getInitialReferrer(e._referringLink()), commerce_data:c}, function(b, c) {
      a(b || null);
    });
  });
  a();
});
Branch.prototype.disableTracking = wrap(callback_params.CALLBACK_ERR, function(a, b) {
  if (!1 === b || "false" === b) {
    utils.userPreferences.trackingDisabled = !1, utils.userPreferences.allowErrorsInCallback = !1, this.branch_key && this.init_options && (!0 === this.init_options.tracking_disabled && delete this.init_options.tracking_disabled, this.init(this.branch_key, this.init_options));
  } else {
    if (void 0 === b || !0 === b || "true" === b) {
      utils.cleanApplicationAndSessionStorage(this), utils.userPreferences.trackingDisabled = !0, utils.userPreferences.allowErrorsInCallback = !0, this.closeBanner(), this.closeJourney();
    }
  }
  a();
});
// Input 18
var branch_instance = new Branch;
if (window.branch && window.branch._q) {
  for (var queue = window.branch._q, i = 0;i < queue.length;i++) {
    var task = queue[i];
    branch_instance[task[0]].apply(branch_instance, task[1]);
  }
}
"function" === typeof define && define.amd ? define("branch", function() {
  return branch_instance;
}) : "object" === typeof exports && (module.exports = branch_instance);
window && (window.branch = branch_instance);
})();
