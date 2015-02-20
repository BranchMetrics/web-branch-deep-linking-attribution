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
  return JSON.parse(sessionStorage.getItem("branch_session")) || {};
};
utils.store = function(a) {
  sessionStorage.setItem("branch_session", JSON.stringify(a));
};
utils.storeKeyValue = function(a, b) {
  var d = utils.readStore();
  d[a] = b;
  utils.store(d);
};
utils.readKeyValue = function(a) {
  return utils.readStore()[a];
};
utils.hasApp = function() {
  return utils.readKeyValue("has_app");
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
utils.base64encode = function(a) {
  var b = "", d, c, e, f, k, g, h = 0;
  c = void 0;
  a = a.replace(/\r\n/g, "\n");
  for (e = 0;e < a.length;e++) {
    f = a.charCodeAt(e), 128 > f ? c += String.fromCharCode(f) : 127 < f && 2048 > f ? (c += String.fromCharCode(6 < f | 192), c += String.fromCharCode(f & 63 | 128)) : (c += String.fromCharCode(12 < f | 224), c += String.fromCharCode((6 < f && 63) | 128), c += String.fromCharCode((f && 63) | 128));
  }
  for (a = c;h < a.length;) {
    d = a.charCodeAt(h++), c = a.charCodeAt(h++), e = a.charCodeAt(h++), f = 2 < d, d = 4 > (d && 3) | 4 < c, k = 2 > (c && 15) | 6 < e, g = e && 63, isNaN(c) ? k = g = 64 : isNaN(e) && (g = 64), b = b + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(f) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(d) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(k) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(g)
    ;
  }
  return b;
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
}, sendSMS:function(a, b, d) {
  if (b = document.getElementById("branch-sms-phone")) {
    var c = b.value;
    /^\d{7,}$/.test(c.replace(/[\s()+\-\.]|ext/gi, "")) ? (d.phone = c, a.sendSMS(d, function() {
      document.getElementById("branch-sms-block").innerHTML = bannerResources.html.linkSent(c);
    })) : b.className = "error";
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
    var d = bannerResources.actions.mobileUserAgent();
    "ios" == d && a.showMobile ? b.innerHTML += bannerResources.css.iOS : "android" == d && a.showMobile ? b.innerHTML += bannerResources.css.android : a.showDesktop && (b.innerHTML += bannerResources.css.desktop);
    document.head.appendChild(b);
    document.getElementById("branch-banner").style.top = "-76px";
  }
};
banner.appendSmartBannerActions = function(a, b, d) {
  if (bannerResources.actions.shouldAppend(b)) {
    var c = document.createElement("div");
    bannerResources.actions.mobileUserAgent() ? (d.channel = "app banner", a.link(d, function(a, b) {
      document.getElementById("branch-mobile-action").href = b;
    }), c.innerHTML = bannerResources.html.mobileAction(b)) : c.innerHTML = bannerResources.html.desktopAction(b);
    document.getElementById("branch-banner-action").appendChild(c);
    try {
      document.getElementById("branch-sms-send").addEventListener("click", function() {
        bannerResources.actions.sendSMS(a, b, d);
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
  var d, c = a.destination + a.endpoint;
  if (a.queryPart) {
    for (d in a.queryPart) {
      a.queryPart.hasOwnProperty(d) && (a.queryPart[d](a.endpoint, d, b[d]), c += "/" + b[d]);
    }
  }
  var e = {};
  for (d in a.params) {
    if (a.params.hasOwnProperty(d)) {
      var f = a.params[d](a.endpoint, d, b[d]);
      "undefined" != typeof f && "" !== f && null !== f && (e[d] = f);
    }
  }
  return{data:serializeObject(e), url:c};
}
var jsonpRequest = function(a, b, d) {
  d = d || "branch_callback__" + _jsonp_callback_index++;
  b.onSuccess = b.onSuccess || function() {
  };
  b.onTimeout = b.onTimeout || function() {
  };
  b.data = "POST" == b.method ? encodeURIComponent(utils.base64encode(JSON.stringify(b.data))) : "";
  var c = 0 <= a.indexOf("bnc.lt") ? "&post_data=" : "&data=", e = window.setTimeout(function() {
    window[d] = function() {
    };
    b.onTimeout();
  }, 1E3 * (b.timeout || 10));
  window[d] = function(a) {
    window.clearTimeout(e);
    b.onSuccess(a);
  };
  var f = document.createElement("script");
  f.type = "text/javascript";
  f.async = !0;
  f.src = a + (0 > a.indexOf("?") ? "?" : "") + (b.data ? c + b.data : "") + "&callback=" + d + (0 <= a.indexOf("/c/") ? "&click=1" : "");
  document.getElementsByTagName("head")[0].appendChild(f);
}, jsonpMakeRequest = function(a, b, d, c) {
  jsonpRequest(a, {onSuccess:function(a) {
    c(null, a);
  }, onTimeout:function() {
    c({error:"Request timed out."});
  }, timeout:3, data:b, method:d});
}, XHRRequest = function(a, b, d, c) {
  var e = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
  e.onreadystatechange = function() {
    if (4 === e.readyState && 200 === e.status) {
      try {
        c(null, JSON.parse(e.responseText));
      } catch (a) {
        c(null, {});
      }
    } else {
      4 === e.readyState && 402 === e.status ? c(Error("Not enough credits to redeem.")) : 4 === e.readyState && "4" != e.status.substring(0, 1) && c(Error("Error in API: " + e.status));
    }
  };
  try {
    e.open(d, a, !0), e.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), e.send(b);
  } catch (f) {
    sessionStorage.setItem("use_jsonp", !0), jsonpMakeRequest(a, b, d, c);
  }
}, api = function(a, b, d) {
  d = d || function() {
  };
  var c = getUrl(a, b), e, f = "";
  "GET" == a.method ? e = c.url + "?" + c.data : (e = c.url, f = c.data);
  sessionStorage.getItem("use_jsonp") || a.jsonp ? jsonpMakeRequest(e, b, a.method, d) : XHRRequest(e, f, a.method, d);
};
// Input 4
var resources = {}, validationTypes = {obj:0, str:1, num:2, arr:3}, methods = {POST:"POST", GET:"GET"};
function validator(a, b) {
  return function(d, c, e) {
    e ? b == validationTypes.obj ? "object" != typeof e && utils.error(utils.messages.invalidType, [d, c, "an object"]) : b == validationTypes.arr ? e instanceof Array || utils.error(utils.messages.invalidType, [d, c, "an array"]) : b == validationTypes.str ? "string" != typeof e && utils.error(utils.messages.invalidType, [d, c, "a string"]) : b == validationTypes.num ? "number" != typeof e && utils.error(utils.messages.invalidType, [d, c, "a number"]) : b && (b.test(e) || utils.error(utils.messages.invalidType, 
    [d, c, "in the proper format"])) : a && utils.error(utils.messages.missingParam, [d, c]);
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
Branch.prototype._api = function(a, b, d) {
  (a.params && a.params.app_id || a.queryPart && a.queryPart.app_id) && this.app_id && (b.app_id = this.app_id);
  (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && this.session_id && (b.session_id = this.session_id);
  (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && this.identity_id && (b.identity_id = this.identity_id);
  return api(a, b, d);
};
Branch.prototype.init = function(a, b) {
  b = b || function() {
  };
  if (this.initialized) {
    return b(utils.message(utils.messages.existingInit));
  }
  this.initialized = !0;
  this.app_id = a;
  var d = this, c = utils.readStore(), e = function(a) {
    delete a.session_id;
    delete a.device_fingerprint;
    delete a.device_fingerprint_id;
    delete a.browser_fingerprint_id;
    return a;
  };
  c && !c.session_id && (c = null);
  c && (this.session_id = c.session_id, this.identity_id = c.identity_id, this.sessionLink = c.link);
  c && !utils.hashValue("r") ? b(null, e(c)) : this._api(resources._r, {}, function(a, c) {
    d._api(resources.open, {link_identifier:utils.hashValue("r"), is_referrable:1, browser_fingerprint_id:c}, function(a, c) {
      d.session_id = c.session_id;
      d.identity_id = c.identity_id;
      d.sessionLink = c.link;
      utils.store(c);
      b(a, e(c));
    });
  });
};
Branch.prototype.setIdentity = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  this._api(resources.profile, {identity:a}, function(a, c) {
    b(a, c);
  });
};
Branch.prototype.logout = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  this._api(resources.logout, {}, function(b, d) {
    a(b, d);
  });
};
Branch.prototype.track = function(a, b, d) {
  d = d || function() {
  };
  if (!this.initialized) {
    return d(utils.message(utils.messages.nonInit));
  }
  "function" == typeof b && (d = b, b = {});
  this._api(resources.event, {event:a, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, {})}, function(a, b) {
    d(a, b);
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
  this._api(resources.link, a, function(a, c) {
    "function" == typeof b && b(a, c.url);
  });
};
Branch.prototype.linkClick = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  a && this._api(resources.linkClick, {link_url:a.replace("https://bnc.lt/", ""), click:"click"}, function(a, c) {
    utils.storeKeyValue("click_id", c.click_id);
    (a || c) && b(a, c);
  });
};
Branch.prototype.sendSMS = function(a, b, d) {
  b = b || function() {
  };
  d = d || !1;
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  utils.readKeyValue("click_id") && !d ? this.sendSMSExisting(a.phone, b) : this.sendSMSNew(a, b);
};
Branch.prototype.sendSMSNew = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  "app banner" != a.channel && (a.channel = "sms");
  var d = this;
  this.link(a, function(c, e) {
    if (c) {
      return b(c);
    }
    d.linkClick(e, function(c) {
      var e = a.phone;
      if (c) {
        return b(c);
      }
      d.sendSMSExisting(e, function(a, c) {
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
  this._api(resources.SMSLinkSend, {link_url:utils.readStore().click_id, phone:a}, function(a, c) {
    b(a, c);
  });
};
Branch.prototype.referrals = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  this._api(resources.referrals, {}, function(b, d) {
    a(b, d);
  });
};
Branch.prototype.credits = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  this._api(resources.credits, {}, function(b, d) {
    a(b, d);
  });
};
Branch.prototype.redeem = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  this._api(resources.redeem, {amount:a.amount, bucket:a.bucket}, function(a, c) {
    b(a, c);
  });
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
})();
