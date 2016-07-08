(function() {// Input 0
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
    !a.length && goog.isDef(b) ? c[d] = b : c = c[d] ? c[d] : c[d] = {};
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
    throw Error("Module " + a + " has been loaded incorrectly.");
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
    return goog.isProvided_(a) ? a in goog.loadedModules_ ? goog.loadedModules_[a] : goog.getObjectByName(a) : null;
  }
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
    for (var f = goog.dependencies_, g = 0;e = b[g];g++) {
      f.nameToPath[e] = a, f.pathIsModule[a] = !!d;
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
      return goog.isInModuleLoader_() ? goog.module.getInternal_(a) : null;
    }
    if (goog.ENABLE_DEBUG_LOADER) {
      var b = goog.getPathFromDeps_(a);
      if (b) {
        return goog.writeScripts_(b), null;
      }
    }
    a = "goog.require could not find: " + a;
    goog.logToConsole_(a);
    throw Error(a);
  }
};
goog.basePath = "";
goog.nullFunction = function() {
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(a) {
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
goog.DEPENDENCIES_ENABLED && (goog.dependencies_ = {pathIsModule:{}, nameToPath:{}, requires:{}, visited:{}, written:{}, deferred:{}}, goog.inHtmlDocument_ = function() {
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
}, goog.IS_OLD_IE_ = !(goog.global.atob || !goog.global.document || !goog.global.document.all), goog.importModule_ = function(a) {
  goog.importScript_("", 'goog.retrieveAndExecModule_("' + a + '");') && (goog.dependencies_.written[a] = !0);
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
  return (a = goog.getPathFromDeps_(a)) && goog.dependencies_.pathIsModule[a] ? goog.basePath + a in goog.dependencies_.deferred : !1;
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
  goog.retrieveAndExecModule_(a);
}, goog.loadModule = function(a) {
  var b = goog.moduleLoaderState_;
  try {
    goog.moduleLoaderState_ = {moduleName:void 0, declareLegacyNamespace:!1};
    var c;
    if (goog.isFunction(a)) {
      c = a.call(goog.global, {});
    } else {
      if (goog.isString(a)) {
        c = goog.loadModuleFromSource_.call(goog.global, a);
      } else {
        throw Error("Invalid module definition");
      }
    }
    var d = goog.moduleLoaderState_.moduleName;
    if (!goog.isString(d) || !d) {
      throw Error('Invalid module name "' + d + '"');
    }
    goog.moduleLoaderState_.declareLegacyNamespace ? goog.constructNamespace_(d, c) : goog.SEAL_MODULE_EXPORTS && Object.seal && Object.seal(c);
    goog.loadedModules_[d] = c;
  } finally {
    goog.moduleLoaderState_ = b;
  }
}, goog.loadModuleFromSource_ = function(a) {
  eval(a);
  return {};
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
    var d = goog.IS_OLD_IE_;
    void 0 === b ? d ? (d = " onreadystatechange='goog.onScriptLoad_(this, " + ++goog.lastNonModuleScriptIndex_ + ")' ", c.write('<script type="text/javascript" src="' + a + '"' + d + ">\x3c/script>")) : goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING ? goog.appendScriptSrcNode_(a) : goog.writeScriptSrcNode_(a) : c.write('<script type="text/javascript">' + b + "\x3c/script>");
    return !0;
  }
  return !1;
}, goog.lastNonModuleScriptIndex_ = 0, goog.onScriptLoad_ = function(a, b) {
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
      e.pathIsModule[f] ? goog.importModule_(goog.basePath + f) : goog.importScript_(goog.basePath + f);
    } else {
      throw goog.moduleLoaderState_ = g, Error("Undefined script input");
    }
  }
  goog.moduleLoaderState_ = g;
}, goog.getPathFromDeps_ = function(a) {
  return a in goog.dependencies_.nameToPath ? goog.dependencies_.nameToPath[a] : null;
}, goog.findBasePath_(), goog.global.CLOSURE_NO_DEPS || goog.importScript_(goog.basePath + "deps.js"));
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
  var b = new goog.global.XMLHttpRequest;
  b.open("get", a, !1);
  b.send();
  return b.responseText;
};
goog.retrieveAndExecModule_ = function(a) {
  if (!COMPILED) {
    var b = a;
    a = goog.normalizePath_(a);
    var c = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_, d = goog.loadFileSync_(a);
    if (null != d) {
      d = goog.wrapModule_(a, d), goog.IS_OLD_IE_ ? (goog.dependencies_.deferred[b] = d, goog.queuedModules_.push(b)) : c(a, d);
    } else {
      throw Error("load of " + a + "failed");
    }
  }
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
  "removeAttribute" in a && a.removeAttribute(goog.UID_PROPERTY_);
  try {
    delete a[goog.UID_PROPERTY_];
  } catch (b) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (1E9 * Math.random() >>> 0);
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
  };
  return b ? a + "-" + d(b) : d(a);
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
    for (var g = Array(arguments.length - 2), k = 2;k < arguments.length;k++) {
      g[k - 2] = arguments[k];
    }
    return b.prototype[c].apply(a, g);
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
  if (goog.defineClass.SEAL_CLASS_INSTANCES && Object.seal instanceof Function) {
    if (b && b.prototype && b.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_]) {
      return a;
    }
    var c = function() {
      var b = a.apply(this, arguments) || this;
      b[goog.UID_PROPERTY_] = b[goog.UID_PROPERTY_];
      this.constructor === c && Object.seal(b);
      return b;
    };
    return c;
  }
  return a;
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
// Input 1
goog.json = {};
goog.json.USE_NATIVE_JSON = !1;
goog.json.isValid = function(a) {
  return /^\s*$/.test(a) ? !1 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""));
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
        throw Error("Unknown type: " + typeof a);;
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
var config = {app_service_endpoint:"https://app.link", link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:"2.4.0"};
// Input 3
var safejson = {parse:function(a) {
  a = String(a);
  try {
    return "object" === typeof JSON && "function" === typeof JSON.parse ? JSON.parse(a) : goog.json.parse(a);
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
utils.httpMethod = {POST:"POST", GET:"GET"};
utils.messages = {missingParam:"API request $1 missing parameter $2", invalidType:"API request $1, parameter $2 is not $3", nonInit:"Branch SDK not initialized", initPending:"Branch SDK initialization pending and a Branch method was called outside of the queue order", initFailed:"Branch SDK initialization failed, so further methods cannot be called", existingInit:"Branch SDK already initilized", missingAppId:"Missing Branch app ID", callBranchInitFirst:"Branch.init must be called first", timeout:"Request timed out", 
blockedByClient:"Request blocked by client, probably adblock", missingUrl:"Required argument: URL, is missing"};
utils.bannerThemes = ["light", "dark"];
utils.getLocationSearch = function() {
  return window.location.search;
};
utils.getLocationHash = function() {
  return window.location.hash;
};
utils.message = function(a, b) {
  var c = a.replace(/\$(\d)/g, function(a, c) {
    return b[parseInt(c, 10) - 1];
  });
  DEBUG && console && console.log(c);
  return c;
};
utils.whiteListSessionData = function(a) {
  return {data:a.data || null, data_parsed:a.data_parsed || null, has_app:a.has_app || null, identity:a.identity || null, referring_identity:a.referring_identity || null, referring_link:a.referring_link || null};
};
utils.getWindowLocation = function() {
  return String(window.location);
};
utils.cleanLinkData = function(a) {
  a.source = "web-sdk";
  var b = a.data;
  switch(typeof b) {
    case "string":
      try {
        b = safejson.parse(b);
      } catch (c) {
        b = goog.json.parse(b);
      }
      break;
    case "object":
      break;
    default:
      b = {};
  }
  b.$canonical_url || (b.$canonical_url = utils.getWindowLocation());
  b.$og_title || (b.$og_title = utils.scrapeOpenGraphContent("title"));
  b.$og_description || (b.$og_description = utils.scrapeOpenGraphContent("description"));
  b.$og_image_url || (b.$og_image_url = utils.scrapeOpenGraphContent("image"));
  b.$og_video || (b.$og_video = utils.scrapeOpenGraphContent("video"));
  "string" === typeof b.$desktop_url && (b.$desktop_url = b.$desktop_url.replace(/#r:[a-z0-9-_]+$/i, "").replace(/([\?\&]_branch_match_id=\d+)/, ""));
  try {
    safejson.parse(b);
  } catch (c) {
    b = goog.json.serialize(b);
  }
  a.data = b;
  return a;
};
utils.clickIdFromLink = function(a) {
  return a ? a.substring(a.lastIndexOf("/") + 1, a.length) : null;
};
utils.processReferringLink = function(a) {
  return a ? "http" !== a.substring(0, 4) ? config.link_service_endpoint + a : a : null;
};
utils.merge = function(a, b) {
  if ("undefined" === typeof b) {
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
    c = a.charCodeAt(h++), d = a.charCodeAt(h++), e = a.charCodeAt(h++), f = c >> 2, c = (c & 3) << 4 | d >> 4, g = (d & 15) << 2 | e >> 6, k = e & 63, isNaN(d) ? k = g = 64 : isNaN(e) && (k = 64), b = b + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(f) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(g) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(k)
    ;
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
utils.scrapeOpenGraphContent = function(a, b) {
  a = String(a);
  b = b || null;
  var c = document.querySelector('meta[property="og:' + a + '"]');
  c && c.content && (b = c.content);
  return b;
};
// Input 6
var resources = {}, validationTypes = {OBJECT:0, STRING:1, NUMBER:2, ARRAY:3, BOOLEAN:4}, _validator;
function validator(a, b) {
  return function(c, d, e) {
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
resources.open = {destination:config.api_endpoint, endpoint:"/v1/open", method:utils.httpMethod.POST, params:{browser_fingerprint_id:validator(!0, branch_id), identity_id:validator(!1, branch_id), is_referrable:validator(!0, validationTypes.NUMBER), link_identifier:validator(!1, validationTypes.STRING), sdk:validator(!1, validationTypes.STRING), options:validator(!1, validationTypes.OBJECT)}};
resources._r = {destination:config.app_service_endpoint, endpoint:"/_r", method:utils.httpMethod.GET, jsonp:!0, params:{sdk:validator(!0, validationTypes.STRING), _t:validator(!1, branch_id)}};
resources.linkClick = {destination:"", endpoint:"", method:utils.httpMethod.GET, queryPart:{link_url:validator(!0, validationTypes.STRING)}, params:{click:validator(!0, validationTypes.STRING)}};
resources.SMSLinkSend = {destination:config.link_service_endpoint, endpoint:"/c", method:utils.httpMethod.POST, queryPart:{link_url:validator(!0, validationTypes.STRING)}, params:{sdk:validator(!1, validationTypes.STRING), phone:validator(!0, validationTypes.STRING)}};
resources.getCode = {destination:config.api_endpoint, endpoint:"/v1/referralcode", method:utils.httpMethod.POST, params:defaults({amount:validator(!0, validationTypes.NUMBER), bucket:validator(!1, validationTypes.STRING), calculation_type:validator(!0, validationTypes.NUMBER), creation_source:validator(!0, validationTypes.NUMBER), expiration:validator(!1, validationTypes.STRING), location:validator(!0, validationTypes.NUMBER), prefix:validator(!1, validationTypes.STRING), type:validator(!0, validationTypes.STRING)})};
resources.validateCode = {destination:config.api_endpoint, endpoint:"/v1/referralcode", method:utils.httpMethod.POST, queryPart:{code:validator(!0, validationTypes.STRING)}, params:defaults({})};
resources.applyCode = {destination:config.api_endpoint, endpoint:"/v1/applycode", method:utils.httpMethod.POST, queryPart:{code:validator(!0, validationTypes.STRING)}, params:defaults({})};
resources.logout = {destination:config.api_endpoint, endpoint:"/v1/logout", method:utils.httpMethod.POST, params:defaults({session_id:validator(!0, branch_id)})};
resources.profile = {destination:config.api_endpoint, endpoint:"/v1/profile", method:utils.httpMethod.POST, params:defaults({identity_id:validator(!0, branch_id), identity:validator(!0, validationTypes.STRING)})};
resources.referrals = {destination:config.api_endpoint, endpoint:"/v1/referrals", method:utils.httpMethod.GET, queryPart:{identity_id:validator(!0, branch_id)}, params:defaults({})};
resources.creditHistory = {destination:config.api_endpoint, endpoint:"/v1/credithistory", method:utils.httpMethod.GET, params:defaults({begin_after_id:validator(!1, branch_id), bucket:validator(!1, validationTypes.STRING), direction:validator(!1, validationTypes.NUMBER), length:validator(!1, validationTypes.NUMBER), link_click_id:validator(!1, branch_id)})};
resources.credits = {destination:config.api_endpoint, endpoint:"/v1/credits", method:utils.httpMethod.GET, queryPart:{identity_id:validator(!0, branch_id)}, params:defaults({})};
resources.redeem = {destination:config.api_endpoint, endpoint:"/v1/redeem", method:utils.httpMethod.POST, params:defaults({amount:validator(!0, validationTypes.NUMBER), bucket:validator(!0, validationTypes.STRING), identity_id:validator(!0, branch_id)})};
resources.link = {destination:config.api_endpoint, endpoint:"/v1/url", method:utils.httpMethod.POST, ref:"obj", params:defaults({alias:validator(!1, validationTypes.STRING), campaign:validator(!1, validationTypes.STRING), channel:validator(!1, validationTypes.STRING), data:validator(!1, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), identity_id:validator(!0, branch_id), stage:validator(!1, validationTypes.STRING), tags:validator(!1, validationTypes.ARRAY), type:validator(!1, 
validationTypes.NUMBER)})};
resources.deepview = {destination:config.api_endpoint, endpoint:"/v1/deepview", jsonp:!0, method:utils.httpMethod.POST, params:defaults({campaign:validator(!1, validationTypes.STRING), _t:validator(!1, branch_id), channel:validator(!1, validationTypes.STRING), data:validator(!0, validationTypes.STRING), feature:validator(!1, validationTypes.STRING), link_click_id:validator(!1, validationTypes.STRING), open_app:validator(!1, validationTypes.BOOLEAN), append_deeplink_path:validator(!1, validationTypes.BOOLEAN), 
stage:validator(!1, validationTypes.STRING), tags:validator(!1, validationTypes.ARRAY)})};
resources.hasApp = {destination:config.api_endpoint, endpoint:"/v1/has-app", method:utils.httpMethod.GET, params:{browser_fingerprint_id:validator(!0, branch_id)}};
resources.event = {destination:config.api_endpoint, endpoint:"/v1/event", method:utils.httpMethod.POST, params:defaults({event:validator(!0, validationTypes.STRING), metadata:validator(!0, validationTypes.OBJECT)})};
// Input 7
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
  var c = session.get(a), c = utils.merge(c, b);
  a.set("branch_session", goog.json.serialize(c));
}};
// Input 8
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
}, webStorage = function(a) {
  var b;
  try {
    b = a ? localStorage : sessionStorage;
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
    return retrieveValue(d ? localStorage.getItem(prefix(a)) : b.getItem(prefix(a)));
  }, set:function(a, d, e) {
    e ? localStorage.setItem(prefix(a), d) : b.setItem(prefix(a), d);
  }, remove:function(a) {
    b.removeItem(prefix(a));
  }, clear:function() {
    Object.keys(b).forEach(function(a) {
      0 === a.indexOf(BRANCH_KEY_PREFIX) && b.removeItem(a);
    });
  }, isEnabled:function() {
    try {
      return b.setItem("test", ""), b.removeItem("test"), !0;
    } catch (a) {
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
var cookies = function(a) {
  return {getAll:function() {
    for (var a = document.cookie.split(";"), c = {}, d = 0;d < a.length;d++) {
      var e = a[d].replace(" ", ""), e = e.substring(0, e.length);
      -1 !== e.indexOf(BRANCH_KEY_PREFIX) && (e = e.split("="), c[trimPrefix(e[0])] = retrieveValue(e[1]));
    }
    return c;
  }, get:function(a) {
    a = prefix(a) + "=";
    for (var c = document.cookie.split(";"), d = 0;d < c.length;d++) {
      var e = c[d], e = e.substring(1, e.length);
      if (0 === e.indexOf(a)) {
        return retrieveValue(e.substring(a.length, e.length));
      }
    }
    return null;
  }, set:function(b, c) {
    var d = prefix(b), e = "";
    a && (e = new Date, e.setTime(e.getTime() + COOKIE_MS), e = "; branch_expiration_date=" + e.toGMTString() + "; expires=" + e.toGMTString());
    document.cookie = d + "=" + c + e + "; path=/";
  }, remove:function(a) {
    document.cookie = prefix(a) + "=; expires=; path=/";
  }, clear:function() {
    for (var b = function(a) {
      document.cookie = a.substring(0, a.indexOf("=")) + "=;expires=-1;path=/";
    }, c = document.cookie.split(";"), d = 0;d < c.length;d++) {
      var e = c[d], e = e.substring(1, e.length);
      -1 !== e.indexOf(BRANCH_KEY_PREFIX) && (a || -1 !== e.indexOf("branch_expiration_date=") ? a && 0 < e.indexOf("branch_expiration_date=") && b(e) : b(e));
    }
  }, isEnabled:function() {
    return navigator.cookieEnabled;
  }};
};
BranchStorage.prototype.cookie = function() {
  return cookies(!1);
};
BranchStorage.prototype.permcookie = function() {
  return cookies(!0);
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
// Input 9
var RETRIES = 2, RETRY_DELAY = 200, TIMEOUT = 5E3, Server = function() {
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
  var c, d, e = a.destination + a.endpoint, f = /^[0-9]{15,20}$/, g = /key_(live|test)_[A-Za-z0-9]{32}/, k = function(b, d) {
    "undefined" === typeof d && (d = {});
    if (b.branch_key && g.test(b.branch_key)) {
      return d.branch_key = b.branch_key, d;
    }
    if (b.app_id && f.test(b.app_id)) {
      return d.app_id = b.app_id, d;
    }
    throw Error(utils.message(utils.messages.missingParam, [a.endpoint, "branch_key or app_id"]));
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
  if ("undefined" !== typeof a.params) {
    for (c in a.params) {
      if (a.params.hasOwnProperty(c)) {
        if (d = a.params[c](a.endpoint, c, b[c])) {
          return {error:d};
        }
        d = b[c];
        "undefined" !== typeof d && "" !== d && null !== d && (h[c] = d);
      }
    }
  }
  if ("POST" === a.method || "/v1/credithistory" === a.endpoint) {
    try {
      b = k(b, h);
    } catch (l) {
      return {error:l.message};
    }
  }
  "/v1/event" === a.endpoint && (h.metadata = JSON.stringify(h.metadata || {}));
  "/v1/open" === a.endpoint && (h.options = JSON.stringify(h.options || {}));
  return {data:this.serializeObject(h, ""), url:e.replace(/^\//, "")};
};
Server.prototype.createScript = function(a, b, c) {
  var d = document.createElement("script");
  d.type = "text/javascript";
  d.async = !0;
  d.src = a;
  a = document.getElementsByTagName("head");
  !a || 1 > a.length ? "function" === typeof b && b() : (a[0].appendChild(d), "function" === typeof b && utils.addEvent(d, "error", b), "function" === typeof c && utils.addEvent(d, "load", c));
};
var jsonp_callback_index = 0;
Server.prototype.jsonpRequest = function(a, b, c, d) {
  var e = "branch_callback__" + this._jsonp_callback_index++, f = 0 <= a.indexOf("branch.io") ? "&data=" : "&post_data=";
  b = "POST" === c ? encodeURIComponent(utils.base64encode(goog.json.serialize(b))) : "";
  var g = window.setTimeout(function() {
    window[e] = function() {
    };
    d(Error(utils.messages.timeout), null, 504);
  }, TIMEOUT);
  window[e] = function(a) {
    window.clearTimeout(g);
    d(null, a);
  };
  this.createScript(a + (0 > a.indexOf("?") ? "?" : "") + (b ? f + b : "") + (0 <= a.indexOf("/c/") ? "&click=1" : "") + "&callback=" + e, function() {
    d(Error(utils.messages.blockedByClient), null);
  }, function() {
    try {
      "function" === typeof this.remove ? this.remove() : this.parentNode.removeChild(this);
    } catch (a) {
    }
    delete window[e];
  });
};
Server.prototype.XHRRequest = function(a, b, c, d, e, f) {
  var g = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
  g.ontimeout = function() {
    e(Error(utils.messages.timeout), null, 504);
  };
  g.onerror = function(a) {
    e(Error(a.error || "Error in API: " + g.status), null, g.status);
  };
  g.onreadystatechange = function() {
    var a;
    if (4 === g.readyState) {
      if (200 === g.status) {
        if (f) {
          a = g.responseText;
        } else {
          try {
            a = safejson.parse(g.responseText);
          } catch (b) {
            a = {};
          }
        }
        e(null, a, g.status);
      } else {
        402 === g.status ? e(Error("Not enough credits to redeem."), null, g.status) : "4" !== g.status.toString().substring(0, 1) && "5" !== g.status.toString().substring(0, 1) || e(Error("Error in API: " + g.status), null, g.status);
      }
    }
  };
  try {
    g.open(c, a, !0), g.timeout = TIMEOUT, g.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), g.send(b);
  } catch (k) {
    d.set("use_jsonp", !0), this.jsonpRequest(a, b, c, e);
  }
};
Server.prototype.request = function(a, b, c, d) {
  var e = this, f = this.getUrl(a, b);
  if (f.error) {
    return d(Error(f.error));
  }
  var g, k = "";
  "GET" === a.method ? g = f.url + "?" + f.data : (g = f.url, k = f.data);
  var h = RETRIES, l = function(a, b, c) {
    a && 0 < h && "5" === (c || "").toString().substring(0, 1) ? (h--, window.setTimeout(function() {
      m();
    }, RETRY_DELAY)) : d(a, b);
  }, m = function() {
    c.get("use_jsonp") || a.jsonp ? e.jsonpRequest(g, b, a.method, l) : e.XHRRequest(g, k, a.method, c, l);
  };
  m();
};
// Input 10
var banner_utils = {animationSpeed:250, animationDelay:20, bannerHeight:"76px", error_timeout:2E3, success_timeout:3E3, removeElement:function(a) {
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
    var f = parseInt(0 < a.length ? a[0] : "0", 10), g = function() {
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
      return document.body.clientWidth / 100 * f;
    }}[b](f), 10);
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
  return ".branch-banner-is-active { -webkit-transition: all " + 1.5 * banner_utils.animationSpeed / 1E3 + "s ease; transition: all 0" + 1.5 * banner_utils.animationSpeed / 1E3 + "s ease; }\n#branch-banner { width:100%; z-index: 99999; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all " + banner_utils.animationSpeed / 1E3 + "s ease; transition: all 0" + banner_utils.animationSpeed / 
  1E3 + "s ease; }\n#branch-banner .button{ border: 1px solid " + (a.buttonBorderColor || ("dark" === a.theme ? "transparent" : "#ccc")) + "; background: " + (a.buttonBackgroundColor || "#fff") + "; color: " + (a.buttonFontColor || "#000") + "; cursor: pointer; margin-top: 0px; font-size: 14px; display: inline-block; margin-left: 5px; font-weight: 400; text-decoration: none;  border-radius: 4px; padding: 6px 12px; transition: all .2s ease;}\n#branch-banner .button:hover {  border: 1px solid " + (a.buttonBorderColorHover || 
  ("dark" === a.theme ? "transparent" : "#BABABA")) + "; background: " + (a.buttonBackgroundColorHover || "#E0E0E0") + "; color: " + (a.buttonFontColorHover || "#000") + ";}\n#branch-banner .button:focus { outline: none; }\n#branch-banner * { margin-right: 4px; position: relative; line-height: 1.2em; }\n#branch-banner-close { font-weight: 400; cursor: pointer; float: left; z-index: 2;padding: 0 5px 0 5px; margin-right: 0; }\n#branch-banner .content { width:100%; overflow: hidden; height: " + banner_utils.bannerHeight + 
  "; background: rgba(255, 255, 255, 0.95); color: #333; " + ("top" === a.position ? "border-bottom" : "border-top") + ': 1px solid #ddd; }\n#branch-banner-close { color: #000; font-size: 24px; top: 14px; opacity: .5; transition: opacity .3s ease; }\n#branch-banner-close:hover { opacity: 1; }\n#branch-banner .title { font-size: 18px; font-weight:bold; color: #555; }\n#branch-banner .description { font-size: 12px; font-weight: normal; color: #777; max-height: 30px; overflow: hidden; }\n#branch-banner .icon { float: left; padding-bottom: 40px; margin-right: 10px; margin-left: 5px; }\n#branch-banner .icon img { width: 63px; height: 63px; margin-right: 0; }\n#branch-banner .reviews { font-size:13px; margin: 1px 0 3px 0; color: #777; }\n#branch-banner .reviews .star { display:inline-block; position: relative; margin-right:0; }\n#branch-banner .reviews .star span { display: inline-block; margin-right: 0; color: #555; position: absolute; top: 0; left: 0; }\n#branch-banner .reviews .review-count { font-size:10px; }\n#branch-banner .reviews .star .half { width: 50%; overflow: hidden; display: block; }\n#branch-banner .content .left { padding: 6px 5px 6px 5px; }\n#branch-banner .vertically-align-middle { top: 50%; transform: translateY(-50%); -webkit-transform: translateY(-50%); -ms-transform: translateY(-50%); }\n#branch-banner .details > * { display: block; }\n#branch-banner .content .left { height: 63px; }\n#branch-banner .content .right { float: right; height: 63px; margin-bottom: 50px; padding-top: 22px; z-index: 1; }\n#branch-banner .right > div { float: left; }\n#branch-banner-action { top: 17px; }\n#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }\n#branch-banner .theme-dark.content { background: rgba(51, 51, 51, 0.95); }\n#branch-banner .theme-dark #branch-banner-close{ color: #fff; text-shadow: 0 1px 1px rgba(0, 0, 0, .15); }\n#branch-banner .theme-dark .details { text-shadow: 0 1px 1px rgba(0, 0, 0, .15); }\n#branch-banner .theme-dark .title { color: #fff; }\n#branch-banner .theme-dark .description { color: #fff; }\n#branch-banner .theme-dark .reviews { color: #888; }\n#branch-banner .theme-dark .reviews .star span{ color: #fff; }\n#branch-banner .theme-dark .reviews .review-count{ color: #fff; }\n';
}, desktop:"#branch-banner { position: fixed; min-width: 600px; }\n#branch-sms-block * { vertical-align: bottom; font-size: 15px; }\n#branch-sms-block { display: inline-block; }\n#branch-banner input{ border: 1px solid #ccc;  font-weight: 400;  border-radius: 4px; height: 30px; padding: 5px 7px 4px; width: 145px; font-size: 14px;}\n#branch-banner input:focus { outline: none; }\n#branch-banner input.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }\n#branch-banner .branch-icon-wrapper { width:25px; height: 25px; vertical-align: middle; display: inline-block; margin-top: -18px; }\n@keyframes branch-spinner { 0% { transform: rotate(0deg); -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); } 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg); -ms-transform: rotate(360deg); } }\n@-webkit-keyframes branch-spinner { 0% { transform: rotate(0deg); -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); } 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg); -ms-transform: rotate(360deg); } }\n#branch-spinner { -webkit-animation: branch-spinner 1s ease-in-out infinite; animation: branch-spinner 1s ease-in-out infinite; transition: all 0.7s ease-in-out; border:2px solid #ddd; border-bottom-color:#428bca; width:80%; height:80%; border-radius:50%; -webkit-font-smoothing: antialiased !important; }\n#branch-banner .theme-dark input { border-color: transparent; }\n", 
nonie:"#branch-banner .checkmark { stroke: #428bca; stroke-dashoffset: 745.74853515625; stroke-dasharray: 745.74853515625; -webkit-animation: dash 2s ease-out forwards; animation: dash 2s ease-out forwards; }\n@-webkit-keyframes dash { 0% { stroke-dashoffset: 745.748535 15625; } 100% { stroke-dashoffset: 0; } }\n@keyframes dash { 0% { stroke-dashoffset: 745.74853515625; } 100% { stroke-dashoffset: 0; } }\n", ie:"#branch-banner .checkmark { color: #428bca; font-size: 22px; }\n", mobile:"#branch-banner { position: absolute; }\n#branch-banner .content .left .details .title { font-size: 12px; }\n#branch-mobile-action { white-space: nowrap; }\n#branch-banner .content .left .details .description { font-size: 11px; font-weight: normal; }\n@media only screen and (min-device-width: 320px) and (max-device-width: 350px) { #branch-banner .content .right { max-width: 120px; } }\n@media only screen and (min-device-width: 351px) and (max-device-width: 400px) and (orientation: landscape) { #branch-banner .content .right { max-width: 150px; } }\n@media only screen and (min-device-width: 401px) and (max-device-width: 480px) and (orientation: landscape) { #branch-banner .content .right { max-width: 180px; } }\n", 
ios:"", android:"#branch-banner #branch-banner-close,#branch-banner .theme-dark #branch-banner-close { height:17px; width: 17px; text-align: center; font-size: 15px; top: 24px;  border-radius:14px; border:0; line-height:14px; color:#b1b1b3; background:#efefef; padding: 0; opacity: 1; }\n#branch-banner .button { top: 0; text-decoration:none; border-bottom: 3px solid #A4C639; padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; margin-top: 2px;  font-weight: bold; background-color: #A4C639; border-radius: 5px; }\n#branch-banner .button:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }\n", 
blackberry:"", windows_phone:"", kindle:""};
banner_css.iframe = "body { -webkit-transition: all " + 1.5 * banner_utils.animationSpeed / 1E3 + "s ease; transition: all 0" + 1.5 * banner_utils.animationSpeed / 1E3 + "s ease; }\n#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%; left: 0; right: 0; border: 0; height: " + banner_utils.bannerHeight + "; z-index: 99999; -webkit-transition: all " + banner_utils.animationSpeed / 1E3 + "s ease; transition: all 0" + banner_utils.animationSpeed / 1E3 + "s ease; }\n";
banner_css.inneriframe = "body { margin: 0; }\n";
banner_css.iframe_position = function(a, b) {
  return "#branch-banner-iframe { position: " + ("top" !== b || a ? "fixed" : "absolute") + "; }\n";
};
banner_css.css = function(a, b) {
  var c = banner_css.banner(a), d = utils.mobileUserAgent();
  "ios" !== d && "ipad" !== d || !a.showiOS ? "android" === d && a.showAndroid ? c += banner_css.mobile + banner_css.android : "blackberry" === d && a.showBlackberry ? c += banner_css.mobile + banner_css.blackberry : "windows_phone" === d && a.showWindowsPhone ? c += banner_css.mobile + banner_css.windows_phone : "kindle" === d && a.showKindle ? c += banner_css.mobile + banner_css.kindle : (c += banner_css.desktop, c = window.ActiveXObject ? c + banner_css.ie : c + banner_css.nonie) : c += banner_css.mobile + 
  banner_css.ios;
  c += a.customCSS;
  a.iframe && (c += banner_css.inneriframe, d = document.createElement("style"), d.type = "text/css", d.id = "branch-iframe-css", d.innerHTML = banner_css.iframe + (utils.mobileUserAgent() ? banner_css.iframe_position(a.mobileSticky, a.position) : banner_css.iframe_position(a.desktopSticky, a.position)), document.head.appendChild(d));
  d = document.createElement("style");
  d.type = "text/css";
  d.id = "branch-css";
  d.innerHTML = c;
  (a.iframe ? b.contentWindow.document : document).head.appendChild(d);
  "top" === a.position ? b.style.top = "-" + banner_utils.bannerHeight : "bottom" === a.position && (b.style.bottom = "-" + banner_utils.bannerHeight);
};
// Input 12
var banner_html = {banner:function(a, b) {
  var c = '<div class="content' + (a.theme ? " theme-" + a.theme : "") + '"><div class="right">' + b + '</div><div class="left">' + (a.disableHide ? "" : '<div id="branch-banner-close" class="branch-animation">&times;</div>') + '<div class="icon"><img src="' + a.icon + '"></div><div class="details vertically-align-middle"><div class="title">' + a.title + "</div>", d;
  if (a.rating || a.reviewCount) {
    if (a.rating) {
      d = "";
      for (var e = 0;5 > e;e++) {
        d += '<span class="star"><svg class="star" fill="#555555" height="12" viewBox="3 2 20 19" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/><path d="M0 0h24v24H0z" fill="none"/><foreignObject display="none"><span class="star">\u2606</span></foreignObject></svg>', a.rating > e && (d += e + 1 > 
        a.rating && a.rating % 1 ? '<span class="half"><svg fill="#555555" height="12" viewBox="3 2 20 19" width="12" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path d="M0 0h24v24H0V0z" id="a"/></defs><clipPath id="b"><use overflow="visible" xlink:href="#a"/></clipPath><path clip-path="url(#b)" d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg><foreignObject display="none"><span class="half">\u2605</span></foreignObject></span>' : 
        '<span class="full"><svg fill="#555555" height="12" viewBox="3 2 20 19" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/><path d="M0 0h24v24H0z" fill="none"/><foreignObject display="none"><span class="full">\u2605</span></foreignObject></svg> </span>'), d += "</span>";
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
}, mobileAction:function(a, b, c) {
  return '<a id="branch-mobile-action" class="button" href="#" target="_parent">' + ((session.get(b) || {}).has_app ? a.openAppButtonText : a.downloadAppButtonText) + "</a>";
}, desktopAction:function(a) {
  return '<div class="branch-icon-wrapper" id="branch-loader-wrapper" style="opacity: 0;"><div id="branch-spinner"></div></div><div id="branch-sms-block"><form id="sms-form"><input type="phone" class="branch-animation" name="branch-sms-phone" id="branch-sms-phone" placeholder="' + a.phonePreviewText + '"><button type="submit" id="branch-sms-send" class="branch-animation button">' + a.sendLinkText + "</button></form></div>";
}, checkmark:function() {
  return window.ActiveXObject ? '<span class="checkmark">&#x2713;</span>' : '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 98.5 98.5" enable-background="new 0 0 98.5 98.5" xml:space="preserve"><path class="checkmark" fill="none" stroke-width="8" stroke-miterlimit="10" d="M81.7,17.8C73.5,9.3,62,4,49.2,4C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"/></svg>';
}, iframe:function(a, b) {
  var c = document.createElement("iframe");
  c.src = "about:blank";
  c.style.overflow = "hidden";
  c.scrolling = "no";
  c.id = "branch-banner-iframe";
  c.className = "branch-animation";
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
}, markup:function(a, b, c) {
  b = '<div id="branch-sms-form-container">' + (utils.mobileUserAgent() ? banner_html.mobileAction(a, b, c) : banner_html.desktopAction(a)) + "</div>";
  return a.iframe ? banner_html.iframe(a, b) : banner_html.div(a, b);
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
  if (!banner_utils.shouldAppend(d, b)) {
    return a._publishEvent("willNotShowBanner"), null;
  }
  a._publishEvent("willShowBanner");
  var e = banner_html.markup(b, d);
  banner_css.css(b, e);
  c.channel = c.channel || "app banner";
  var f = b.iframe ? e.contentWindow.document : document;
  utils.mobileUserAgent() ? (b.open_app = b.open_app, b.append_deeplink_path = b.append_deeplink_path, b.make_new_link = b.make_new_link, a.deepview(c, b), f.getElementById("branch-mobile-action").onclick = function(b) {
    b.preventDefault();
    a.deepviewCta();
  }) : f.getElementById("sms-form").addEventListener("submit", function(d) {
    d.preventDefault();
    sendSMS(f, a, b, c);
  });
  var g = banner_utils.getBodyStyle("margin-top"), k = document.body.style.marginTop, h = banner_utils.getBodyStyle("margin-bottom"), l = document.body.style.marginBottom, m = f.getElementById("branch-banner-close"), n = function(a) {
    setTimeout(function() {
      banner_utils.removeElement(e);
      banner_utils.removeElement(document.getElementById("branch-css"));
      a();
    }, banner_utils.animationSpeed + banner_utils.animationDelay);
    setTimeout(function() {
      "top" === b.position ? document.body.style.marginTop = k : "bottom" === b.position && (document.body.style.marginBottom = l);
      banner_utils.removeClass(document.body, "branch-banner-is-active");
    }, banner_utils.animationDelay);
    "top" === b.position ? e.style.top = "-" + banner_utils.bannerHeight : "bottom" === b.position && (e.style.bottom = "-" + banner_utils.bannerHeight);
    "number" === typeof b.forgetHide ? d.set("hideBanner", banner_utils.getDate(b.forgetHide), !0) : d.set("hideBanner", !0, !0);
  };
  m && (m.onclick = function(b) {
    b.preventDefault();
    a._publishEvent("willCloseBanner");
    n(function() {
      a._publishEvent("didCloseBanner");
    });
  });
  banner_utils.addClass(document.body, "branch-banner-is-active");
  "top" === b.position ? document.body.style.marginTop = banner_utils.addCSSLengths(banner_utils.bannerHeight, g) : "bottom" === b.position && (document.body.style.marginBottom = banner_utils.addCSSLengths(banner_utils.bannerHeight, h));
  setTimeout(function() {
    "top" === b.position ? e.style.top = "0" : "bottom" === b.position && (e.style.bottom = "0");
    a._publishEvent("didShowBanner");
  }, banner_utils.animationDelay);
  return n;
};
// Input 14
var branch_view = {};
function renderHtmlBlob(a, b, c) {
  var d, e, f = c ? "OPEN" : "GET";
  d = /<script type="application\/json">((.|\s)*?)<\/script>/;
  if (e = b.match(d)) {
    if (e = e[1], b = b.replace(d, ""), d = safejson.parse(e), c && d && d.ctaText && d.ctaText.has_app ? f = d.ctaText.has_app : d && d.ctaText && d.ctaText.no_app && (f = d.ctaText.no_app), d && d.injectorSelector) {
      if (a = document.querySelector(d.injectorSelector)) {
        a.innerHTML = "";
      } else {
        return null;
      }
    }
  }
  d = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
  if (e = b.match(d)) {
    e = e[1], b = b.replace(d, ""), c = document.createElement("script"), c.innerHTML = e, document.body.appendChild(c);
  }
  a = a || document.body;
  var g = document.createElement("div");
  g.id = "branch-banner-container";
  g.className = "branch-animation";
  g.innerHTML = b;
  g.querySelector("#branch-mobile-action").innerHTML = f;
  a.appendChild(g);
  banner_utils.addClass(g, "branch-banner-is-active");
  setTimeout(function() {
    g.style.top = "0";
  }, 100);
  return g;
}
branch_view.handleBranchViewData = function(a, b, c, d, e) {
  c = c || {};
  c.feature = "journeys";
  c = utils.cleanLinkData(c);
  if (!(document.getElementById("branch-banner") || document.getElementById("branch-banner-iframe") || document.getElementById("branch-banner-container"))) {
    var f = document.createElement("div");
    f.id = "branch-banner";
    document.body.insertBefore(f, null);
    banner_utils.addClass(f, "branch-banner-is-active");
    if (!d.get("hideBanner", !0)) {
      if (b.html) {
        return renderHtmlBlob(document.body, b.html, e);
      }
      if (b.url) {
        var g = function(a, b) {
          if (a && b) {
            setTimeout(function() {
              banner_utils.removeClass(b.querySelector("#branch-banner"), "branch-animation-out");
              banner_utils.addClass(b.querySelector("#branch-banner"), "branch-animation-in");
            }, 250);
            var c = b.querySelectorAll("#branch-mobile-action");
            Array.prototype.forEach.call(c, function(b) {
              b.addEventListener("click", function(b) {
                a();
                k();
              });
            });
            c = b.querySelectorAll(".branch-banner-continue");
            Array.prototype.forEach.call(c, function(a) {
              a.addEventListener("click", function(a) {
                k();
                d.set("hideBanner", banner_utils.getDate(1), !0);
              });
            });
            c = b.querySelectorAll(".branch-banner-close");
            Array.prototype.forEach.call(c, function(a) {
              a.addEventListener("click", function(a) {
                k();
                d.set("hideBanner", banner_utils.getDate(1), !0);
              });
            });
          }
        }, k = function() {
          banner_utils.addClass(h.querySelector("#branch-banner"), "branch-animation-out");
          banner_utils.removeClass(h.querySelector("#branch-banner"), "branch-animation-in");
          setTimeout(function() {
            h.parentElement.removeChild(h);
          }, 250);
        }, h = null, l = null, m = "branch_view_callback__" + jsonp_callback_index++;
        c = encodeURIComponent(utils.base64encode(goog.json.serialize(c)));
        b = b.url + "&callback=" + m;
        a.XHRRequest(b + ("&data=" + c), {}, "GET", {}, function(a, b) {
          var c = !1;
          if (!a && b) {
            var d = window.setTimeout(function() {
              window[m] = function() {
              };
            }, TIMEOUT);
            window[m] = function(a) {
              window.clearTimeout(d);
              c || (l = a, g(l, h));
            };
            h = renderHtmlBlob(document.body, b, e);
            if (null === h) {
              c = !0;
              return;
            }
            g(l, h);
          }
          document.body.removeChild(f);
        }, !0);
      }
    }
  }
};
// Input 15
var default_branch, callback_params = {NO_CALLBACK:0, CALLBACK_ERR:1, CALLBACK_ERR_DATA:2}, init_states = {NO_INIT:0, INIT_PENDING:1, INIT_FAILED:2, INIT_SUCCEEDED:3}, wrap = function(a, b, c) {
  return function() {
    var d = this, e, f, g = arguments[arguments.length - 1];
    a === callback_params.NO_CALLBACK || "function" !== typeof g ? (f = function(a) {
      if (a) {
        throw a;
      }
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
          return h(Error(utils.message(utils.messages.initFailed)), null);
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
};
Branch.prototype._api = function(a, b, c) {
  this.app_id && (b.app_id = this.app_id);
  this.branch_key && (b.branch_key = this.branch_key);
  (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && this.session_id && (b.session_id = this.session_id);
  (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && this.identity_id && (b.identity_id = this.identity_id);
  (a.params && a.params.link_click_id || a.queryPart && a.queryPart.link_click_id) && this.link_click_id && (b.link_click_id = this.link_click_id);
  (a.params && a.params.sdk || a.queryPart && a.queryPart.sdk) && this.sdk && (b.sdk = this.sdk);
  (a.params && a.params.browser_fingerprint_id || a.queryPart && a.queryPart.browser_fingerprint_id) && this.browser_fingerprint_id && (b.browser_fingerprint_id = this.browser_fingerprint_id);
  return this._server.request(a, b, this._storage, function(a, b) {
    c(a, b);
  });
};
Branch.prototype._referringLink = function() {
  var a = session.get(this._storage);
  return (a = a && a.referring_link) ? a : (a = this._storage.get("click_id")) ? config.link_service_endpoint + "/c/" + a : null;
};
Branch.prototype._publishEvent = function(a) {
  for (var b = 0;b < this._listeners.length;b++) {
    this._listeners[b].event && this._listeners[b].event !== a || this._listeners[b].listener(a);
  }
};
Branch.prototype.init = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b, c) {
  var d = this;
  d.init_state = init_states.INIT_PENDING;
  utils.isKey(b) ? d.branch_key = b : d.app_id = b;
  c = c && "function" === typeof c ? {} : c;
  var e = function(a) {
    a.session_id && (d.session_id = a.session_id.toString());
    a.identity_id && (d.identity_id = a.identity_id.toString());
    a.link && (d.sessionLink = a.link);
    a.referring_link && (a.referring_link = utils.processReferringLink(a.referring_link));
    !a.click_id && a.referring_link && (a.click_id = utils.clickIdFromLink(a.referring_link));
    d.browser_fingerprint_id = a.browser_fingerprint_id;
    return a;
  };
  b = session.get(d._storage);
  var f = utils.getParamValue("_branch_match_id") || utils.hashValue("r"), g = !b || !b.identity_id;
  d._branchViewEnabled = !!d._storage.get("branch_view_enabled");
  var k = function(a, b) {
    var c = {sdk:config.version}, e = a || session.get(d._storage) || {}, f = session.get(d._storage, !0) || {};
    f.browser_fingerprint_id && (c._t = f.browser_fingerprint_id);
    d._api(resources._r, c, function(a, b) {
      b && (e.browser_fingerprint_id = b);
    });
    d._api(resources.hasApp, {browser_fingerprint_id:e.browser_fingerprint_id}, function(a, c) {
      c && !e.has_app && (e.has_app = !0, session.update(d._storage, e), d._publishEvent("didDownloadApp"));
      b && b(a, e);
    });
  }, h = function(b, c) {
    c && (c = e(c), session.set(d._storage, c, g), d.init_state = init_states.INIT_SUCCEEDED, c.data_parsed = c.data ? safejson.parse(c.data) : null);
    if (b) {
      return d.init_state = init_states.INIT_FAILED, a(b, c && utils.whiteListSessionData(c));
    }
    d._api(resources.event, {event:"pageview", metadata:{url:document.URL, user_agent:navigator.userAgent, language:navigator.language}}, function(b, e) {
      b || "object" !== typeof e || (d._branchViewEnabled = !!e.branch_view_enabled, d._storage.set("branch_view_enabled", d._branchViewEnabled), e.hasOwnProperty("branch_view_data") && branch_view.handleBranchViewData(d._server, e.branch_view_data, d._branchViewData, d._storage, c.has_app));
      try {
        a(b, c && utils.whiteListSessionData(c));
      } catch (f) {
      }
    });
  }, l = function() {
    var a, b;
    "undefined" !== typeof document.hidden ? (a = "hidden", b = "visibilitychange") : "undefined" !== typeof document.mozHidden ? (a = "mozHidden", b = "mozvisibilitychange") : "undefined" !== typeof document.msHidden ? (a = "msHidden", b = "msvisibilitychange") : "undefined" !== typeof document.webkitHidden && (a = "webkitHidden", b = "webkitvisibilitychange");
    b && document.addEventListener(b, function() {
      document[a] || k(null, null);
    }, !1);
  };
  if (b && b.session_id && !f) {
    l(), k(b, h);
  } else {
    b = {sdk:config.version};
    var m = session.get(d._storage, !0) || {};
    m.browser_fingerprint_id && (b._t = m.browser_fingerprint_id);
    d._api(resources._r, b, function(a, b) {
      if (a) {
        return h(a, null);
      }
      d._api(resources.open, {link_identifier:f, is_referrable:1, browser_fingerprint_id:b, options:c}, function(a, b) {
        a || "object" !== typeof b || (d._branchViewEnabled = !!b.branch_view_enabled, d._storage.set("branch_view_enabled", d._branchViewEnabled), b.hasOwnProperty("branch_view_data") && branch_view.handleBranchViewData(d._server, b.branch_view_data, d._branchViewData, d._storage, b.has_app), f && (b.click_id = f));
        l();
        h(a, b);
      });
    });
  }
}, !0);
Branch.prototype.data = wrap(callback_params.CALLBACK_ERR_DATA, function(a) {
  var b = utils.whiteListSessionData(session.get(this._storage));
  b.referring_link = this._referringLink();
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
Branch.prototype.track = wrap(callback_params.CALLBACK_ERR, function(a, b, c, d) {
  var e = this;
  c || (c = {});
  e._api(resources.event, {event:b, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, c || {})}, function(b, c) {
    b || "object" !== typeof c || (e._branchViewEnabled = !!c.branch_view_enabled, e._storage.set("branch_view_enabled", e._branchViewEnabled), c.hasOwnProperty("branch_view_data") && branch_view.handleBranchViewData(e._server, c.branch_view_data, e._branchViewData, e._storage, c.has_app));
    "function" === typeof a && a.apply(this, arguments);
  });
});
Branch.prototype.link = wrap(callback_params.CALLBACK_ERR_DATA, function(a, b) {
  this._api(resources.link, utils.cleanLinkData(b), function(b, d) {
    a(b, d && d.url);
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
  g && !d.make_new_link ? e(g.substring(g.lastIndexOf("/") + 1, g.length)) : f._api(resources.link, utils.cleanLinkData(c), function(b, c) {
    if (b) {
      return a(b);
    }
    var d = c.url;
    /(bnc.lt\/|app\.link\/)/.test(d) || (d = config.link_service_endpoint + "/" + utils.extractDeeplinkPath(d));
    f._api(resources.linkClick, {link_url:d, click:"click"}, function(b, c) {
      if (b) {
        return a(b);
      }
      f._storage.set("click_id", c.click_id);
      e(c.click_id);
    });
  });
});
Branch.prototype.deepview = wrap(callback_params.CALLBACK_ERR, function(a, b, c) {
  var d = this;
  c || (c = {});
  var e = config.link_service_endpoint + "/a/" + d.branch_key, f = !0, g;
  for (g in b) {
    b.hasOwnProperty(g) && "data" !== g && (f ? (e += "?", f = !1) : e += "&", e += encodeURIComponent(g) + "=" + encodeURIComponent(b[g]));
  }
  b = utils.cleanLinkData(b);
  if (c.open_app || null === c.open_app || "undefined" === typeof c.open_app) {
    b.open_app = !0;
  }
  b.append_deeplink_path = !!c.append_deeplink_path;
  (f = d._referringLink()) && !c.make_new_link && (b.link_click_id = f.substring(f.lastIndexOf("/") + 1, f.length));
  this._api(resources.deepview, b, function(b, c) {
    if (b) {
      return d._deepviewCta = function() {
        d._windowRedirect(e);
      }, a(b);
    }
    "function" === typeof c && (d._deepviewCta = c);
    a(null);
  });
});
Branch.prototype._windowRedirect = function(a) {
  window.location = a;
};
Branch.prototype.deepviewCta = wrap(callback_params.NO_CALLBACK, function(a) {
  if ("undefined" === typeof this._deepviewCta) {
    throw Error("Cannot call Deepview CTA, please call branch.deepview() first.");
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
  this._api(resources.credits, {}, a);
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
  "function" === typeof a && void 0 === b && (b = a);
  b && this._listeners.push({listener:b, event:a || null});
};
Branch.prototype.removeListener = function(a) {
  a && (this._listeners = this._listeners.filter(function(b) {
    if (b.listener !== a) {
      return b;
    }
  }));
};
Branch.prototype.setBranchViewData = wrap(callback_params.NO_CALLBACK, function(a, b) {
  b = b || {};
  try {
    this._branchViewData = JSON.parse(JSON.stringify(b));
  } finally {
    this._branchViewData = this._branchViewData || {};
  }
  a();
});
Branch.prototype.banner = wrap(callback_params.NO_CALLBACK, function(a, b, c) {
  this.setBranchViewData(c);
  "undefined" === typeof b.showAgain && "undefined" !== typeof b.forgetHide && (b.showAgain = b.forgetHide);
  var d = {icon:b.icon || "", title:b.title || "", description:b.description || "", reviewCount:"number" === typeof b.reviewCount && 0 < b.reviewCount ? Math.floor(b.reviewCount) : null, rating:"number" === typeof b.rating && 5 >= b.rating && 0 < b.rating ? Math.round(2 * b.rating) / 2 : null, openAppButtonText:b.openAppButtonText || "View in app", downloadAppButtonText:b.downloadAppButtonText || "Download App", sendLinkText:b.sendLinkText || "Send Link", phonePreviewText:b.phonePreviewText || "(999) 999-9999", 
  iframe:"undefined" === typeof b.iframe ? !0 : b.iframe, showiOS:"undefined" === typeof b.showiOS ? !0 : b.showiOS, showiPad:"undefined" === typeof b.showiPad ? !0 : b.showiPad, showAndroid:"undefined" === typeof b.showAndroid ? !0 : b.showAndroid, showBlackberry:"undefined" === typeof b.showBlackberry ? !0 : b.showBlackberry, showWindowsPhone:"undefined" === typeof b.showWindowsPhone ? !0 : b.showWindowsPhone, showKindle:"undefined" === typeof b.showKindle ? !0 : b.showKindle, showDesktop:"undefined" === 
  typeof b.showDesktop ? !0 : b.showDesktop, disableHide:!!b.disableHide, forgetHide:"number" === typeof b.forgetHide ? b.forgetHide : !!b.forgetHide, respectDNT:"undefined" === typeof b.respectDNT ? !1 : b.respectDNT, position:b.position || "top", customCSS:b.customCSS || "", mobileSticky:"undefined" === typeof b.mobileSticky ? !1 : b.mobileSticky, desktopSticky:"undefined" === typeof b.desktopSticky ? !0 : b.desktopSticky, theme:"string" === typeof b.theme && -1 < utils.bannerThemes.indexOf(b.theme) ? 
  b.theme : utils.bannerThemes[0], buttonBorderColor:b.buttonBorderColor || "", buttonBackgroundColor:b.buttonBackgroundColor || "", buttonFontColor:b.buttonFontColor || "", buttonBorderColorHover:b.buttonBorderColorHover || "", buttonBackgroundColorHover:b.buttonBackgroundColorHover || "", buttonFontColorHover:b.buttonFontColorHover || "", make_new_link:!!b.make_new_link, open_app:!!b.open_app};
  "undefined" !== typeof b.showMobile && (d.showiOS = b.showMobile, d.showAndroid = b.showMobile, d.showBlackberry = b.showMobile, d.showWindowsPhone = b.showMobile, d.showKindle = b.showMobile);
  this.closeBannerPointer = banner(this, d, c, this._storage);
  a();
});
Branch.prototype.closeBanner = wrap(0, function(a) {
  if (this.closeBannerPointer) {
    var b = this;
    this._publishEvent("willCloseBanner");
    this.closeBannerPointer(function() {
      b._publishEvent("didCloseBanner");
    });
  }
  a();
});
// Input 16
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
