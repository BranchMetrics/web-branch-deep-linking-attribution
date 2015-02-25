(function() {// Input 0
var config = {link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:1};
// Input 1
var utils = {}, DEBUG = !0;
utils.messages = {missingParam:"API request $1 missing parameter $2", invalidType:"API request $1, parameter $2 is not $3", nonInit:"Branch SDK not initialized", existingInit:"Branch SDK already initilized", missingAppId:"Missing Branch app ID", callBranchInitFirst:"Branch.init must be called first", timeout:"Request timed out"};
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
utils.whiteListSessionData = function(a) {
  var b = ["data", "referring_identity", "identity", "has_app"], d = {}, c;
  for (c in a) {
    -1 < b.indexOf(c) && (d[c] = a[c]);
  }
  return d;
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
utils.base64encode = function(a) {
  var b = "", d, c, e, h, n, v, r = 0;
  c = void 0;
  a = a.replace(/\r\n/g, "\n");
  c = "";
  for (e = 0;e < a.length;e++) {
    h = a.charCodeAt(e), 128 > h ? c += String.fromCharCode(h) : (127 < h && 2048 > h ? c += String.fromCharCode(h >> 6 | 192) : (c += String.fromCharCode(h >> 12 | 224), c += String.fromCharCode(h >> 6 & 63 | 128)), c += String.fromCharCode(h & 63 | 128));
  }
  for (a = c;r < a.length;) {
    d = a.charCodeAt(r++), c = a.charCodeAt(r++), e = a.charCodeAt(r++), h = d >> 2, d = (d & 3) << 4 | c >> 4, n = (c & 15) << 2 | e >> 6, v = e & 63, isNaN(c) ? n = v = 64 : isNaN(e) && (v = 64), b = b + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(h) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(d) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(n) + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(v)
    ;
  }
  return b;
};
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
  return function(d) {
    a.push(d);
    1 == a.length && b();
  };
};
// Input 3
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
  var c = document.getElementById("branch-sms-phone");
  if (c) {
    var e = c.value;
    /^\d{7,}$/.test(e.replace(/[\s()+\-\.]|ext/gi, "")) ? a.sendSMS(e, d, b, function() {
      document.getElementById("branch-sms-block").innerHTML = bannerResources.html.linkSent(e);
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
// Input 4
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
      var h = a.params[d](a.endpoint, d, b[d]);
      "undefined" != typeof h && "" !== h && null !== h && (e[d] = h);
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
  var h = document.createElement("script");
  h.type = "text/javascript";
  h.async = !0;
  h.src = a + (0 > a.indexOf("?") ? "?" : "") + (b.data ? c + b.data : "") + "&callback=" + d + (0 <= a.indexOf("/c/") ? "&click=1" : "");
  document.getElementsByTagName("head")[0].appendChild(h);
}, jsonpMakeRequest = function(a, b, d, c) {
  jsonpRequest(a, {onSuccess:function(a) {
    c(null, a);
  }, onTimeout:function() {
    c(utils.error(utils.messages.timeout));
  }, timeout:10, data:b, method:d});
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
  } catch (h) {
    sessionStorage.setItem("use_jsonp", !0), jsonpMakeRequest(a, b, d, c);
  }
}, api = function(a, b, d) {
  var c = getUrl(a, b), e, h = "";
  "GET" == a.method ? e = c.url + "?" + c.data : (e = c.url, h = c.data);
  sessionStorage.getItem("use_jsonp") || a.jsonp ? jsonpMakeRequest(e, b, a.method, d) : XHRRequest(e, h, a.method, d);
};
// Input 5
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
// Input 6
var default_branch, Branch = function() {
  if (!(this instanceof Branch)) {
    return default_branch || (default_branch = new Branch), default_branch;
  }
  this._queue = new Queue;
  this.initialized = !1;
};
Branch.prototype._api = function(a, b, d) {
  var c = this;
  this._queue(function(e) {
    (a.params && a.params.app_id || a.queryPart && a.queryPart.app_id) && c.app_id && (b.app_id = c.app_id);
    (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && c.session_id && (b.session_id = c.session_id);
    (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && c.identity_id && (b.identity_id = c.identity_id);
    return api(a, b, function(a, b) {
      e();
      d(a, b);
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
  var d = this, c = utils.readStore(), e = function(a) {
    d.session_id = a.session_id;
    d.identity_id = a.identity_id;
    d.sessionLink = a.link;
    d.initialized = !0;
  };
  c && c.session_id ? (e(c), b(null, utils.whiteListSessionData(c))) : this._api(resources._r, {}, function(a, c) {
    d._api(resources.open, {is_referrable:1, browser_fingerprint_id:c}, function(a, d) {
      e(d);
      utils.store(d);
      b(a, utils.whiteListSessionData(d));
    });
  });
};
Branch.prototype.data = function(a) {
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
  this._api(resources.logout, {}, function(b) {
    a(b);
  });
};
Branch.prototype.track = function(a, b, d) {
  d = d || function() {
  };
  if (!this.initialized) {
    return d(utils.message(utils.messages.nonInit));
  }
  "function" == typeof b && (d = b, b = {});
  this._api(resources.event, {event:a, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, {})}, function(a) {
    d(a);
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
Branch.prototype.sendSMS = function(a, b, d, c) {
  c = c || function() {
  };
  d = d || {};
  d.make_new_link = d.make_new_link || !1;
  if (!this.initialized) {
    return c(utils.message(utils.messages.nonInit));
  }
  utils.readKeyValue("click_id") && !d.make_new_link ? this.sendSMSExisting(a, c) : this.sendSMSNew(a, b, c);
};
Branch.prototype.sendSMSNew = function(a, b, d) {
  d = d || function() {
  };
  var c = this;
  if (!this.initialized) {
    return d(utils.message(utils.messages.nonInit));
  }
  "app banner" != b.channel && (b.channel = "sms");
  this.link(b, function(b, h) {
    if (b) {
      return d(b);
    }
    c.linkClick(h, function(b) {
      if (b) {
        return d(b);
      }
      c.sendSMSExisting(a, function(a) {
        d(a);
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
  this._api(resources.referrals, {}, function(b, d) {
    a(b, d);
  });
};
Branch.prototype.credits = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return this.nextQueue(), a(utils.message(utils.messages.nonInit));
  }
  this._api(resources.credits, {}, function(b, d) {
    a(b, d);
  });
};
Branch.prototype.redeem = function(a, b, d) {
  d = d || function() {
  };
  if (!this.initialized) {
    return this.nextQueue(), d(utils.message(utils.messages.nonInit));
  }
  this._api(resources.redeem, {amount:a, bucket:b}, function(a, b) {
    d(a, b);
  });
};
Branch.prototype.banner = function(a, b) {
  a.showMobile = void 0 === a.showMobile ? !0 : a.showMobile;
  a.showDesktop = void 0 === a.showDesktop ? !0 : a.showDesktop;
  document.getElementById("branch-banner") || utils.readKeyValue("hideBanner") || (banner.smartBannerMarkup(a), banner.smartBannerStyles(a), banner.appendSmartBannerActions(this, a, b), banner.triggerBannerAnimation(a));
};
// Input 7
var branch_instance = new Branch;
if (window.branch && window.branch._q) {
  for (var queue = window.branch._q, i = 0;i < queue.length;i++) {
    var task = queue[i];
    branch_instance[task[0]].apply(branch_instance, task[1]);
  }
}
;
// Input 8
"function" === typeof define && define.amd ? define("branch", function() {
  return branch_instance;
}) : "object" === typeof exports && (module.exports = branch_instance);
window && (window.branch = branch_instance);
// Input 9
(function() {
  function a(b, c) {
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
            if (b = k("json-stringify") && u) {
              var d = c.stringify;
              h(function() {
                b = '"-271821-04-20T00:00:00.000Z"' == d(new w(-864E13)) && '"+275760-09-13T00:00:00.000Z"' == d(new w(864E13)) && '"-000001-01-01T00:00:00.000Z"' == d(new w(-621987552E5)) && '"1969-12-31T23:59:59.999Z"' == d(new w(-1));
              });
            }
          } else {
            var e;
            if ("json-stringify" == a) {
              var d = c.stringify, f = "function" == typeof d;
              f && ((e = function() {
                return 1;
              }).toJSON = e, h(function() {
                f = "0" === d(0) && "0" === d(new v) && '""' == d(new r) && d(q) === t && d(t) === t && d() === t && "1" === d(e) && "[1]" == d([e]) && "[null]" == d([t]) && "null" == d(null) && "[null,null,null]" == d([t, q, null]) && '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}' == d({a:[e, !0, !1, null, "\x00\b\n\f\r\t"]}) && "1" === d(null, e) && "[\n 1,\n 2\n]" == d([1, 2], null, 1);
              }, function() {
                f = !1;
              }));
              b = f;
            }
            if ("json-parse" == a) {
              var z = c.parse, g;
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
    c || (c = e.Object());
    var v = b.Number || e.Number, r = b.String || e.String, n = b.Object || e.Object, w = b.Date || e.Date, A = b.SyntaxError || e.SyntaxError, O = b.TypeError || e.TypeError, P = b.Math || e.Math, C = b.JSON || e.JSON;
    "object" == typeof C && C && (c.stringify = C.stringify, c.parse = C.parse);
    var n = n.prototype, q = n.toString, D = n.hasOwnProperty, t, u = new w(-0xc782b5b800cec);
    h(function() {
      u = -109252 == u.getUTCFullYear() && 0 === u.getUTCMonth() && 1 === u.getUTCDate() && 10 == u.getUTCHours() && 37 == u.getUTCMinutes() && 6 == u.getUTCSeconds() && 708 == u.getUTCMilliseconds();
    });
    k["bug-string-char-index"] = k["date-serialization"] = k.json = k["json-stringify"] = k["json-parse"] = null;
    if (!k("json")) {
      var G = k("bug-string-char-index"), B = function(a, b) {
        var c = 0, e, f, h;
        (e = function() {
          this.valueOf = 0;
        }).prototype.valueOf = 0;
        f = new e;
        for (h in f) {
          D.call(f, h) && c++;
        }
        e = f = null;
        c ? B = function(a, b) {
          var d = "[object Function]" == q.call(a), c, e;
          for (c in a) {
            d && "prototype" == c || !D.call(a, c) || (e = "constructor" === c) || b(c);
          }
          (e || D.call(a, c = "constructor")) && b(c);
        } : (f = "valueOf toString toLocaleString propertyIsEnumerable isPrototypeOf hasOwnProperty constructor".split(" "), B = function(a, b) {
          var c = "[object Function]" == q.call(a), e, K = !c && "function" != typeof a.constructor && d[typeof a.hasOwnProperty] && a.hasOwnProperty || D;
          for (e in a) {
            c && "prototype" == e || !K.call(a, e) || b(e);
          }
          for (c = f.length;e = f[--c];K.call(a, e) && b(e)) {
          }
        });
        return B(a, b);
      };
      if (!k("json-stringify") && !k("date-serialization")) {
        var Q = {92:"\\\\", 34:'\\"', 8:"\\b", 12:"\\f", 10:"\\n", 13:"\\r", 9:"\\t"}, x = function(a, b) {
          return("000000" + (b || 0)).slice(-a);
        }, E = function(a) {
          var b, d, c, e, f, g, h, k, l;
          if (u) {
            b = function(a) {
              d = a.getUTCFullYear();
              c = a.getUTCMonth();
              e = a.getUTCDate();
              g = a.getUTCHours();
              h = a.getUTCMinutes();
              k = a.getUTCSeconds();
              l = a.getUTCMilliseconds();
            };
          } else {
            var p = P.floor, n = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], q = function(a, b) {
              return n[b] + 365 * (a - 1970) + p((a - 1969 + (b = +(1 < b))) / 4) - p((a - 1901 + b) / 100) + p((a - 1601 + b) / 400);
            };
            b = function(a) {
              e = p(a / 864E5);
              for (d = p(e / 365.2425) + 1970 - 1;q(d + 1, 0) <= e;d++) {
              }
              for (c = p((e - q(d, 0)) / 30.42);q(d, c + 1) <= e;c++) {
              }
              e = 1 + e - q(d, c);
              f = (a % 864E5 + 864E5) % 864E5;
              g = p(f / 36E5) % 24;
              h = p(f / 6E4) % 60;
              k = p(f / 1E3) % 60;
              l = f % 1E3;
            };
          }
          E = function(a) {
            a > -1 / 0 && a < 1 / 0 ? (b(a), a = (0 >= d || 1E4 <= d ? (0 > d ? "-" : "+") + x(6, 0 > d ? -d : d) : x(4, d)) + "-" + x(2, c + 1) + "-" + x(2, e) + "T" + x(2, g) + ":" + x(2, h) + ":" + x(2, k) + "." + x(3, l) + "Z", d = c = e = g = h = k = l = null) : a = null;
            return a;
          };
          return E(a);
        };
        if (k("json-stringify") && !k("date-serialization")) {
          var R = function(a) {
            return E(this);
          }, S = c.stringify;
          c.stringify = function(a, b, d) {
            var c = w.prototype.toJSON;
            w.prototype.toJSON = R;
            a = S(a, b, d);
            w.prototype.toJSON = c;
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
          }, I = function(a, b, d, c, e, f, g) {
            var m, k, l, p, n, r;
            h(function() {
              m = b[a];
            });
            "object" == typeof m && m && (m.getUTCFullYear && "[object Date]" == q.call(m) && m.toJSON === w.prototype.toJSON ? m = E(m) : "function" == typeof m.toJSON && (m = m.toJSON(a)));
            d && (m = d.call(b, a, m));
            if (m == t) {
              return m === t ? m : "null";
            }
            k = typeof m;
            "object" == k && (l = q.call(m));
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
              r = f;
              f += e;
              if ("[object Array]" == l) {
                n = 0;
                for (k = m.length;n < k;n++) {
                  l = I(n, m, d, c, e, f, g), p.push(l === t ? "null" : l);
                }
                k = p.length ? e ? "[\n" + f + p.join(",\n" + f) + "\n" + r + "]" : "[" + p.join(",") + "]" : "[]";
              } else {
                B(c || m, function(a) {
                  var b = I(a, m, d, c, e, f, g);
                  b !== t && p.push(L(a) + ":" + (e ? " " : "") + b);
                }), k = p.length ? e ? "{\n" + f + p.join(",\n" + f) + "\n" + r + "}" : "{" + p.join(",") + "}" : "{}";
              }
              g.pop();
              return k;
            }
          };
          c.stringify = function(a, b, c) {
            var e, f, h, g;
            if (d[typeof b] && b) {
              if (g = q.call(b), "[object Function]" == g) {
                f = b;
              } else {
                if ("[object Array]" == g) {
                  h = {};
                  for (var k = 0, l = b.length, n;k < l;n = b[k++], (g = q.call(n), "[object String]" == g || "[object Number]" == g) && (h[n] = 1)) {
                  }
                }
              }
            }
            if (c) {
              if (g = q.call(c), "[object Number]" == g) {
                if (0 < (c -= c % 1)) {
                  for (e = "", 10 < c && (c = 10);e.length < c;e += " ") {
                  }
                }
              } else {
                "[object String]" == g && (e = 10 >= c.length ? c : c.slice(0, 10));
              }
            }
            return I("", (n = {}, n[""] = a, n), f, h, e, "", []);
          };
        }
      }
      if (!k("json-parse")) {
        var U = r.fromCharCode, V = {92:"\\", 34:'"', 47:"/", 98:"\b", 116:"\t", 110:"\n", 102:"\f", 114:"\r"}, f, F, l = function() {
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
            if ("[object Array]" == q.call(d)) {
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
        c.parse = function(a, b) {
          var c, d;
          f = 0;
          F = "" + a;
          c = J(y());
          "$" != y() && l();
          f = F = null;
          return b && "[object Function]" == q.call(b) ? M((d = {}, d[""] = c, d), "", b) : c;
        };
      }
    }
    c.runInContext = a;
    return c;
  }
  var b = "function" === typeof define && define.amd, d = {"function":!0, object:!0}, c = d[typeof exports] && exports && !exports.nodeType && exports, e = d[typeof window] && window || this, h = c && d[typeof module] && module && !module.nodeType && "object" == typeof global && global;
  !h || h.global !== h && h.window !== h && h.self !== h || (e = h);
  if (c && !b) {
    a(e, c);
  } else {
    var n = e.JSON, v = e.JSON3, r = !1, A = a(e, e.JSON3 = {noConflict:function() {
      r || (r = !0, e.JSON = n, e.JSON3 = v, n = v = null);
      return A;
    }});
    e.JSON = {parse:A.parse, stringify:A.stringify};
  }
  b && define(function() {
    return A;
  });
}).call(this);
})();
