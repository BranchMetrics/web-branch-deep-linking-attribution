(function() {// Input 0
var config = {link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:1};
// Input 1
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
  return JSON.parse(sessionStorage.getItem("branch_session")) || {};
};
utils.whiteListSessionData = function(a) {
  var b = ["data", "referring_identity", "identity", "has_app"], c = {}, d;
  for (d in a) {
    -1 < b.indexOf(d) && (c[d] = a[d]);
  }
  return c;
};
utils.store = function(a) {
  sessionStorage.setItem("branch_session", JSON.stringify(a));
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
utils.base64encode = function(a) {
  var b = "", c, d, e, h, n, u, q = 0;
  d = void 0;
  a = a.replace(/\r\n/g, "\n");
  d = "";
  for (e = 0;e < a.length;e++) {
    h = a.charCodeAt(e), 128 > h ? d += String.fromCharCode(h) : (127 < h && 2048 > h ? d += String.fromCharCode(h >> 6 | 192) : (d += String.fromCharCode(h >> 12 | 224), d += String.fromCharCode(h >> 6 & 63 | 128)), d += String.fromCharCode(h & 63 | 128));
  }
  for (a = d;q < a.length;) {
    c = a.charCodeAt(q++), d = a.charCodeAt(q++), e = a.charCodeAt(q++), h = c >> 2, c = (c & 3) << 4 | d >> 4, n = (d & 15) << 2 | e >> 6, u = e & 63, isNaN(d) ? n = u = 64 : isNaN(e) && (u = 64), b = b + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(h) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(n) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(u)
    ;
  }
  return b;
};
utils.pushQueue = function(a, b, c) {
  b = b || window;
  c = c || [];
  utils.queue = utils.queue || [];
  utils.queueRunning = utils.queueRunning || !1;
  utils.queue.push(function() {
    a.apply(b, c);
  });
  utils.queueRunning || (utils.queueRunning = !0, utils.nextQueue());
};
utils.nextQueue = function() {
  utils.queue.length ? utils.queue.shift().call() : utils.queueRunning = !1;
};
// Input 2
var banner = {}, animationSpeed = 250, animationDelay = 20, bannerResources = {css:{banner:"body { -webkit-transition: all " + 1.5 * animationSpeed / 1E3 + "s ease; transition: all 0" + 1.5 * animationSpeed / 1E3 + "s ease; }#branch-banner { top: -76px; width: 100%; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; -webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all " + 
animationSpeed / 1E3 + "s ease; transition: all 0" + animationSpeed / 1E3 + 's ease; }#branch-banner .close-x { float: left; font-weight: 400; margin-right: 6px; margin-left: 0; cursor: pointer; }#branch-banner .content { position: absolute; width: 100%; height: 76px; z-index: 99999; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; }#branch-banner .content .left { width: 70%; float: left; padding: 8px 8px 8px 8px; }#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }#branch-banner .content .right a { font-size: 14px; font-weight: 500; }#branch-banner-action div { float: right; margin-right: 8px; }#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }#branch-banner .content .left .details { margin-top: 3px; padding-left: 4px; }#branch-banner .content .left .details .title { font: 14px/1.5em HelveticaNeue-Medium, Helvetica Neue Medium, Helvetica Neue, Sans-serif; color: rgba(0, 0, 0, 0.9); display: inline-block; }#branch-banner .content .left .details .description { font-size: 12px; font-weight: normal; line-height: 1.5em; color: rgba(0, 0, 0, 0.5); display: block; }#branch-banner .content .right { display:inline-block; position: relative; top: 50%; transform: translateY(-50%); -webkit-transform: translateY(-50%); }', 
iOS:"body { -webkit-transition: all " + 1.5 * animationSpeed / 1E3 + "s ease; transition: all 0" + 1.5 * animationSpeed / 1E3 + "s ease; }#branch-banner { position: absolute; top: -76px; width: 100%; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; -webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all " + animationSpeed / 1E3 + "s ease; transition: all 0" + 
animationSpeed / 1E3 + 's ease; }#branch-banner .close-x { color: #aaa; margin-top: 13px; font-size: 20px; float: left; font-weight: 400; color: #aaa; font-size: 20px; margin-top: 13px; margin-right: 6px; margin-left: 0; cursor: pointer; }#branch-banner .content { position: absolute; width: 100%; height: 76px; z-index: 99999; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; }#branch-banner .content .left { width: 70%; float: left; padding: 8px 8px 8px 8px; }#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }#branch-banner .content .right a { font-size: 14px; font-weight: 500; color: #007aff; color: #007aff; }#branch-banner-action div { float: right; margin-right: 8px; }#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }#branch-banner .content .left .details { margin-top: 3px; padding-left: 4px; }#branch-banner .content .left .details .title { font: 14px/1.5em HelveticaNeue-Medium, Helvetica Neue Medium, Helvetica Neue, Sans-serif; color: rgba(0, 0, 0, 0.9); display: inline-block; }#branch-banner .content .left .details .description { font-size: 12px; font-weight: normal; line-height: 1.5em; color: rgba(0, 0, 0, 0.5); display: block; }#branch-banner .content .right { display:inline-block; position: relative; top: 50%; transform: translateY(-50%); -webkit-transform: translateY(-50%); }', 
desktop:"#branch-banner .content .left { width: 50% }#branch-banner .close-x { color: #aaa; margin-top: 13px; font-size: 20px; }#branch-banner .content .right { width: 50% }#branch-banner { position: fixed; }#branch-banner .content .right a { color: #007aff; }#branch-banner .content .right input { font-weight: 400; border-radius: 4px; height: 30px; border: 1px solid #ccc; padding: 5px 7px 4px; width: 125px; font-size: 14px; }#branch-banner .content .right button { margin-top: 0px; display: inline-block; height: 30px;; float: right; margin-left: 5px; font-weight: 400; border-radius: 4px; border: 1px solid #ccc; background: #fff; color: #000; padding: 0px 12px; }#branch-banner .content .right button:hover { border: 1px solid #BABABA; background: #E0E0E0; }#branch-banner .content .right input:focus, button:focus { outline: none; }#branch-banner .content .right input.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }#branch-banner .content .right span { display: inline-block; font-weight: 400; margin: 7px 9px; font-size: 14px; }", 
android:"#branch-banner { position: absolute; }#branch-banner .close-x { text-align: center; font-size: 15px; border-radius:14px; border:0; width:17px; height:17px; line-height:14px; color:#b1b1b3; background:#efefef; }#branch-mobile-action { text-decoration:none; border-bottom: 3px solid #b3c833; padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; font-weight: bold; background-color: #b3c833; border-radius: 5px; }#branch-mobile-action:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }"}, 
html:{banner:function(a) {
  return'<div class="content"><div class="left"><div class="close-x" id="branch-banner-close">&times;</div><div class="icon" style="float: left;"><img src="' + a.icon + '"></div><div class="details"><span class="title">' + a.title + '</span><span class="description">' + a.description + '</span></div></div><div class="right" id="branch-banner-action"></div></div>';
}, desktopAction:function() {
  return'<div id="branch-sms-block"><input type="phone" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999"><button id="branch-sms-send">Send Link</button></div>';
}, mobileAction:function(a) {
  var b = a.openAppButtonText || "View in app";
  a = a.downloadAppButtonText || "Download App";
  return'<a id="branch-mobile-action" href="#">' + (utils.hasApp() ? b : a) + "</a>";
}, linkSent:function(a) {
  return'<span class="sms-sent">Link sent to ' + a + "</span>";
}}, actions:{removeElement:function() {
  var a = document.getElementById("branch-banner");
  a && a.parentNode.removeChild(a);
}, sendSMS:function(a, b, c) {
  var d = document.getElementById("branch-sms-phone");
  if (d) {
    var e = d.value;
    /^\d{7,}$/.test(e.replace(/[\s()+\-\.]|ext/gi, "")) ? a.sendSMS(e, c, b, function() {
      document.getElementById("branch-sms-block").innerHTML = bannerResources.html.linkSent(e);
    }) : d.className = "error";
  }
}, close:function() {
  setTimeout(function() {
    bannerResources.actions.removeElement("branch-banner");
    bannerResources.actions.removeElement("branch-css");
  }, animationSpeed + animationDelay);
  setTimeout(function() {
    document.body.style.marginTop = "0px";
  }, animationDelay);
  document.getElementById("branch-banner").style.top = "-76px";
  utils.storeKeyValue("hideBanner", !0);
}, mobileUserAgent:function() {
  return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i) ? navigator.userAgent.match(/android/i) ? "android" : "ios" : !1;
}, shouldAppend:function(a) {
  return a.showDesktop && !bannerResources.actions.mobileUserAgent() || a.showMobile && bannerResources.actions.mobileUserAgent();
}}};
banner.smartBannerMarkup = function(a) {
  if (bannerResources.actions.shouldAppend(a)) {
    var b = document.createElement("div");
    b.id = "branch-banner";
    b.innerHTML = bannerResources.html.banner(a);
    document.body.appendChild(b);
  }
};
banner.smartBannerStyles = function(a) {
  if (bannerResources.actions.shouldAppend(a)) {
    var b = document.createElement("style");
    b.type = "text/css";
    b.id = "branch-css";
    b.innerHTML = bannerResources.css.banner;
    var c = bannerResources.actions.mobileUserAgent();
    "ios" == c && a.showMobile ? b.innerHTML += bannerResources.css.iOS : "android" == c && a.showMobile ? b.innerHTML += bannerResources.css.android : a.showDesktop && (b.innerHTML += bannerResources.css.desktop);
    document.head.appendChild(b);
    document.getElementById("branch-banner").style.top = "-76px";
  }
};
banner.appendSmartBannerActions = function(a, b, c) {
  if (bannerResources.actions.shouldAppend(b)) {
    var d = document.createElement("div");
    bannerResources.actions.mobileUserAgent() ? (c.channel = "app banner", a.link(c, function(a, b) {
      document.getElementById("branch-mobile-action").href = b;
    }), d.innerHTML = bannerResources.html.mobileAction(b)) : d.innerHTML = bannerResources.html.desktopAction(b);
    document.getElementById("branch-banner-action").appendChild(d);
    try {
      document.getElementById("branch-sms-send").addEventListener("click", function() {
        bannerResources.actions.sendSMS(a, b, c);
      });
    } catch (e) {
    }
    document.getElementById("branch-banner-close").onclick = bannerResources.actions.close;
  }
};
banner.triggerBannerAnimation = function(a) {
  bannerResources.actions.shouldAppend(a) && (document.body.style.marginTop = "71px", setTimeout(function() {
    document.getElementById("branch-banner").style.top = "0";
  }, animationDelay));
};
// Input 3
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
      var h = a.params[c](a.endpoint, c, b[c]);
      "undefined" != typeof h && "" !== h && null !== h && (e[c] = h);
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
  b.data = "POST" == b.method ? encodeURIComponent(utils.base64encode(JSON.stringify(b.data))) : "";
  var d = 0 <= a.indexOf("bnc.lt") ? "&post_data=" : "&data=", e = window.setTimeout(function() {
    window[c] = function() {
    };
    b.onTimeout();
  }, 1E3 * (b.timeout || 10));
  window[c] = function(a) {
    window.clearTimeout(e);
    b.onSuccess(a);
  };
  var h = document.createElement("script");
  h.type = "text/javascript";
  h.async = !0;
  h.src = a + (0 > a.indexOf("?") ? "?" : "") + (b.data ? d + b.data : "") + "&callback=" + c + (0 <= a.indexOf("/c/") ? "&click=1" : "");
  document.getElementsByTagName("head")[0].appendChild(h);
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
        d(null, JSON.parse(e.responseText));
      } catch (a) {
        d(null, {});
      }
    } else {
      4 === e.readyState && 402 === e.status ? d(Error("Not enough credits to redeem.")) : 4 === e.readyState && "4" != e.status.substring(0, 1) && d(Error("Error in API: " + e.status));
    }
  };
  try {
    e.open(c, a, !0), e.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), e.send(b);
  } catch (h) {
    sessionStorage.setItem("use_jsonp", !0), jsonpMakeRequest(a, b, c, d);
  }
}, api = function(a, b, c) {
  var d = getUrl(a, b), e, h = "";
  "GET" == a.method ? e = d.url + "?" + d.data : (e = d.url, h = d.data);
  sessionStorage.getItem("use_jsonp") || a.jsonp ? jsonpMakeRequest(e, b, a.method, c) : XHRRequest(e, h, a.method, c);
};
// Input 4
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
// Input 5
var default_branch, Branch = function() {
  if (!(this instanceof Branch)) {
    return default_branch || (default_branch = new Branch), default_branch;
  }
  this.initialized = !1;
};
Branch.prototype.pushQueue = utils.pushQueue;
Branch.prototype.nextQueue = utils.nextQueue;
Branch.prototype._api = function(a, b, c) {
  (a.params && a.params.app_id || a.queryPart && a.queryPart.app_id) && this.app_id && (b.app_id = this.app_id);
  (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && this.session_id && (b.session_id = this.session_id);
  (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && this.identity_id && (b.identity_id = this.identity_id);
  return api(a, b, c);
};
Branch.prototype.init = function(a, b) {
  this.pushQueue(function(a, b) {
    if (this.initialized) {
      return this.nextQueue(), b(utils.message(utils.messages.existingInit));
    }
    this.app_id = a;
    var e = this, h = utils.readStore(), n = function(a) {
      e.session_id = a.session_id;
      e.identity_id = a.identity_id;
      e.sessionLink = a.link;
      e.initialized = !0;
    };
    h && h.session_id ? (n(h), this.nextQueue(), b(null, utils.whiteListSessionData(h))) : this._api(resources._r, {}, function(a, c) {
      e._api(resources.open, {is_referrable:1, browser_fingerprint_id:c}, function(a, c) {
        n(c);
        utils.store(c);
        e.nextQueue();
        b(a, utils.whiteListSessionData(c));
      });
    });
  }, this, [a, b || function() {
  }]);
};
Branch.prototype.data = function(a) {
  var b = this;
  this.pushQueue(function(a) {
    b.nextQueue();
    a(null, utils.whiteListSessionData(utils.readStore()));
  }, this, [a || function() {
  }]);
};
Branch.prototype.setIdentity = function(a, b) {
  var c = this;
  this.pushQueue(function(a, b) {
    if (!this.initialized) {
      return b(utils.message(utils.messages.nonInit));
    }
    this._api(resources.profile, {identity:a}, function(a, d) {
      c.nextQueue();
      b(a, d);
    });
  }, this, [a, b || function() {
  }]);
};
Branch.prototype.logout = function(a) {
  var b = this;
  this.pushQueue(function(a) {
    if (!this.initialized) {
      return a(utils.message(utils.messages.nonInit));
    }
    this._api(resources.logout, {}, function(d) {
      b.nextQueue();
      a(d);
    });
  }, this, [a || function() {
  }]);
};
Branch.prototype.track = function(a, b, c) {
  var d = this;
  this.pushQueue(function(a, b, c) {
    if (!this.initialized) {
      return c(utils.message(utils.messages.nonInit));
    }
    "function" == typeof b && (c = b, b = {});
    this._api(resources.event, {event:a, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, {})}, function(a) {
      d.nextQueue();
      c(a);
    });
  }, this, [a, b, c || function() {
  }]);
};
Branch.prototype.link = function(a, b) {
  var c = this;
  this.pushQueue(function(a, b) {
    if (!this.initialized) {
      return b(utils.message(utils.messages.nonInit));
    }
    a.source = "web-sdk";
    void 0 !== a.data.$desktop_url && (a.data.$desktop_url = a.data.$desktop_url.replace(/#r:[a-z0-9-_]+$/i, ""));
    a.data = JSON.stringify(a.data);
    this._api(resources.link, a, function(a, d) {
      "function" == typeof b && (c.nextQueue(), b(a, d.url));
    });
  }, this, [a, b || function() {
  }]);
};
Branch.prototype.linkClick = function(a, b) {
  var c = this;
  this.pushQueue(function(a, b) {
    if (!this.initialized) {
      return this.nextQueue(), b(utils.message(utils.messages.nonInit));
    }
    a && this._api(resources.linkClick, {link_url:a.replace("https://bnc.lt/", ""), click:"click"}, function(a, d) {
      c.nextQueue();
      utils.storeKeyValue("click_id", d.click_id);
      (a || d) && b(a, d);
    });
  }, this, [a, b || function() {
  }]);
};
Branch.prototype.sendSMS = function(a, b, c, d) {
  this.pushQueue(function(a, b, c, d) {
    c = c || {};
    c.make_new_link = c.make_new_link || !1;
    if (!this.initialized) {
      return d(utils.message(utils.messages.nonInit));
    }
    utils.readKeyValue("click_id") && !c.make_new_link ? this.sendSMSExisting(a, d) : this.sendSMSNew(a, b, d);
  }, this, [a, b, c, d || function() {
  }]);
};
Branch.prototype.sendSMSNew = function(a, b, c) {
  c = c || function() {
  };
  var d = this;
  if (!this.initialized) {
    return c(utils.message(utils.messages.nonInit));
  }
  "app banner" != b.channel && (b.channel = "sms");
  d = this;
  this.link(b, function(b, h) {
    if (b) {
      return c(b);
    }
    d.linkClick(h, function(b) {
      if (b) {
        return c(b);
      }
      d.sendSMSExisting(a, function(a) {
        d.nextQueue();
        c(a);
      });
    });
  });
};
Branch.prototype.sendSMSExisting = function(a, b) {
  b = b || function() {
  };
  var c = this;
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  this._api(resources.SMSLinkSend, {link_url:utils.readStore().click_id, phone:a}, function(a) {
    c.nextQueue();
    b(a);
  });
};
Branch.prototype.referrals = function(a) {
  var b = this;
  this.pushQueue(function(a) {
    if (!this.initialized) {
      return this.nextQueue(), a(utils.message(utils.messages.nonInit));
    }
    this._api(resources.referrals, {}, function(d, e) {
      b.nextQueue();
      a(d, e);
    });
  }, this, [a || function() {
  }]);
};
Branch.prototype.credits = function(a) {
  var b = this;
  this.pushQueue(function(a) {
    if (!this.initialized) {
      return this.nextQueue(), a(utils.message(utils.messages.nonInit));
    }
    this._api(resources.credits, {}, function(d, e) {
      b.nextQueue();
      a(d, e);
    });
  }, this, [a || function() {
  }]);
};
Branch.prototype.redeem = function(a, b, c) {
  var d = this;
  this.pushQueue(function(a, b, c) {
    if (!this.initialized) {
      return this.nextQueue(), c(utils.message(utils.messages.nonInit));
    }
    this._api(resources.redeem, {amount:a, bucket:b}, function(a, b) {
      d.nextQueue();
      c(a, b);
    });
  }, this, [a, b, c || function() {
  }]);
};
Branch.prototype.banner = function(a, b) {
  a.showMobile = void 0 === a.showMobile ? !0 : a.showMobile;
  a.showDesktop = void 0 === a.showDesktop ? !0 : a.showDesktop;
  document.getElementById("branch-banner") || utils.readKeyValue("hideBanner") || (banner.smartBannerMarkup(a), banner.smartBannerStyles(a), banner.appendSmartBannerActions(this, a, b), banner.triggerBannerAnimation(a));
};
// Input 6
var branch_instance = new Branch;
if (window.branch && window.branch._q) {
  for (var queue = window.branch._q, i = 0;i < queue.length;i++) {
    var task = queue[i];
    branch_instance[task[0]].apply(branch_instance, task[1]);
  }
}
;
// Input 7
"function" === typeof define && define.amd ? define("branch", function() {
  return branch_instance;
}) : "object" === typeof exports && (module.exports = branch_instance);
window && (window.branch = branch_instance);
// Input 8
(function() {
  function a(b, d) {
    function h(a, b) {
      try {
        a();
      } catch (c) {
        b && b();
      }
    }
    function k(a) {
      if (null != k[a]) {
        return k[a];
      }
      var b;
      if ("bug-string-char-index" == a) {
        b = "a" != "a"[0];
      } else {
        if ("json" == a) {
          b = k("json-stringify") && k("date-serialization") && k("json-parse");
        } else {
          if ("date-serialization" == a) {
            if (b = k("json-stringify") && v) {
              var c = d.stringify;
              h(function() {
                b = '"-271821-04-20T00:00:00.000Z"' == c(new w(-864E13)) && '"+275760-09-13T00:00:00.000Z"' == c(new w(864E13)) && '"-000001-01-01T00:00:00.000Z"' == c(new w(-621987552E5)) && '"1969-12-31T23:59:59.999Z"' == c(new w(-1));
              });
            }
          } else {
            var e;
            if ("json-stringify" == a) {
              var c = d.stringify, f = "function" == typeof c;
              f && ((e = function() {
                return 1;
              }).toJSON = e, h(function() {
                f = "0" === c(0) && "0" === c(new n) && '""' == c(new u) && c(r) === t && c(t) === t && c() === t && "1" === c(e) && "[1]" == c([e]) && "[null]" == c([t]) && "null" == c(null) && "[null,null,null]" == c([t, r, null]) && '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}' == c({a:[e, !0, !1, null, "\x00\b\n\f\r\t"]}) && "1" === c(null, e) && "[\n 1,\n 2\n]" == c([1, 2], null, 1);
              }, function() {
                f = !1;
              }));
              b = f;
            }
            if ("json-parse" == a) {
              var z = d.parse, g;
              "function" == typeof z && h(function() {
                0 === z("0") && !z(!1) && (e = z('{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}'), g = 5 == e.a.length && 1 === e.a[0]) && (h(function() {
                  g = !z('"\t"');
                }), g && h(function() {
                  g = 1 !== z("01");
                }), g && h(function() {
                  g = 1 !== z("1.");
                }));
              }, function() {
                g = !1;
              });
              b = g;
            }
          }
        }
      }
      return k[a] = !!b;
    }
    b || (b = e.Object());
    d || (d = e.Object());
    var n = b.Number || e.Number, u = b.String || e.String, q = b.Object || e.Object, w = b.Date || e.Date, A = b.SyntaxError || e.SyntaxError, O = b.TypeError || e.TypeError, P = b.Math || e.Math, C = b.JSON || e.JSON;
    "object" == typeof C && C && (d.stringify = C.stringify, d.parse = C.parse);
    var q = q.prototype, r = q.toString, D = q.hasOwnProperty, t, v = new w(-0xc782b5b800cec);
    h(function() {
      v = -109252 == v.getUTCFullYear() && 0 === v.getUTCMonth() && 1 === v.getUTCDate() && 10 == v.getUTCHours() && 37 == v.getUTCMinutes() && 6 == v.getUTCSeconds() && 708 == v.getUTCMilliseconds();
    });
    k["bug-string-char-index"] = k["date-serialization"] = k.json = k["json-stringify"] = k["json-parse"] = null;
    if (!k("json")) {
      var G = k("bug-string-char-index"), B = function(a, b) {
        var d = 0, e, f, h;
        (e = function() {
          this.valueOf = 0;
        }).prototype.valueOf = 0;
        f = new e;
        for (h in f) {
          D.call(f, h) && d++;
        }
        e = f = null;
        d ? B = function(a, b) {
          var c = "[object Function]" == r.call(a), d, e;
          for (d in a) {
            c && "prototype" == d || !D.call(a, d) || (e = "constructor" === d) || b(d);
          }
          (e || D.call(a, d = "constructor")) && b(d);
        } : (f = "valueOf toString toLocaleString propertyIsEnumerable isPrototypeOf hasOwnProperty constructor".split(" "), B = function(a, b) {
          var d = "[object Function]" == r.call(a), e, K = !d && "function" != typeof a.constructor && c[typeof a.hasOwnProperty] && a.hasOwnProperty || D;
          for (e in a) {
            d && "prototype" == e || !K.call(a, e) || b(e);
          }
          for (d = f.length;e = f[--d];K.call(a, e) && b(e)) {
          }
        });
        return B(a, b);
      };
      if (!k("json-stringify") && !k("date-serialization")) {
        var Q = {92:"\\\\", 34:'\\"', 8:"\\b", 12:"\\f", 10:"\\n", 13:"\\r", 9:"\\t"}, x = function(a, b) {
          return("000000" + (b || 0)).slice(-a);
        }, E = function(a) {
          var b, c, d, e, f, g, h, k, l;
          if (v) {
            b = function(a) {
              c = a.getUTCFullYear();
              d = a.getUTCMonth();
              e = a.getUTCDate();
              g = a.getUTCHours();
              h = a.getUTCMinutes();
              k = a.getUTCSeconds();
              l = a.getUTCMilliseconds();
            };
          } else {
            var p = P.floor, q = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], n = function(a, b) {
              return q[b] + 365 * (a - 1970) + p((a - 1969 + (b = +(1 < b))) / 4) - p((a - 1901 + b) / 100) + p((a - 1601 + b) / 400);
            };
            b = function(a) {
              e = p(a / 864E5);
              for (c = p(e / 365.2425) + 1970 - 1;n(c + 1, 0) <= e;c++) {
              }
              for (d = p((e - n(c, 0)) / 30.42);n(c, d + 1) <= e;d++) {
              }
              e = 1 + e - n(c, d);
              f = (a % 864E5 + 864E5) % 864E5;
              g = p(f / 36E5) % 24;
              h = p(f / 6E4) % 60;
              k = p(f / 1E3) % 60;
              l = f % 1E3;
            };
          }
          E = function(a) {
            a > -1 / 0 && a < 1 / 0 ? (b(a), a = (0 >= c || 1E4 <= c ? (0 > c ? "-" : "+") + x(6, 0 > c ? -c : c) : x(4, c)) + "-" + x(2, d + 1) + "-" + x(2, e) + "T" + x(2, g) + ":" + x(2, h) + ":" + x(2, k) + "." + x(3, l) + "Z", c = d = e = g = h = k = l = null) : a = null;
            return a;
          };
          return E(a);
        };
        if (k("json-stringify") && !k("date-serialization")) {
          var R = function(a) {
            return E(this);
          }, S = d.stringify;
          d.stringify = function(a, b, c) {
            var d = w.prototype.toJSON;
            w.prototype.toJSON = R;
            a = S(a, b, c);
            w.prototype.toJSON = d;
            return a;
          };
        } else {
          var T = function(a) {
            a = a.charCodeAt(0);
            var b = Q[a];
            return b ? b : "\\u00" + x(2, a.toString(16));
          }, H = /[\x00-\x1f\x22\x5c]/g, L = function(a) {
            H.lastIndex = 0;
            return'"' + (H.test(a) ? a.replace(H, T) : a) + '"';
          }, I = function(a, b, c, d, e, f, g) {
            var m, k, l, p, n, q;
            h(function() {
              m = b[a];
            });
            "object" == typeof m && m && (m.getUTCFullYear && "[object Date]" == r.call(m) && m.toJSON === w.prototype.toJSON ? m = E(m) : "function" == typeof m.toJSON && (m = m.toJSON(a)));
            c && (m = c.call(b, a, m));
            if (m == t) {
              return m === t ? m : "null";
            }
            k = typeof m;
            "object" == k && (l = r.call(m));
            switch(l || k) {
              case "boolean":
              ;
              case "[object Boolean]":
                return "" + m;
              case "number":
              ;
              case "[object Number]":
                return m > -1 / 0 && m < 1 / 0 ? "" + m : "null";
              case "string":
              ;
              case "[object String]":
                return L("" + m);
            }
            if ("object" == typeof m) {
              for (k = g.length;k--;) {
                if (g[k] === m) {
                  throw O();
                }
              }
              g.push(m);
              p = [];
              q = f;
              f += e;
              if ("[object Array]" == l) {
                n = 0;
                for (k = m.length;n < k;n++) {
                  l = I(n, m, c, d, e, f, g), p.push(l === t ? "null" : l);
                }
                k = p.length ? e ? "[\n" + f + p.join(",\n" + f) + "\n" + q + "]" : "[" + p.join(",") + "]" : "[]";
              } else {
                B(d || m, function(a) {
                  var b = I(a, m, c, d, e, f, g);
                  b !== t && p.push(L(a) + ":" + (e ? " " : "") + b);
                }), k = p.length ? e ? "{\n" + f + p.join(",\n" + f) + "\n" + q + "}" : "{" + p.join(",") + "}" : "{}";
              }
              g.pop();
              return k;
            }
          };
          d.stringify = function(a, b, d) {
            var e, f, h, g;
            if (c[typeof b] && b) {
              if (g = r.call(b), "[object Function]" == g) {
                f = b;
              } else {
                if ("[object Array]" == g) {
                  h = {};
                  for (var k = 0, l = b.length, n;k < l;n = b[k++], (g = r.call(n), "[object String]" == g || "[object Number]" == g) && (h[n] = 1)) {
                  }
                }
              }
            }
            if (d) {
              if (g = r.call(d), "[object Number]" == g) {
                if (0 < (d -= d % 1)) {
                  for (e = "", 10 < d && (d = 10);e.length < d;e += " ") {
                  }
                }
              } else {
                "[object String]" == g && (e = 10 >= d.length ? d : d.slice(0, 10));
              }
            }
            return I("", (n = {}, n[""] = a, n), f, h, e, "", []);
          };
        }
      }
      if (!k("json-parse")) {
        var U = u.fromCharCode, V = {92:"\\", 34:'"', 47:"/", 98:"\b", 116:"\t", 110:"\n", 102:"\f", 114:"\r"}, f, F, l = function() {
          f = F = null;
          throw A();
        }, y = function() {
          for (var a = F, b = a.length, c, d, e, h, g;f < b;) {
            switch(g = a.charCodeAt(f), g) {
              case 9:
              ;
              case 10:
              ;
              case 13:
              ;
              case 32:
                f++;
                break;
              case 123:
              ;
              case 125:
              ;
              case 91:
              ;
              case 93:
              ;
              case 58:
              ;
              case 44:
                return c = G ? a.charAt(f) : a[f], f++, c;
              case 34:
                c = "@";
                for (f++;f < b;) {
                  if (g = a.charCodeAt(f), 32 > g) {
                    l();
                  } else {
                    if (92 == g) {
                      switch(g = a.charCodeAt(++f), g) {
                        case 92:
                        ;
                        case 34:
                        ;
                        case 47:
                        ;
                        case 98:
                        ;
                        case 116:
                        ;
                        case 110:
                        ;
                        case 102:
                        ;
                        case 114:
                          c += V[g];
                          f++;
                          break;
                        case 117:
                          d = ++f;
                          for (e = f + 4;f < e;f++) {
                            g = a.charCodeAt(f), 48 <= g && 57 >= g || 97 <= g && 102 >= g || 65 <= g && 70 >= g || l();
                          }
                          c += U("0x" + a.slice(d, f));
                          break;
                        default:
                          l();
                      }
                    } else {
                      if (34 == g) {
                        break;
                      }
                      g = a.charCodeAt(f);
                      for (d = f;32 <= g && 92 != g && 34 != g;) {
                        g = a.charCodeAt(++f);
                      }
                      c += a.slice(d, f);
                    }
                  }
                }
                if (34 == a.charCodeAt(f)) {
                  return f++, c;
                }
                l();
              default:
                d = f;
                45 == g && (h = !0, g = a.charCodeAt(++f));
                if (48 <= g && 57 >= g) {
                  for (48 == g && (g = a.charCodeAt(f + 1), 48 <= g && 57 >= g) && l();f < b && (g = a.charCodeAt(f), 48 <= g && 57 >= g);f++) {
                  }
                  if (46 == a.charCodeAt(f)) {
                    for (e = ++f;e < b && (g = a.charCodeAt(e), 48 <= g && 57 >= g);e++) {
                    }
                    e == f && l();
                    f = e;
                  }
                  g = a.charCodeAt(f);
                  if (101 == g || 69 == g) {
                    g = a.charCodeAt(++f);
                    43 != g && 45 != g || f++;
                    for (e = f;e < b && (g = a.charCodeAt(e), 48 <= g && 57 >= g);e++) {
                    }
                    e == f && l();
                    f = e;
                  }
                  return+a.slice(d, f);
                }
                h && l();
                c = a.slice(f, f + 4);
                if ("true" == c) {
                  return f += 4, !0;
                }
                if ("fals" == c && 101 == a.charCodeAt(f + 4)) {
                  return f += 5, !1;
                }
                if ("null" == c) {
                  return f += 4, null;
                }
                l();
            }
          }
          return "$";
        }, J = function(a) {
          var b, c;
          "$" == a && l();
          if ("string" == typeof a) {
            if ("@" == (G ? a.charAt(0) : a[0])) {
              return a.slice(1);
            }
            if ("[" == a) {
              for (b = [];;) {
                a = y();
                if ("]" == a) {
                  break;
                }
                c ? "," == a ? (a = y(), "]" == a && l()) : l() : c = !0;
                "," == a && l();
                b.push(J(a));
              }
              return b;
            }
            if ("{" == a) {
              for (b = {};;) {
                a = y();
                if ("}" == a) {
                  break;
                }
                c ? "," == a ? (a = y(), "}" == a && l()) : l() : c = !0;
                "," != a && "string" == typeof a && "@" == (G ? a.charAt(0) : a[0]) && ":" == y() || l();
                b[a.slice(1)] = J(y());
              }
              return b;
            }
            l();
          }
          return a;
        }, N = function(a, b, c) {
          c = M(a, b, c);
          c === t ? delete a[b] : a[b] = c;
        }, M = function(a, b, c) {
          var d = a[b], e;
          if ("object" == typeof d && d) {
            if ("[object Array]" == r.call(d)) {
              for (e = d.length;e--;N(d, e, c)) {
              }
            } else {
              B(d, function(a) {
                N(d, a, c);
              });
            }
          }
          return c.call(a, b, d);
        };
        d.parse = function(a, b) {
          var c, d;
          f = 0;
          F = "" + a;
          c = J(y());
          "$" != y() && l();
          f = F = null;
          return b && "[object Function]" == r.call(b) ? M((d = {}, d[""] = c, d), "", b) : c;
        };
      }
    }
    d.runInContext = a;
    return d;
  }
  var b = "function" === typeof define && define.amd, c = {"function":!0, object:!0}, d = c[typeof exports] && exports && !exports.nodeType && exports, e = c[typeof window] && window || this, h = d && c[typeof module] && module && !module.nodeType && "object" == typeof global && global;
  !h || h.global !== h && h.window !== h && h.self !== h || (e = h);
  if (d && !b) {
    a(e, d);
  } else {
    var n = e.JSON, u = e.JSON3, q = !1, A = a(e, e.JSON3 = {noConflict:function() {
      q || (q = !0, e.JSON = n, e.JSON3 = u, n = u = null);
      return A;
    }});
    e.JSON = {parse:A.parse, stringify:A.stringify};
  }
  b && define(function() {
    return A;
  });
}).call(this);
})();
