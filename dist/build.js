(function() {// Input 0
var config = {link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:1};
// Input 1
var utils = {}, DEBUG = !0;
utils.messages = {missingParam:"API request $1 missing parameter $2", invalidType:"API request $1, parameter $2 is not $3", nonInit:"Branch SDK not initialized", existingInit:"Branch SDK already initilized", missingAppId:"Missing Branch app ID"};
utils.error = function(a, b) {
  throw Error(utils.message(a, b));
};
utils.message = function(a, b) {
  var d = a.replace(/\$(\d)/g, function(a, d) {
    return b[parseInt(d) - 1];
  });
  DEBUG && console && console.log(d);
  return d;
};
utils.readStore = function() {
  try {
    return JSON.parse(sessionStorage.getItem("branch_session")) || {};
  } catch (a) {
    return{};
  }
};
utils.store = function(a) {
  sessionStorage.setItem("branch_session", JSON.stringify(a));
};
utils.merge = function(a, b) {
  for (var d in b) {
    b.hasOwnProperty(d) && (a[d] = b[d]);
  }
  return a;
};
utils.hashValue = function(a) {
  try {
    return location.hash.match(new RegExp(a + ":([^&]*)"))[1];
  } catch (b) {
    return "";
  }
};
utils.mobileReady = function() {
  return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i);
};
utils.closeBanner = function() {
  var a = document.getElementById("branch-banner");
  a && (a.parentNode.removeChild(a), document.body.style.marginTop = "0px");
};
// Input 2
function serializeObject(a, b) {
  var d = [];
  b = b || "";
  if (a instanceof Array) {
    for (var c = 0;c < a.length;c++) {
      d.push(encodeURIComponent(b) + "[]=" + encodeURIComponent(a[c]));
    }
  } else {
    for (c in a) {
      a.hasOwnProperty(c) && (a[c] instanceof Array || "object" == typeof a[c] ? d.push(serializeObject(a[c], b ? b + "." + c : c)) : d.push(encodeURIComponent(b ? b + "." + c : c) + "=" + encodeURIComponent(a[c])));
    }
  }
  return d.join("&");
}
function getUrl(a, b) {
  var d = a.destination + a.endpoint;
  if (a.queryPart) {
    for (var c in a.queryPart) {
      a.queryPart.hasOwnProperty(c) && (a.queryPart[c](a.endpoint, c, b[c]), d += "/" + b[c]);
    }
  }
  var f = {};
  for (c in a.params) {
    if (a.params.hasOwnProperty(c)) {
      var e = a.params[c](a.endpoint, c, b[c]);
      "undefined" != typeof e && "" !== e && null !== e && (f[c] = e);
    }
  }
  return{data:serializeObject(f), url:d};
}
var _jsonp_callbackId = 0;
function jsonp(a, b) {
  var d = "branch$$callback$$" + _jsonp_callbackId++;
  window[d] = function(a) {
    b(null, a);
  };
  var c = document.createElement("script");
  c.type = "text/javascript";
  c.async = !0;
  c.src = a + (a.indexOf("?") ? "&" : "?") + "callback=" + encodeURIComponent(d);
  document.getElementsByTagName("head")[0].appendChild(c);
}
var api = function(a, b, d) {
  d = d || function() {
  };
  b = getUrl(a, b);
  var c, f = "";
  "GET" == a.method ? c = b.url + "?" + b.data : (c = b.url, f = b.data);
  if (a.jsonp) {
    return jsonp(c, d);
  }
  var e = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
  e.onreadystatechange = function() {
    if (4 === e.readyState && 200 === e.status) {
      try {
        d(null, JSON.parse(e.responseText));
      } catch (a) {
        d(a);
      }
    } else {
      4 === e.readyState && 402 === e.status ? d(Error("Not enough credits to redeem.")) : d(Error("Error in API: " + e.status));
    }
  };
  e.open(a.method, c, !0);
  e.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  e.send(f);
};
// Input 3
var resources = {}, methods = {POST:"POST", GET:"GET"}, validationTypes = {obj:0, str:1, num:2, arr:3};
function validator(a, b) {
  return function(d, c, f) {
    f ? b == validationTypes.obj ? "object" != typeof f && utils.error(utils.messages.invalidType, [d, c, "an object"]) : b == validationTypes.arr ? f instanceof Array || utils.error(utils.messages.invalidType, [d, c, "an array"]) : b == validationTypes.str ? "string" != typeof f && utils.error(utils.messages.invalidType, [d, c, "a string"]) : b == validationTypes.num ? "number" != typeof f && utils.error(utils.messages.invalidType, [d, c, "a number"]) : b && (b.test(f) || utils.error(utils.messages.invalidType, 
    [d, c, "in the proper format"])) : a && utils.error(utils.messages.missingParam, [d, c]);
    return f;
  };
}
var branch_id = /^[0-9]{15,20}$/;
resources.open = {destination:config.api_endpoint, endpoint:"/v1/open", method:"POST", params:{app_id:validator(!0, branch_id), identity_id:validator(!1, branch_id), link_identifier:validator(!1, validationTypes.str), is_referrable:validator(!0, validationTypes.num), browser_fingerprint_id:validator(!0, branch_id)}};
resources.profile = {destination:config.api_endpoint, endpoint:"/v1/profile", method:"POST", params:{app_id:validator(!0, branch_id), identity:validator(!0, branch_id)}};
resources.close = {destination:config.api_endpoint, endpoint:"/v1/close", method:"POST", params:{app_id:validator(!0, branch_id), session_id:validator(!0, branch_id)}};
resources.logout = {destination:config.api_endpoint, endpoint:"/v1/logout", method:"POST", params:{app_id:validator(!0, branch_id), session_id:validator(!0, branch_id)}};
resources.referrals = {destination:config.api_endpoint, endpoint:"/v1/referrals", method:"GET", queryPart:{identity_id:validator(!0, branch_id)}};
resources.credits = {destination:config.api_endpoint, endpoint:"/v1/credits", method:"GET", queryPart:{identity_id:validator(!0, branch_id)}};
resources._r = {destination:config.link_service_endpoint, endpoint:"/_r", method:"GET", jsonp:!0, params:{app_id:validator(!0, branch_id)}};
resources.redeem = {destination:config.api_endpoint, endpoint:"/v1/redeem", method:"POST", params:{app_id:validator(!0, branch_id), identity_id:validator(!0, branch_id), amount:validator(!0, validationTypes.num), bucket:validator(!1, validationTypes.str)}};
resources.createLink = {destination:config.api_endpoint, endpoint:"/v1/url", method:"POST", ref:"obj", params:{app_id:validator(!0, branch_id), identity_id:validator(!0, branch_id), data:validator(!1, validationTypes.str), tags:validator(!1, validationTypes.arr), feature:validator(!1, validationTypes.str), channel:validator(!1, validationTypes.str), stage:validator(!1, validationTypes.str), type:validator(!1, validationTypes.num)}};
resources.createLinkClick = {destination:config.link_service_endpoint, endpoint:"", method:"GET", queryPart:{link_url:validator(!0, validationTypes.str)}};
resources.sendSMSLink = {destination:config.link_service_endpoint, endpoint:"", queryPart:{link_url:validator(!0, validationTypes.str)}, method:"POST", params:{phone:validator(!0, validationTypes.str)}};
resources.track = {destination:config.api_endpoint, endpoint:"/v1/event", method:"POST", params:{app_id:validator(!0, branch_id), session_id:validator(!0, branch_id), event:validator(!0, validationTypes.str), metadata:validator(!0, validationTypes.obj)}};
// Input 4
var Branch = function() {
  this.initialized = !1;
};
Branch.prototype.api = function(a, b, d) {
  (a.params && a.params.app_id || a.queryPart && a.queryPart.app_id) && this.app_id && (b.app_id = this.app_id);
  (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && this.session_id && (b.session_id = this.session_id);
  (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && this.identity_id && (b.identity_id = this.identity_id);
  return api(a, b, d);
};
Branch.prototype.init = function(a, b) {
  if (this.initialized) {
    return b(utils.message(utils.messages.existingInit));
  }
  this.initialized = !0;
  b = b || function() {
  };
  this.app_id = a;
  var d = this, c = utils.readStore();
  c && !c.session_id && (c = null);
  c && (this.session_id = c.session_id, this.identity_id = c.identity_id);
  c && !utils.hashValue("r") ? b(null, c) : this.api(resources._r, {}, function(a, c) {
    a ? b(a) : d.api(resources.open, {link_identifier:utils.hashValue("r"), is_referrable:1, browser_fingerprint_id:c}, function(a, c) {
      a ? b(a) : (d.session_id = c.session_id, d.identity_id = c.identity_id, utils.store(c), b(null, c));
    });
  });
};
Branch.prototype.logout = function(a) {
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  a = a || function() {
  };
  api(resources.logout, {}, function(b) {
    var d = utils.readStore();
    d.session_id = b.session_id;
    d.identity_id = b.identity_id;
    d.link = b.link;
    sessionStorage.setItem("branch_session", JSON.stringify(session));
    a(b);
  });
};
Branch.prototype.track = function(a, b, d) {
  if (!this.initialized) {
    return d(utils.message(utils.messages.nonInit));
  }
  "function" == typeof b && (d = b, b = {});
  d = d || function() {
  };
  this.api(resources.track, {event:a, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, {})}, d);
};
Branch.prototype.identify = function(a, b) {
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  b = b || function() {
  };
  this.api(resources.profile, {identity:a}, function(a) {
    var c = utils.readSession();
    c.identity_id = a.identity_id;
    c.link = a.link;
    c.referring_data = a.referring_data;
    c.referring_identity = a.referring_identity;
    sessionStorage.setItem("branch_session", JSON.stringify(c));
    b(a);
  });
};
Branch.prototype.createLink = function(a, b) {
  if (!this.initialized) {
    return utils.console(config.debugMsgs.nonInit);
  }
  a.source = "web-sdk";
  void 0 !== a.data.$desktop_url && (a.data.$desktop_url = a.data.$desktop_url.replace(/#r:[a-z0-9-_]+$/i, ""));
  a.data = JSON.stringify(a.data);
  this.api(resources.createLink, a, function(a, c) {
    "function" == typeof b && (a ? b(a) : b(null, c.url));
  });
};
// Input 5
var branch_instance = new Branch;
if (window.branch && window.branch._q) {
  for (var queue = window.branch._q, i = 0;i < queue.length;i++) {
    var task = queue[i];
    branch_instance[task[0]].apply(branch_instance, task[1]);
  }
}
;
// Input 6
"function" === typeof define && define.amd ? define("branch", function() {
  return branch_instance;
}) : "object" === typeof exports && (module.exports = branch_instance);
window && (window.branch = branch_instance);
})();
