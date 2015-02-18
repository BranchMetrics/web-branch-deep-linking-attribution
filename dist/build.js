(function() {// Input 0
var config = {link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:1};
// Input 1
var utils = {}, DEBUG = !0;
utils.messages = {missingParam:"API request $1 missing parameter $2", invalidType:"API request $1, parameter $2 is not $3", nonInit:"Branch SDK not initialized", existingInit:"Branch SDK already initilized", missingAppId:"Missing Branch app ID"};
utils.api = function(a, b, d) {
  (a.params && a.params.app_id || a.queryPart && a.queryPart.app_id) && branch.app_id && (b.app_id = branch.app_id);
  (a.params && a.params.session_id || a.queryPart && a.queryPart.session_id) && branch.session_id && (b.session_id = branch.session_id);
  (a.params && a.params.identity_id || a.queryPart && a.queryPart.identity_id) && branch.identity_id && (b.identity_id = branch.identity_id);
  return api(a, b, d);
};
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
// Input 2
var elements = {}, animationSpeed = 250, animationDelay = 20;
elements.smartBannerMarkup = function(a) {
  var b = document.createElement("div");
  b.id = "branch-banner";
  b.innerHTML = bannerResources.html.banner(a);
  return b;
};
elements.smartBannerStyles = function() {
  var a = document.createElement("style");
  a.type = "text/css";
  a.id = "branch-css";
  a.innerHTML = bannerResources.css.banner;
  var b = bannerResources.actions.mobileUserAgent();
  a.innerHTML = "ios" == b ? a.innerHTML + bannerResources.css.iOS : "android" == b ? a.innerHTML + bannerResources.css.android : a.innerHTML + bannerResources.css.desktop;
  return a;
};
elements.appendSmartBannerActions = function(a) {
  var b = document.createElement("div");
  bannerResources.actions.mobileUserAgent() ? (branch.link({channel:"appBanner", data:a.data || {}}, function(a, b) {
    document.getElementById("branch-mobile-action").href = b;
  }), b.innerHTML = bannerResources.html.mobileAction(a)) : b.innerHTML = bannerResources.html.desktopAction(a);
  document.getElementById("branch-banner-action").appendChild(b);
  try {
    sendAction = bannerResources.actions.sendSMS, document.getElementById("branch-sms-send").addEventListener("click", function() {
      sendAction(a);
    });
  } catch (d) {
  }
  document.getElementById("branch-banner-close").onclick = bannerResources.actions.close;
};
elements.triggerBannerAnimation = function() {
  document.body.style.marginTop = "71px";
  setTimeout(function() {
    document.getElementById("branch-banner").style.top = "0";
  }, animationDelay);
};
var bannerResources = {css:{banner:"body { -webkit-transition: all " + 1.5 * animationSpeed / 1E3 + "s ease; transition: all 0" + 1.5 * animationSpeed / 1E3 + "s ease; }#branch-banner { top: -76px; width: 100%; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; -webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all " + animationSpeed / 1E3 + "s ease; transition: all 0" + 
animationSpeed / 1E3 + 's ease; }#branch-banner .close-x { float: left; font-weight: 400; margin-right: 6px; margin-left: 0; cursor: pointer; }#branch-banner .content { position: absolute; width: 100%; height: 76px; z-index: 99999; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; }#branch-banner .content .left { width: 70%; float: left; padding: 8px 8px 8px 8px; }#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }#branch-banner .content .right a { font-size: 14px; font-weight: 500; }#branch-banner-action div { float: right; margin-right: 8px; }#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }#branch-banner .content .left .details { margin-top: 3px; padding-left: 4px; }#branch-banner .content .left .details .title { font: 14px/1.5em HelveticaNeue-Medium, Helvetica Neue Medium, Helvetica Neue, Sans-serif; color: rgba(0, 0, 0, 0.9); display: inline-block; }#branch-banner .content .left .details .description { font-size: 12px; font-weight: normal; line-height: 1.5em; color: rgba(0, 0, 0, 0.5); display: block; }#branch-banner .content .right { display:inline-block; position: relative; top: 50%; transform: translateY(-50%); -webkit-transform: translateY(-50%); }', 
iOS:"body { -webkit-transition: all " + 1.5 * animationSpeed / 1E3 + "s ease; transition: all 0" + 1.5 * animationSpeed / 1E3 + "s ease; }#branch-banner { position: absolute; top: -76px; width: 100%; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; -webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all " + animationSpeed / 1E3 + "s ease; transition: all 0" + 
animationSpeed / 1E3 + 's ease; }#branch-banner .close-x { color: #aaa; margin-top: 13px; font-size: 20px; float: left; font-weight: 400; color: #aaa; font-size: 20px; margin-top: 13px; margin-right: 6px; margin-left: 0; cursor: pointer; }#branch-banner .content { position: absolute; width: 100%; height: 76px; z-index: 99999; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; }#branch-banner .content .left { width: 70%; float: left; padding: 8px 8px 8px 8px; }#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }#branch-banner .content .right a { font-size: 14px; font-weight: 500; color: #007aff; color: #007aff; }#branch-banner-action div { float: right; margin-right: 8px; }#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }#branch-banner .content .left .details { margin-top: 3px; padding-left: 4px; }#branch-banner .content .left .details .title { font: 14px/1.5em HelveticaNeue-Medium, Helvetica Neue Medium, Helvetica Neue, Sans-serif; color: rgba(0, 0, 0, 0.9); display: inline-block; }#branch-banner .content .left .details .description { font-size: 12px; font-weight: normal; line-height: 1.5em; color: rgba(0, 0, 0, 0.5); display: block; }#branch-banner .content .right { display:inline-block; position: relative; top: 50%; transform: translateY(-50%); -webkit-transform: translateY(-50%); }', 
desktop:"#branch-banner .content .left { width: 50% }#branch-banner .close-x { color: #aaa; margin-top: 13px; font-size: 20px; }#branch-banner .content .right { width: 50% }#branch-banner { position: fixed; }#branch-banner .content .right a { color: #007aff; }#branch-banner .content .right input { font-weight: 400; border-radius: 4px; height: 30px; border: 1px solid #ccc; padding: 5px 7px 4px; width: 125px; font-size: 14px; }#branch-banner .content .right button { margin-top: 0px; display: inline-block; height: 30px;; float: right; margin-left: 5px; font-weight: 400; border-radius: 4px; border: 1px solid #ccc; background: #fff; color: #000; padding: 0px 12px; }#branch-banner .content .right button:hover { border: 1px solid #BABABA; background: #E0E0E0; }#branch-banner .content .right input:focus, button:focus { outline: none; }#branch-banner .content .right input.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }#branch-banner .content .right span { display: inline-block; font-weight: 400; margin: 7px 9px; font-size: 14px; }", 
android:"#branch-banner { position: absolute; }#branch-banner .close-x { text-align: center; font-size: 15px; border-radius:14px; border:0; width:17px; height:17px; line-height:14px; color:#b1b1b3; background:#efefef; }#branch-mobile-action { text-decoration:none; border-bottom: 3px solid #b3c833; padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; font-weight: bold; background-color: #b3c833; border-radius: 5px; }#branch-mobile-action:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }"}, 
html:{banner:function(a) {
  return'<div class="content"><div class="left"><div class="close-x" id="branch-banner-close">&times;</div><div class="icon" style="float: left;"><img src="' + a.icon + '"></div><div class="details"><span class="title">' + a.title + '</span><span class="description">' + a.description + '</span></div></div><div class="right" id="branch-banner-action"></div></div>';
}, desktopAction:function(a) {
  return'<div id="branch-sms-block"><input type="phone" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999"><button id="branch-sms-send">Send Link</button></div>';
}, mobileAction:function(a) {
  var b = a.openAppButtonText || "View in app";
  a = a.downloadAppButtonText || "Download App";
  return'<a id="branch-mobile-action" href="#">' + (utils.hasApp() ? b : a) + "</a>";
}, linkSent:function(a) {
  return'<span class="sms-sent">Link sent to ' + a + "</span>";
}}, actions:{removeElement:function(a) {
  (a = document.getElementById("branch-banner")) && a.parentNode.removeChild(a);
}, sendSMS:function(a) {
  var b = document.getElementById("branch-sms-phone");
  if (b) {
    var d = b.value;
    /^\d{7,}$/.test(d.replace(/[\s()+\-\.]|ext/gi, "")) ? branch.SMSLink({phone:d, data:a.data || {}}, function() {
      document.getElementById("branch-sms-block").innerHTML = bannerResources.html.linkSent(d);
    }) : b.className = "error";
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
  utils.storeKeyValue("bannerShown", !0);
}, mobileUserAgent:function() {
  return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i) ? navigator.userAgent.match(/android/i) ? "android" : "ios" : !1;
}}};
// Input 3
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
        d(null, {});
      }
    } else {
      4 === e.readyState && 402 === e.status ? d(Error("Not enough credits to redeem.")) : 4 === e.readyState && "4" != e.status.substring(0, 1) && d(Error("Error in API: " + e.status));
    }
  };
  e.open(a.method, c, !0);
  e.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  e.send(f);
};
// Input 4
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
var Branch = function() {
  this.initialized = !1;
};
Branch.prototype.init = function(a, b) {
  b = b || function() {
  };
  if (this.initialized) {
    return b(utils.message(utils.messages.existingInit));
  }
  this.initialized = !0;
  this.app_id = a;
  var d = this, c = utils.readStore();
  c && !c.session_id && (c = null);
  c && (this.session_id = c.session_id, this.identity_id = c.identity_id, this.sessionLink = c.link);
  c && !utils.hashValue("r") ? b(null, c) : utils.api(resources._r, {}, function(a, c) {
    utils.api(resources.open, {link_identifier:utils.hashValue("r"), is_referrable:1, browser_fingerprint_id:c}, function(a, c) {
      d.session_id = c.session_id;
      d.identity_id = c.identity_id;
      d.sessionLink = c.link;
      utils.store(c);
      b(a, c);
    });
  });
};
Branch.prototype.setIdentity = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  utils.api(resources.profile, {identity:a}, function(a, c) {
    b(a, c);
  });
};
Branch.prototype.logout = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  utils.api(resources.logout, {}, function(b, d) {
    a(b, d);
  });
};
Branch.prototype.event = function(a, b, d) {
  d = d || function() {
  };
  if (!this.initialized) {
    return d(utils.message(utils.messages.nonInit));
  }
  "function" == typeof b && (d = b, b = {});
  utils.api(resources.event, {event:a, metadata:utils.merge({url:document.URL, user_agent:navigator.userAgent, language:navigator.language}, {})}, function(a, b) {
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
  utils.api(resources.link, a, function(a, c) {
    "function" == typeof b && b(a, c.url);
  });
};
Branch.prototype.linkClick = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  utils.api(resources.linkClick, {link_url:a.replace("https://bnc.lt/", ""), click:"click"}, function(a, c) {
    utils.storeKeyValue("click_id", c.click_id);
    (a || c) && b(a, c);
  });
};
Branch.prototype.sendSMS = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  utils.readKeyValue("click_id") ? this.sendSMSExisting(a.phone, b) : this.sendSMSNew(a, b);
};
Branch.prototype.sendSMSNew = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  a.channel = "sms";
  var d = this;
  this.link(a, function(c, f) {
    d.linkClick(f, function(c, f) {
      d.sendSMSExisting(a.phone, function(a, c) {
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
  utils.api(resources.SMSLinkSend, {link_url:utils.readStore().click_id, phone:a}, function(a, c) {
    b(a, c);
  });
};
Branch.prototype.referrals = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  utils.api(resources.referrals, {}, function(b, d) {
    a(b, d);
  });
};
Branch.prototype.credits = function(a) {
  a = a || function() {
  };
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  utils.api(resources.credits, {identity_id:this.identity_id}, function(b, d) {
    a(b, d);
  });
};
Branch.prototype.redeem = function(a, b) {
  b = b || function() {
  };
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  utils.api(resources.redeem, {amount:a.amount, bucket:a.bucket}, function(a, c) {
    b(a, c);
  });
};
Branch.prototype.banner = function(a) {
  document.getElementById("branch-banner") || utils.readKeyValue("bannerShown") || (document.head.appendChild(elements.smartBannerStyles()), document.body.appendChild(elements.smartBannerMarkup(a)), document.getElementById("branch-banner").style.top = "-76px", elements.appendSmartBannerActions(a), elements.triggerBannerAnimation());
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
