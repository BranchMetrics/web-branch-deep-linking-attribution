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
goog.module.declareTestMethods = function() {
  if (!goog.isInModuleLoader_()) {
    throw Error("goog.module.declareTestMethods must be called from within a goog.module");
  }
  goog.moduleLoaderState_.declareTestMethods = !0;
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
        return goog.included_[b] = !0, goog.writeScripts_(), null;
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
goog.identityFunction = function(a, b) {
  return a;
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
goog.DEPENDENCIES_ENABLED && (goog.included_ = {}, goog.dependencies_ = {pathIsModule:{}, nameToPath:{}, requires:{}, visited:{}, written:{}, deferred:{}}, goog.inHtmlDocument_ = function() {
  var a = goog.global.document;
  return "undefined" != typeof a && "write" in a;
}, goog.findBasePath_ = function() {
  if (goog.global.CLOSURE_BASE_PATH) {
    goog.basePath = goog.global.CLOSURE_BASE_PATH;
  } else {
    if (goog.inHtmlDocument_()) {
      for (var a = goog.global.document.getElementsByTagName("script"), b = a.length - 1;0 <= b;--b) {
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
}, goog.IS_OLD_IE_ = !goog.global.atob && goog.global.document && goog.global.document.all, goog.importModule_ = function(a) {
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
  return(a = goog.getPathFromDeps_(a)) && goog.dependencies_.pathIsModule[a] ? goog.basePath + a in goog.dependencies_.deferred : !1;
}, goog.allDepsAreAvailable_ = function(a) {
  if ((a = goog.getPathFromDeps_(a)) && a in goog.dependencies_.requires) {
    for (var b in goog.dependencies_.requires[a]) {
      if (!goog.isProvided_(b) && !goog.isDeferredModule_(b)) {
        return!1;
      }
    }
  }
  return!0;
}, goog.maybeProcessDeferredPath_ = function(a) {
  if (a in goog.dependencies_.deferred) {
    var b = goog.dependencies_.deferred[a];
    delete goog.dependencies_.deferred[a];
    goog.globalEval(b);
  }
}, goog.loadModule = function(a) {
  var b = goog.moduleLoaderState_;
  try {
    goog.moduleLoaderState_ = {moduleName:void 0, declareTestMethods:!1};
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
    if (goog.moduleLoaderState_.declareTestMethods) {
      for (var e in c) {
        if (0 === e.indexOf("test", 0) || "tearDown" == e || "setUp" == e || "setUpPage" == e || "tearDownPage" == e) {
          goog.global[e] = c[e];
        }
      }
    }
  } finally {
    goog.moduleLoaderState_ = b;
  }
}, goog.loadModuleFromSource_ = function(a) {
  eval(a);
  return{};
}, goog.writeScriptTag_ = function(a, b) {
  if (goog.inHtmlDocument_()) {
    var c = goog.global.document;
    if ("complete" == c.readyState) {
      if (/\bdeps.js$/.test(a)) {
        return!1;
      }
      throw Error('Cannot write "' + a + '" after document load');
    }
    var d = goog.IS_OLD_IE_;
    void 0 === b ? d ? (d = " onreadystatechange='goog.onScriptLoad_(this, " + ++goog.lastNonModuleScriptIndex_ + ")' ", c.write('<script type="text/javascript" src="' + a + '"' + d + ">\x3c/script>")) : c.write('<script type="text/javascript" src="' + a + '">\x3c/script>') : c.write('<script type="text/javascript">' + b + "\x3c/script>");
    return!0;
  }
  return!1;
}, goog.lastNonModuleScriptIndex_ = 0, goog.onScriptLoad_ = function(a, b) {
  "complete" == a.readyState && goog.lastNonModuleScriptIndex_ == b && goog.loadQueuedModules_();
  return!0;
}, goog.writeScripts_ = function() {
  function a(e) {
    if (!(e in d.written)) {
      if (!(e in d.visited) && (d.visited[e] = !0, e in d.requires)) {
        for (var f in d.requires[e]) {
          if (!goog.isProvided_(f)) {
            if (f in d.nameToPath) {
              a(d.nameToPath[f]);
            } else {
              throw Error("Undefined nameToPath for " + f);
            }
          }
        }
      }
      e in c || (c[e] = !0, b.push(e));
    }
  }
  var b = [], c = {}, d = goog.dependencies_, e;
  for (e in goog.included_) {
    d.written[e] || a(e);
  }
  for (var f = 0;f < b.length;f++) {
    e = b[f], goog.dependencies_.written[e] = !0;
  }
  var g = goog.moduleLoaderState_;
  goog.moduleLoaderState_ = null;
  for (f = 0;f < b.length;f++) {
    if (e = b[f]) {
      d.pathIsModule[e] ? goog.importModule_(goog.basePath + e) : goog.importScript_(goog.basePath + e);
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
goog.retrieveAndExecModule_ = function(a) {
  if (!COMPILED) {
    var b = a;
    a = goog.normalizePath_(a);
    var c = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_, d = null, e = new goog.global.XMLHttpRequest;
    e.onload = function() {
      d = this.responseText;
    };
    e.open("get", a, !1);
    e.send();
    d = e.responseText;
    if (null != d) {
      e = goog.wrapModule_(a, d), goog.IS_OLD_IE_ ? (goog.dependencies_.deferred[b] = e, goog.queuedModules_.push(b)) : c(a, e);
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
  return!!a[goog.UID_PROPERTY_];
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
  return+new Date;
};
goog.globalEval = function(a) {
  if (goog.global.execScript) {
    goog.global.execScript(a, "JavaScript");
  } else {
    if (goog.global.eval) {
      if (null == goog.evalWorksForGlobals_ && (goog.global.eval("var _et_ = 1;"), "undefined" != typeof goog.global._et_ ? (delete goog.global._et_, goog.evalWorksForGlobals_ = !0) : goog.evalWorksForGlobals_ = !1), goog.evalWorksForGlobals_) {
        goog.global.eval(a);
      } else {
        var b = goog.global.document, c = b.createElement("script");
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
    return d in b ? b[d] : a;
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
    for (var g = Array(arguments.length - 2), h = 2;h < arguments.length;h++) {
      g[h - 2] = arguments[h];
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
var config = {link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:1};
// Input 2
var Queue = function() {
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
    1 == a.length && b();
  };
};
// Input 3
goog.json = {};
goog.json.USE_NATIVE_JSON = !1;
goog.json.isValid = function(a) {
  return/^\s*$/.test(a) ? !1 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""));
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
  return(new goog.json.Serializer(b)).serialize(a);
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
  switch(typeof a) {
    case "string":
      this.serializeString_(a, b);
      break;
    case "number":
      this.serializeNumber_(a, b);
      break;
    case "boolean":
      b.push(a);
      break;
    case "undefined":
      b.push("null");
      break;
    case "object":
      if (null == a) {
        b.push("null");
        break;
      }
      if (goog.isArray(a)) {
        this.serializeArray(a, b);
        break;
      }
      this.serializeObject_(a, b);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof a);;
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(a, b) {
  b.push('"', a.replace(goog.json.Serializer.charsToReplace_, function(a) {
    if (a in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[a];
    }
    var b = a.charCodeAt(0), e = "\\u";
    16 > b ? e += "000" : 256 > b ? e += "00" : 4096 > b && (e += "0");
    return goog.json.Serializer.charToJsonCharCache_[a] = e + b.toString(16);
  }), '"');
};
goog.json.Serializer.prototype.serializeNumber_ = function(a, b) {
  b.push(isFinite(a) && !isNaN(a) ? a : "null");
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
// Input 4
var utils = {}, DEBUG = !0;
utils.messages = {missingParam:"API request $1 missing parameter $2", invalidType:"API request $1, parameter $2 is not $3", nonInit:"Branch SDK not initialized", existingInit:"Branch SDK already initilized", missingAppId:"Missing Branch app ID", callBranchInitFirst:"Branch.init must be called first", timeout:"Request timed out"};
utils.error = function(a, b) {
  throw Error(utils.message(a, b));
};
utils.message = function(a, b) {
  var c = a.replace(/\$(\d)/g, function(a, c) {
    return b[parseInt(c) - 1];
  });
  DEBUG && console && console.log(c);
  return c;
};
utils.readStore = function() {
  try {
    return goog.json.parse(sessionStorage.getItem("branch_session"));
  } catch (a) {
    return{};
  }
};
utils.whiteListSessionData = function(a) {
  var b = ["data", "referring_identity", "identity", "has_app"], c = {}, d;
  for (d in a) {
    -1 < b.indexOf(d) && (c[d] = a[d]);
  }
  return c;
};
utils.store = function(a) {
  sessionStorage.setItem("branch_session", goog.json.serialize(a));
};
utils.storeKeyValue = function(a, b) {
  var c = utils.readStore();
  c[a] = b;
  utils.store(c);
};
utils.readKeyValue = function(a) {
  return utils.readStore()[a];
};
utils.hasApp = function() {
  return utils.readKeyValue("has_app");
};
utils.merge = function(a, b) {
  for (var c in b) {
    b.hasOwnProperty(c) && (a[c] = b[c]);
  }
  return a;
};
utils.hashValue = function(a) {
  try {
    return location.hash.match(new RegExp(a + ":([^&]*)"))[1];
  } catch (b) {
  }
};
utils.getParamValue = function(a) {
  try {
    return window.location.search.substring(1).match(new RegExp(a + "=([^&]*)"))[1];
  } catch (b) {
  }
};
utils.urlValue = function(a) {
  return utils.getParamValue(a) || utils.hashValue(a);
};
utils.base64encode = function(a) {
  var b = "", c, d, e, f, g, h, k = 0;
  d = void 0;
  a = a.replace(/\r\n/g, "\n");
  d = "";
  for (e = 0;e < a.length;e++) {
    f = a.charCodeAt(e), 128 > f ? d += String.fromCharCode(f) : (127 < f && 2048 > f ? d += String.fromCharCode(f >> 6 | 192) : (d += String.fromCharCode(f >> 12 | 224), d += String.fromCharCode(f >> 6 & 63 | 128)), d += String.fromCharCode(f & 63 | 128));
  }
  for (a = d;k < a.length;) {
    c = a.charCodeAt(k++), d = a.charCodeAt(k++), e = a.charCodeAt(k++), f = c >> 2, c = (c & 3) << 4 | d >> 4, g = (d & 15) << 2 | e >> 6, h = e & 63, isNaN(d) ? g = h = 64 : isNaN(e) && (h = 64), b = b + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(f) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(g) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(h)
    ;
  }
  return b;
};
// Input 5
var banner = {}, animationSpeed = 250, animationDelay = 20, bannerHeight = "76px", bannerResources = {css:{banner:".branch-animation { -webkit-transition: all " + 1.5 * animationSpeed / 1E3 + "s ease; transition: all 0" + 1.5 * animationSpeed / 1E3 + "s ease; }\n#branch-banner { width: 100%;` z-index: 99999; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all " + animationSpeed / 
1E3 + "s ease; transition: all 0" + animationSpeed / 1E3 + "s ease; }\n#branch-banner * { margin-right: 4px; position: relative; display: inline-block; line-height: 1.2em; vertical-align: top; }\n#branch-banner-close { font-weight: 400; cursor: pointer; }\n#branch-banner .content { width: 100%; overflow: hidden; height: " + bannerHeight + '; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; padding: 6px; }\n#branch-banner .icon img { width: 63px; height: 63px; }\n#branch-banner .details { top: 16px; }\n#branch-banner .details > * { display: block; }\n#branch-banner .right > div { float: right; }\n#branch-banner-action { top: 17px; }\n#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }\n', 
desktop:"#branch-banner { position: fixed; min-width: 600px; }\n#branch-banner-close { color: #aaa; font-size: 20px; top: 18px; }\n#branch-banner-close:hover { color: #000; }\n#branch-banner .left, .right { width: 47%;  top: 0; }\n#branch-banner .title { font-size: 14px; }\n#branch-banner .description { font-size: 12px; font-weight: normal; }\n#branch-sms-block * { vertical-align: bottom; font-size: 15px; }\n#branch-sms-phone { font-weight: 400; border-radius: 4px; height: 30px; border: 1px solid #ccc; padding: 5px 7px 4px; width: 125px; font-size: 14px; }\n#branch-sms-send { cursor: pointer; margin-top: 0px; font-size: 14px; display: inline-block; height: 30px; margin-left: 5px; font-weight: 400; border-radius: 4px; border: 1px solid #ccc; background: #fff; color: #000; padding: 0px 12px; }\n#branch-sms-send:hover { border: 1px solid #BABABA; background: #E0E0E0; }\n#branch-sms-phone:focus, button:focus { outline: none; }\n#branch-sms-phone.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }\n#branch-banner .branch-icon-wrapper { width:25px; height: 25px; vertical-align: middle; position: absolute; margin-top: 3px; }\n@keyframes branch-spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n@-webkit-keyframes branch-spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n#branch-spinner { -webkit-animation: branch-spinner 1s ease-in-out infinite; animation: branch-spinner 1s ease-in-out infinite; transition: all 0.7s ease-in-out; border:2px solid #ddd; border-bottom-color:#428bca; width:80%; height:80%; border-radius:50%; -webkit-font-smoothing: antialiased !important; }\n", 
nonie:"#branch-banner .checkmark { stroke: #428bca; stroke-dashoffset: 745.74853515625; stroke-dasharray: 745.74853515625; -webkit-animation: dash 2s ease-out forwards; animation: dash 2s ease-out forwards; }\n@-webkit-keyframes dash { 0% { stroke-dashoffset: 745.748535 15625; } 100% { stroke-dashoffset: 0; } }\n@keyframes dash { 0% { stroke-dashoffset: 745.74853515625; } 100% { stroke-dashoffset: 0; } }\n", ie:"#branch-banner .checkmark { color: #428bca; font-size: 22px; }\n", mobile:"#branch-banner { position: absolute; }\n#branch-banner .content .left { width: 60%; }\n#branch-banner .content .right { width: 35%; height: 24px; }\n#branch-banner .content .left .details .title { font-size: 12px; }\n#branch-banner a { text-decoration: none; }\n#branch-mobile-action { top: 6px; }\n#branch-banner .content .left .details .description { font-size: 11px; font-weight: normal; }\n", 
ios:"#branch-banner a { color: #428bca; }\n", android:"#branch-banner-close { text-align: center; font-size: 15px; border-radius:14px; border:0; width:17px; height:17px; line-height:14px; color:#b1b1b3; background:#efefef; }\n#branch-mobile-action { text-decoration:none; border-bottom: 3px solid #b3c833; padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; font-weight: bold; background-color: #b3c833; border-radius: 5px; }\n#branch-mobile-action:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }\n", 
iframe:"body { -webkit-transition: all " + 1.5 * animationSpeed / 1E3 + "s ease; transition: all 0" + 1.5 * animationSpeed / 1E3 + "s ease; }\n#branch-banner-iframe { box-shadow: 0 0 1px rgba(0,0,0,0.2); width: 100%; left: 0; right: 0; border: 0; height: " + bannerHeight + "; z-index: 99999; -webkit-transition: all " + animationSpeed / 1E3 + "s ease; transition: all 0" + animationSpeed / 1E3 + "s ease; }\n", inneriframe:"body { margin: 0; }\n", iframe_desktop:"#branch-banner-iframe { position: fixed; }\n", 
iframe_mobile:"#branch-banner-iframe { position: absolute; }\n"}, html:{banner:function(a) {
  return'<div class="content"><div class="left"><div id="branch-banner-close" class="branch-animation">&times;</div><div class="icon"><img src="' + a.icon + '"></div><div class="details"><span class="title">' + a.title + '</span><span class="description">' + a.description + '</span></div></div><div class="right" id="branch-banner-action"></div></div>';
}, mobileAction:function(a) {
  var b = a.openAppButtonText || "View in app";
  a = a.downloadAppButtonText || "Download App";
  return'<a id="branch-mobile-action" href="#" target="_parent">' + (utils.hasApp() ? b : a) + "</a>";
}, desktopAction:'<div id="branch-sms-block"><form id="sms-form"><input type="phone" class="branch-animation" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999"><button type="submit" id="branch-sms-send" class="branch-animation" >Send Link</button></form></div><div class="branch-icon-wrapper" id="branch-loader-wrapper" style="opacity: 0;"><div id="branch-spinner"></div></div>', appendiFrame:function(a) {
  var b = document.createElement("iframe");
  a = "<html><head></head><body>" + a.outerHTML + "</body></html>";
  b.src = "about:blank";
  b.style.overflow = "hidden";
  b.scrolling = "no";
  b.id = "branch-banner-iframe";
  b.className = "branch-animation";
  document.body.appendChild(b);
  bannerResources.utils.branchiFrame().contentWindow.document.open();
  bannerResources.utils.branchiFrame().contentWindow.document.write(a);
  bannerResources.utils.branchiFrame().contentWindow.document.close();
}, checkmark:function() {
  return window.ActiveXObject ? '<span class="checkmark">&#x2713;</span>' : '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 98.5 98.5" enable-background="new 0 0 98.5 98.5" xml:space="preserve"><path class="checkmark" fill="none" stroke-width="8" stroke-miterlimit="10" d="M81.7,17.8C73.5,9.3,62,4,49.2,4C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"/></svg>';
}}, utils:{removeElement:function(a) {
  a && a.parentNode.removeChild(a);
}, mobileUserAgent:function() {
  return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i) ? navigator.userAgent.match(/android/i) ? "android" : "ios" : !1;
}, shouldAppend:function(a) {
  return a.showDesktop && !bannerResources.utils.mobileUserAgent() || a.showMobile && bannerResources.utils.mobileUserAgent();
}, branchBanner:function() {
  return document.getElementById("branch-banner") || bannerResources.utils.branchiFrame().contentWindow.document.getElementById("branch-banner");
}, branchDocument:function() {
  return document.getElementById("branch-banner") ? document : bannerResources.utils.branchiFrame().contentWindow.document;
}, branchiFrame:function() {
  return document.getElementById("branch-banner-iframe");
}}, actions:{sendSMS:function(a, b, c) {
  var d = bannerResources.utils.branchDocument().getElementById("branch-sms-phone"), e = bannerResources.utils.branchDocument().getElementById("branch-sms-send"), f = bannerResources.utils.branchDocument().getElementById("branch-loader-wrapper"), g = bannerResources.utils.branchDocument().getElementById("branch-sms-form-container"), h, k = function() {
    e.removeAttribute("disabled");
    d.removeAttribute("disabled");
    e.style.opacity = "1";
    d.style.opacity = "1";
    f.style.opacity = "0";
  }, n = function() {
    h = bannerResources.utils.branchDocument().createElement("div");
    h.className = "branch-icon-wrapper";
    h.id = "branch-checkmark";
    h.style = "opacity: 0;";
    h.innerHTML = bannerResources.html.checkmark();
    e.style.opacity = "0";
    d.style.opacity = "0";
    f.style.opacity = "0";
    g.appendChild(h);
    setTimeout(function() {
      h.style.opacity = "1";
    }, animationDelay);
    d.value = "";
  }, l = function() {
    k();
    e.style.background = "#FFD4D4";
    d.className = "error";
    setTimeout(function() {
      e.style.background = "#FFFFFF";
      d.className = "";
    }, 2E3);
  };
  if (d) {
    var m = d.value;
    /^\d{7,}$/.test(m.replace(/[\s()+\-\.]|ext/gi, "")) ? (e.setAttribute("disabled", ""), d.setAttribute("disabled", ""), e.style.opacity = ".4", d.style.opacity = ".4", f.style.opacity = "1", d.className = "", a.sendSMS(m, c, b, function(a) {
      a ? l() : (n(), setTimeout(function() {
        g.removeChild(h);
        k();
      }, 3E3));
    })) : l();
  }
}, close:function() {
  setTimeout(function() {
    bannerResources.utils.removeElement(bannerResources.utils.branchBanner());
    bannerResources.utils.removeElement(bannerResources.utils.branchiFrame());
    bannerResources.utils.removeElement(document.getElementById("branch-css"));
  }, animationSpeed + animationDelay);
  setTimeout(function() {
    document.body.style.marginTop = "0px";
  }, animationDelay);
  bannerResources.utils.branchiFrame() ? bannerResources.utils.branchiFrame().style.top = "-" + bannerHeight : bannerResources.utils.branchBanner().style.top = "-" + bannerHeight;
  utils.storeKeyValue("hideBanner", !0);
}}};
banner.bannerMarkup = function(a) {
  if (bannerResources.utils.shouldAppend(a)) {
    var b = document.createElement("div");
    b.id = "branch-banner";
    b.className = "branch-animation";
    b.innerHTML = bannerResources.html.banner(a);
    document.body.className = "branch-animation";
    a.iframe ? bannerResources.html.appendiFrame(b) : document.body.appendChild(b);
  }
};
banner.bannerStyles = function(a) {
  if (bannerResources.utils.shouldAppend(a)) {
    var b = document.createElement("style");
    b.type = "text/css";
    b.id = "branch-css";
    b.innerHTML = bannerResources.css.banner;
    var c = bannerResources.utils.mobileUserAgent();
    "ios" == c && a.showMobile ? b.innerHTML += bannerResources.css.mobile + bannerResources.css.ios : "android" == c && a.showMobile ? b.innerHTML += bannerResources.css.mobile + bannerResources.css.android : a.showDesktop && (b.innerHTML += bannerResources.css.desktop, b.innerHTML = window.ActiveXObject ? b.innerHTML + bannerResources.css.ie : b.innerHTML + bannerResources.css.nonie);
    a.iframe ? (a = document.createElement("style"), b.type = "text/css", b.id = "branch-iframe-css", b.innerHTML += bannerResources.css.inneriframe, a.innerHTML = bannerResources.css.iframe + (bannerResources.utils.mobileUserAgent() ? bannerResources.css.iframe_mobile : bannerResources.css.iframe_desktop), document.head.appendChild(a), bannerResources.utils.branchiFrame().contentWindow.document.head.appendChild(b), bannerResources.utils.branchiFrame().style.top = "-" + bannerHeight) : (document.head.appendChild(b), 
    bannerResources.utils.branchBanner().style.top = "-" + bannerHeight);
  }
};
banner.bannerActions = function(a, b, c) {
  if (bannerResources.utils.shouldAppend(b)) {
    var d = document.createElement("div");
    d.id = "branch-sms-form-container";
    bannerResources.utils.mobileUserAgent() ? (c.channel = "app banner", a.link(c, function(a, b) {
      bannerResources.utils.branchDocument().getElementById("branch-mobile-action").href = b;
    }), d.innerHTML = bannerResources.html.mobileAction(b)) : d.innerHTML = bannerResources.html.desktopAction;
    bannerResources.utils.branchDocument().getElementById("branch-banner-action").appendChild(d);
    bannerResources.utils.branchDocument().getElementById("sms-form").addEventListener("submit", function(d) {
      d.preventDefault();
      bannerResources.actions.sendSMS(a, b, c);
    });
    bannerResources.utils.branchDocument().getElementById("branch-banner-close").onclick = bannerResources.actions.close;
  }
};
banner.triggerBannerAnimation = function(a) {
  bannerResources.utils.shouldAppend(a) && (document.body.style.marginTop = bannerHeight, setTimeout(function() {
    bannerResources.utils.branchiFrame() ? bannerResources.utils.branchiFrame().style.top = "0" : bannerResources.utils.branchBanner().style.top = "0";
  }, animationDelay));
};
// Input 6
var _jsonp_callback_index = 0;
function serializeObject(a, b) {
  var c = [];
  b = b || "";
  if (a instanceof Array) {
    for (var d = 0;d < a.length;d++) {
      c.push(encodeURIComponent(b) + "[]=" + encodeURIComponent(a[d]));
    }
  } else {
    for (d in a) {
      a.hasOwnProperty(d) && (a[d] instanceof Array || "object" == typeof a[d] ? c.push(serializeObject(a[d], b ? b + "." + d : d)) : c.push(encodeURIComponent(b ? b + "." + d : d) + "=" + encodeURIComponent(a[d])));
    }
  }
  return c.join("&");
}
function getUrl(a, b) {
  var c, d = a.destination + a.endpoint;
  if (a.queryPart) {
    for (c in a.queryPart) {
      a.queryPart.hasOwnProperty(c) && (a.queryPart[c](a.endpoint, c, b[c]), d += "/" + b[c]);
    }
  }
  var e = {};
  for (c in a.params) {
    if (a.params.hasOwnProperty(c)) {
      var f = a.params[c](a.endpoint, c, b[c]);
      "undefined" != typeof f && "" !== f && null !== f && (e[c] = f);
    }
  }
  return{data:serializeObject(e), url:d};
}
var jsonpRequest = function(a, b, c) {
  c = c || "branch_callback__" + _jsonp_callback_index++;
  b.onSuccess = b.onSuccess || function() {
  };
  b.onTimeout = b.onTimeout || function() {
  };
  b.data = "POST" == b.method ? encodeURIComponent(utils.base64encode(goog.json.serialize(b.data))) : "";
  var d = 0 <= a.indexOf("bnc.lt") ? "&post_data=" : "&data=", e = window.setTimeout(function() {
    window[c] = function() {
    };
    b.onTimeout();
  }, 1E3 * (b.timeout || 10));
  window[c] = function(a) {
    window.clearTimeout(e);
    b.onSuccess(a);
  };
  var f = document.createElement("script");
  f.type = "text/javascript";
  f.async = !0;
  f.src = a + (0 > a.indexOf("?") ? "?" : "") + (b.data ? d + b.data : "") + "&callback=" + c + (0 <= a.indexOf("/c/") ? "&click=1" : "");
  document.getElementsByTagName("head")[0].appendChild(f);
}, jsonpMakeRequest = function(a, b, c, d) {
  jsonpRequest(a, {onSuccess:function(a) {
    d(null, a);
  }, onTimeout:function() {
    d(utils.error(utils.messages.timeout));
  }, timeout:10, data:b, method:c});
}, XHRRequest = function(a, b, c, d) {
  var e = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
  e.onreadystatechange = function() {
    if (4 === e.readyState && 200 === e.status) {
      try {
        d(null, goog.json.parse(e.responseText));
      } catch (a) {
        d(null, {});
      }
    } else {
      4 === e.readyState && 402 === e.status ? d(Error("Not enough credits to redeem.")) : 4 !== e.readyState || "4" != e.status.toString().substring(0, 1) && "5" != e.status.toString().substring(0, 1) || d(Error("Error in API: " + e.status));
    }
  };
  try {
    e.open(c, a, !0), e.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), e.send(b);
  } catch (f) {
    sessionStorage.setItem("use_jsonp", !0), jsonpMakeRequest(a, b, c, d);
  }
}, api = function(a, b, c) {
  var d = getUrl(a, b), e, f = "";
  "GET" == a.method ? e = d.url + "?" + d.data : (e = d.url, f = d.data);
  sessionStorage.getItem("use_jsonp") || a.jsonp ? jsonpMakeRequest(e, b, a.method, c) : XHRRequest(e, f, a.method, c);
};
// Input 7
var resources = {}, validationTypes = {obj:0, str:1, num:2, arr:3}, methods = {POST:"POST", GET:"GET"};
function validator(a, b) {
  return function(c, d, e) {
    e ? b == validationTypes.obj ? "object" != typeof e && utils.error(utils.messages.invalidType, [c, d, "an object"]) : b == validationTypes.arr ? e instanceof Array || utils.error(utils.messages.invalidType, [c, d, "an array"]) : b == validationTypes.str ? "string" != typeof e && utils.error(utils.messages.invalidType, [c, d, "a string"]) : b == validationTypes.num ? "number" != typeof e && utils.error(utils.messages.invalidType, [c, d, "a number"]) : b && (b.test(e) || utils.error(utils.messages.invalidType, 
    [c, d, "in the proper format"])) : a && utils.error(utils.messages.missingParam, [c, d]);
    return e;
  };
}
var branch_id = /^[0-9]{15,20}$/;
resources.open = {destination:config.api_endpoint, endpoint:"/v1/open", method:"POST", params:{app_id:validator(!0, branch_id), identity_id:validator(!1, branch_id), link_identifier:validator(!1, validationTypes.str), is_referrable:validator(!0, validationTypes.num), browser_fingerprint_id:validator(!0, branch_id)}};
resources.profile = {destination:config.api_endpoint, endpoint:"/v1/profile", method:"POST", params:{app_id:validator(!0, branch_id), identity_id:validator(!0, branch_id), identity:validator(!0, validationTypes.str)}};
resources.close = {destination:config.api_endpoint, endpoint:"/v1/close", method:"POST", params:{app_id:validator(!0, branch_id), session_id:validator(!0, branch_id)}};
resources.logout = {destination:config.api_endpoint, endpoint:"/v1/logout", method:"POST", params:{app_id:validator(!0, branch_id), session_id:validator(!0, branch_id)}};
resources.referrals = {destination:config.api_endpoint, endpoint:"/v1/referrals", method:"GET", queryPart:{identity_id:validator(!0, branch_id)}};
resources.credits = {destination:config.api_endpoint, endpoint:"/v1/credits", method:"GET", queryPart:{identity_id:validator(!0, branch_id)}};
resources._r = {destination:config.link_service_endpoint, endpoint:"/_r", method:"GET", jsonp:!0, params:{app_id:validator(!0, branch_id)}};
resources.redeem = {destination:config.api_endpoint, endpoint:"/v1/redeem", method:"POST", params:{app_id:validator(!0, branch_id), identity_id:validator(!0, branch_id), amount:validator(!0, validationTypes.num), bucket:validator(!1, validationTypes.str)}};
resources.link = {destination:config.api_endpoint, endpoint:"/v1/url", method:"POST", ref:"obj", params:{app_id:validator(!0, branch_id), identity_id:validator(!0, branch_id), data:validator(!1, validationTypes.str), tags:validator(!1, validationTypes.arr), feature:validator(!1, validationTypes.str), channel:validator(!1, validationTypes.str), stage:validator(!1, validationTypes.str), type:validator(!1, validationTypes.num)}};
resources.linkClick = {destination:config.link_service_endpoint, endpoint:"", method:"GET", queryPart:{link_url:validator(!0, validationTypes.str)}, params:{click:validator(!0, validationTypes.str)}};
resources.SMSLinkSend = {destination:config.link_service_endpoint, endpoint:"/c", method:"POST", queryPart:{link_url:validator(!0, validationTypes.str)}, params:{phone:validator(!0, validationTypes.str)}};
resources.event = {destination:config.api_endpoint, endpoint:"/v1/event", method:"POST", params:{app_id:validator(!0, branch_id), session_id:validator(!0, branch_id), event:validator(!0, validationTypes.str), metadata:validator(!0, validationTypes.obj)}};
// Input 8
var default_branch, Branch = function() {
  if (!(this instanceof Branch)) {
    return default_branch || (default_branch = new Branch), default_branch;
  }
  this._queue = Queue();
  this.initialized = !1;
};
Branch.prototype._api = function(a, b, c) {
  var d = this;
  this._queue(function(e) {
    (a.params && a.params.app_id || a.queryPart && a.queryPart.app_id) && d.app_id && (b.app_id = d.app_id);
    (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && d.session_id && (b.session_id = d.session_id);
    (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && d.identity_id && (b.identity_id = d.identity_id);
    return api(a, b, function(a, b) {
      e();
      c(a, b);
    });
  });
};
Branch.prototype.init = function(a, b) {
  b = b || function() {
  };
  if (this.initialized) {
    return b(utils.message(utils.messages.existingInit));
  }
  this.app_id = a;
  var c = this, d = utils.readStore(), e = function(a) {
    c.session_id = a.session_id;
    c.identity_id = a.identity_id;
    c.sessionLink = a.link;
    c.initialized = !0;
  };
  d && d.session_id ? (e(d), b(null, utils.whiteListSessionData(d))) : this._api(resources._r, {}, function(a, d) {
    c._api(resources.open, {link_identifier:utils.urlValue("_branch_click_id"), is_referrable:1, browser_fingerprint_id:d}, function(a, c) {
      e(c);
      utils.store(c);
      b(a, utils.whiteListSessionData(c));
    });
  });
};
Branch.prototype.data = function(a) {
  a = a || function() {
  };
  this._queue(function(b) {
    a(null, utils.whiteListSessionData(utils.readStore()));
    b();
  });
};
Branch.prototype.setIdentity = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  this._api(resources.profile, {identity:a}, function(a, d) {
    b(a, d);
  });
};
Branch.prototype.logout = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  this._api(resources.logout, {}, function(b) {
    a(b);
  });
};
Branch.prototype.track = function(a, b, c) {
  c = c || function() {
  };
  if (!this.initialized) {
    return c(utils.message(utils.messages.nonInit));
  }
  "function" == typeof b && (c = b, b = {});
  this._api(resources.event, {event:a, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, {})}, function(a) {
    c(a);
  });
};
Branch.prototype.link = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  a.source = "web-sdk";
  void 0 !== a.data.$desktop_url && (a.data.$desktop_url = a.data.$desktop_url.replace(/#r:[a-z0-9-_]+$/i, ""));
  a.data = goog.json.serialize(a.data);
  this._api(resources.link, a, function(a, d) {
    "function" == typeof b && b(a, d.url);
  });
};
Branch.prototype.linkClick = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  a && this._api(resources.linkClick, {link_url:a.replace("https://bnc.lt/", ""), click:"click"}, function(a, d) {
    utils.storeKeyValue("click_id", d.click_id);
    (a || d) && b(a, d);
  });
};
Branch.prototype.sendSMS = function(a, b, c, d) {
  d = d || function() {
  };
  c = c || {};
  c.make_new_link = c.make_new_link || !1;
  if (!this.initialized) {
    return d(utils.message(utils.messages.nonInit));
  }
  utils.readKeyValue("click_id") && !c.make_new_link ? this.sendSMSExisting(a, d) : this.sendSMSNew(a, b, d);
};
Branch.prototype.sendSMSNew = function(a, b, c) {
  c = c || function() {
  };
  var d = this;
  if (!this.initialized) {
    return c(utils.message(utils.messages.nonInit));
  }
  "app banner" != b.channel && (b.channel = "sms");
  this.link(b, function(b, f) {
    if (b) {
      return c(b);
    }
    d.linkClick(f, function(b) {
      if (b) {
        return c(b);
      }
      d.sendSMSExisting(a, function(a) {
        c(a);
      });
    });
  });
};
Branch.prototype.sendSMSExisting = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  this._api(resources.SMSLinkSend, {link_url:utils.readStore().click_id, phone:a}, function(a) {
    b(a);
  });
};
Branch.prototype.referrals = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  this._api(resources.referrals, {}, function(b, c) {
    a(b, c);
  });
};
Branch.prototype.credits = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  this._api(resources.credits, {}, function(b, c) {
    a(b, c);
  });
};
Branch.prototype.redeem = function(a, b, c) {
  c = c || function() {
  };
  if (!this.initialized) {
    return c(utils.message(utils.messages.nonInit));
  }
  this._api(resources.redeem, {amount:a, bucket:b}, function(a, b) {
    c(a, b);
  });
};
Branch.prototype.banner = function(a, b) {
  a.showMobile = void 0 === a.showMobile ? !0 : a.showMobile;
  a.showDesktop = void 0 === a.showDesktop ? !0 : a.showDesktop;
  a.iframe = void 0 === a.iframe ? !0 : a.iframe;
  document.getElementById("branch-banner") && !document.getElementById("branch-banner-iframe") || utils.readKeyValue("hideBanner") || (banner.bannerMarkup(a), banner.bannerStyles(a), banner.bannerActions(this, a, b), banner.triggerBannerAnimation(a));
};
// Input 9
var branch_instance = new Branch;
if (window.branch && window.branch._q) {
  for (var queue = window.branch._q, i = 0;i < queue.length;i++) {
    var task = queue[i];
    branch_instance[task[0]].apply(branch_instance, task[1]);
  }
}
;
// Input 10
var umd = {};
"function" === typeof define && define.amd ? define("branch", function() {
  return branch_instance;
}) : "object" === typeof exports && (module.exports = branch_instance);
window && (window.branch = branch_instance);
})();
