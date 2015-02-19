(function() {// Input 0
var config = {link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:1};
// Input 1
var utils = {}, DEBUG = !0;
utils.messages = {missingParam:"API request $1 missing parameter $2", invalidType:"API request $1, parameter $2 is not $3", nonInit:"Branch SDK not initialized", existingInit:"Branch SDK already initilized", missingAppId:"Missing Branch app ID"};
utils.error = function(a, b) {
  throw Error(utils.message(a, b));
};
utils.message = function(a, b) {
  var c = a.replace(/\$(\d)/g, function(c, a) {
    return b[parseInt(a) - 1];
  });
  DEBUG && console && console.log(c);
  return c;
};
utils.readStore = function() {
  return JSON.parse(sessionStorage.getItem("branch_session")) || {};
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
utils.hashValue = function(a) {
  try {
    return location.hash.match(new RegExp(a + ":([^&]*)"))[1];
  } catch (b) {
    return "";
  }
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
}, sendSMS:function(a, b) {
  var c = document.getElementById("branch-sms-phone");
  if (c) {
    var d = c.value;
    /^\d{7,}$/.test(d.replace(/[\s()+\-\.]|ext/gi, "")) ? a.SMSLink({phone:d, data:b.data || {}}, function() {
      document.getElementById("branch-sms-block").innerHTML = bannerResources.html.linkSent(d);
    }) : c.className = "error";
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
}, shouldAppend:function(a, b) {
  return b && !bannerResources.actions.mobileUserAgent() || a && bannerResources.actions.mobileUserAgent();
}}};
banner.smartBannerMarkup = function(a, b, c) {
  bannerResources.actions.shouldAppend(b, c) && (b = document.createElement("div"), b.id = "branch-banner", b.innerHTML = bannerResources.html.banner(a), document.body.appendChild(b));
};
banner.smartBannerStyles = function(a, b) {
  if (bannerResources.actions.shouldAppend(a, b)) {
    var c = document.createElement("style");
    c.type = "text/css";
    c.id = "branch-css";
    c.innerHTML = bannerResources.css.banner;
    var d = bannerResources.actions.mobileUserAgent();
    "ios" == d && a ? c.innerHTML += bannerResources.css.iOS : "android" == d && a ? c.innerHTML += bannerResources.css.android : b && (c.innerHTML += bannerResources.css.desktop);
    document.head.appendChild(c);
    document.getElementById("branch-banner").style.top = "-76px";
  }
};
banner.appendSmartBannerActions = function(a, b, c, d) {
  if (bannerResources.actions.shouldAppend(c, d)) {
    c = document.createElement("div");
    bannerResources.actions.mobileUserAgent() ? (a.link({channel:"appBanner", data:b.data || {}}, function(b, c) {
      document.getElementById("branch-mobile-action").href = c;
    }), c.innerHTML = bannerResources.html.mobileAction(b)) : c.innerHTML = bannerResources.html.desktopAction(b);
    document.getElementById("branch-banner-action").appendChild(c);
    try {
      document.getElementById("branch-sms-send").addEventListener("click", function() {
        bannerResources.actions.sendSMS(a, b);
      });
    } catch (e) {
    }
    document.getElementById("branch-banner-close").onclick = bannerResources.actions.close;
  }
};
banner.triggerBannerAnimation = function(a, b) {
  bannerResources.actions.shouldAppend(a, b) && (document.body.style.marginTop = "71px", setTimeout(function() {
    document.getElementById("branch-banner").style.top = "0";
  }, animationDelay));
};
// Input 3
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
      var g = a.params[c](a.endpoint, c, b[c]);
      "undefined" != typeof g && "" !== g && null !== g && (e[c] = g);
    }
  }
  return{data:serializeObject(e), url:d};
}
var _jsonp_callback_index = 0, jsonpRequest = function() {
  var a = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode:function(b) {
    var c = "", d, e, g, f, k, h, l = 0;
    for (b = a._utf8_encode(b);l < b.length;) {
      d = b.charCodeAt(l++), e = b.charCodeAt(l++), g = b.charCodeAt(l++), f = d >> 2, d = (d & 3) << 4 | e >> 4, k = (e & 15) << 2 | g >> 6, h = g & 63, isNaN(e) ? k = h = 64 : isNaN(g) && (h = 64), c = c + this._keyStr.charAt(f) + this._keyStr.charAt(d) + this._keyStr.charAt(k) + this._keyStr.charAt(h);
    }
    return c;
  }, decode:function(b) {
    var c = "", d, e, g, f, k, h = 0;
    for (b = b.replace(/[^A-Za-z0-9\+\/\=]/g, "");h < b.length;) {
      d = this._keyStr.indexOf(b.charAt(h++)), e = this._keyStr.indexOf(b.charAt(h++)), f = this._keyStr.indexOf(b.charAt(h++)), k = this._keyStr.indexOf(b.charAt(h++)), d = d << 2 | e >> 4, e = (e & 15) << 4 | f >> 2, g = (f & 3) << 6 | k, c += String.fromCharCode(d), 64 != f && (c += String.fromCharCode(e)), 64 != k && (c += String.fromCharCode(g));
    }
    return c = a._utf8_decode(c);
  }, _utf8_encode:function(b) {
    b = b.replace(/\r\n/g, "\n");
    for (var c = "", a = 0;a < b.length;a++) {
      var e = b.charCodeAt(a);
      128 > e ? c += String.fromCharCode(e) : (127 < e && 2048 > e ? c += String.fromCharCode(e >> 6 | 192) : (c += String.fromCharCode(e >> 12 | 224), c += String.fromCharCode(e >> 6 & 63 | 128)), c += String.fromCharCode(e & 63 | 128));
    }
    return c;
  }, _utf8_decode:function(b) {
    for (var c = "", a = 0, e = c1 = c2 = 0;a < b.length;) {
      e = b.charCodeAt(a), 128 > e ? (c += String.fromCharCode(e), a++) : 191 < e && 224 > e ? (c2 = b.charCodeAt(a + 1), c += String.fromCharCode((e & 31) << 6 | c2 & 63), a += 2) : (c2 = b.charCodeAt(a + 1), c3 = b.charCodeAt(a + 2), c += String.fromCharCode((e & 15) << 12 | (c2 & 63) << 6 | c3 & 63), a += 3);
    }
    return c;
  }};
  return{send:function(b, c) {
    var d = c.callbackName || "branch_callback__" + _jsonp_callback_index++, e = c.onSuccess || function() {
    }, g = c.onTimeout || function() {
    }, f;
    "POST" == c.method && (f = encodeURIComponent(a.encode(JSON.stringify(c.data))) || "");
    var k = "&data=";
    0 <= b.indexOf("bnc.lt") && (k = "&post_data=");
    var h = window.setTimeout(function() {
      window[d] = function() {
      };
      g();
    }, 1E3 * (c.timeout || 10));
    window[d] = function(a) {
      window.clearTimeout(h);
      e(a);
    };
    var l = document.createElement("script");
    l.type = "text/javascript";
    l.async = !0;
    l.src = b + (0 > b.indexOf("?") ? "?" : "") + (f ? k + f : "") + "&callback=" + d + (0 <= b.indexOf("/c/") ? "&click=1" : "");
    document.getElementsByTagName("head")[0].appendChild(l);
  }};
}();
function jsonpMakeRequest(a, b, c, d) {
  jsonpRequest.send(a, {onSuccess:function(a) {
    d(null, a);
  }, onTimeout:function() {
    d({error:"Request timed out."});
  }, timeout:3, data:b, method:c});
}
var api = function(a, b, c) {
  c = c || function() {
  };
  var d = getUrl(a, b), e, g = "";
  "GET" == a.method ? e = d.url + "?" + d.data : (e = d.url, g = d.data);
  if (sessionStorage.getItem("use_jsonp") || a.jsonp) {
    jsonpMakeRequest(e, b, a.method, c);
  } else {
    var f = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
    f.onreadystatechange = function() {
      if (4 === f.readyState && 200 === f.status) {
        try {
          c(null, JSON.parse(f.responseText));
        } catch (a) {
          c(null, {});
        }
      } else {
        4 === f.readyState && 402 === f.status ? c(Error("Not enough credits to redeem.")) : 4 === f.readyState && "4" != f.status.substring(0, 1) && c(Error("Error in API: " + f.status));
      }
    };
    try {
      f.open(a.method, e, !0), f.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), f.send(g);
    } catch (k) {
      sessionStorage.setItem("use_jsonp", !0), jsonpMakeRequest(e, b, a.method, c);
    }
  }
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
Branch.prototype._api = function(a, b, c) {
  (a.params && a.params.app_id || a.queryPart && a.queryPart.app_id) && this.app_id && (b.app_id = this.app_id);
  (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && this.session_id && (b.session_id = this.session_id);
  (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && this.identity_id && (b.identity_id = this.identity_id);
  return api(a, b, c);
};
Branch.prototype.init = function(a, b) {
  b = b || function() {
  };
  if (this.initialized) {
    return b(utils.message(utils.messages.existingInit));
  }
  this.initialized = !0;
  this.app_id = a;
  var c = this, d = utils.readStore(), e = function(a) {
    delete a.session_id;
    delete a.identity_id;
    delete a.link;
    delete a.device_fingerprint;
    delete a.device_fingerprint_id;
    delete a.browser_fingerprint_id;
    return a;
  };
  d && !d.session_id && (d = null);
  d && (this.session_id = d.session_id, this.identity_id = d.identity_id, this.sessionLink = d.link);
  d && !utils.hashValue("r") ? b(null, e(d)) : this._api(resources._r, {}, function(a, d) {
    c._api(resources.open, {link_identifier:utils.hashValue("r"), is_referrable:1, browser_fingerprint_id:d}, function(a, d) {
      c.session_id = d.session_id;
      c.identity_id = d.identity_id;
      c.sessionLink = d.link;
      utils.store(d);
      b(a, e(d));
    });
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
  this._api(resources.logout, {}, function(b, c) {
    a(b, c);
  });
};
Branch.prototype.track = function(a, b, c) {
  c = c || function() {
  };
  if (!this.initialized) {
    return c(utils.message(utils.messages.nonInit));
  }
  "function" == typeof b && (c = b, b = {});
  this._api(resources.event, {event:a, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, {})}, function(a, b) {
    c(a, b);
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
  a.data = JSON.stringify(a.data);
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
Branch.prototype.sendSMS = function(a, b, c) {
  b = b || function() {
  };
  c = c || !1;
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  utils.readKeyValue("click_id") && !c ? this.sendSMSExisting(a.phone, b) : this.sendSMSNew(a, b);
};
Branch.prototype.sendSMSNew = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  a.channel = "sms";
  var c = this;
  this.link(a, function(d, e) {
    if (d) {
      return b(d);
    }
    c.linkClick(e, function(d) {
      var e = a.phone;
      if (d) {
        return b(d);
      }
      c.sendSMSExisting(e, function(a, c) {
        b(a, c);
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
  this._api(resources.SMSLinkSend, {link_url:utils.readStore().click_id, phone:a}, function(a, d) {
    b(a, d);
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
Branch.prototype.redeem = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  this._api(resources.redeem, {amount:a.amount, bucket:a.bucket}, function(a, d) {
    b(a, d);
  });
};
Branch.prototype.banner = function(a, b, c) {
  b = void 0 == b ? !0 : b;
  c = void 0 == c ? !0 : c;
  document.getElementById("branch-banner") || utils.readKeyValue("hideBanner") || (banner.smartBannerMarkup(a, b, c), banner.smartBannerStyles(b, c), banner.appendSmartBannerActions(this, a, b, c), banner.triggerBannerAnimation(b, c));
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
})();
