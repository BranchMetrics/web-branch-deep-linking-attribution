(function() {// Input 0
var config = {link_service_endpoint:"https://bnc.lt", api_endpoint:"https://api.branch.io", version:1};
// Input 1
var utils = {}, DEBUG = !0, message;
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
utils.mobileUserAgent = function() {
  return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i);
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
  var e = {};
  for (c in a.params) {
    if (a.params.hasOwnProperty(c)) {
      var f = a.params[c](a.endpoint, c, b[c]);
      "undefined" != typeof f && "" !== f && null !== f && (e[c] = f);
    }
  }
  return{data:serializeObject(e), url:d};
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
  var c, e = "";
  "GET" == a.method ? c = b.url + "?" + b.data : (c = b.url, e = b.data);
  if (a.jsonp) {
    return jsonp(c, d);
  }
  var f = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
  f.onreadystatechange = function() {
    if (4 === f.readyState && 200 === f.status) {
      try {
        d(null, JSON.parse(f.responseText));
      } catch (a) {
        d(a);
      }
    } else {
      4 === f.readyState && 402 === f.status && d(Error("Not enough credits to redeem."));
    }
  };
  f.open(a.method, c, !0);
  f.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  f.send(e);
};
// Input 3
var resources = {}, methods = {POST:"POST", GET:"GET"}, validationTypes = {obj:0, str:1, num:2, arr:3};
function validator(a, b) {
  return function(d, c, e) {
    e ? b == validationTypes.obj ? "object" != typeof e && utils.error(utils.messages.invalidType, [d, c, "an object"]) : b == validationTypes.arr ? e instanceof Array || utils.error(utils.messages.invalidType, [d, c, "an array"]) : b == validationTypes.str ? "string" != typeof e && utils.error(utils.messages.invalidType, [d, c, "a string"]) : b == validationTypes.num ? "number" != typeof e && utils.error(utils.messages.invalidType, [d, c, "a number"]) : b && (b.test(e) || utils.error(utils.messages.invalidType, 
    [d, c, "in the proper format"])) : a && utils.error(utils.messages.missingParam, [d, c]);
    return e;
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
resources.createLinkClick = {destination:config.link_service_endpoint, endpoint:"", method:"GET", queryPart:{link_url:validator(!0, validationTypes.str)}, params:{click:validator(!0, validationTypes.str)}};
resources.sendSMSLink = {destination:config.link_service_endpoint, endpoint:"/c", method:"POST", queryPart:{link_url:validator(!0, validationTypes.str)}, params:{phone:validator(!0, validationTypes.str)}};
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
Branch.prototype.createLinkClick = function(a, b) {
  if (!this.initialized) {
    return utils.console(config.debugMsgs.nonInit);
  }
  this.api(resources.createLinkClick, {link_url:a.replace("https://bnc.lt/", ""), click:"click"}, function(a, c) {
    a ? b(a) : b(null, c);
  });
};
Branch.prototype.SMSLink = function(a, b) {
  if (!this.initialized) {
    return utils.console(config.debugMsgs.nonInit);
  }
  a.channel = "sms";
  var d = this;
  this.createLink(a, function(c, e) {
    c ? b(c) : d.createLinkClick(e, function(c, e) {
      c ? b(c) : d.sendSMSLink(a.phone, e, function(a) {
        "function" == typeof b && b({});
      });
    });
  });
};
Branch.prototype.sendSMSLink = function(a, b, d) {
  this.api(resources.sendSMSLink, {link_url:b.click_id, phone:a}, function(a, b) {
    a ? d(a) : d(b);
  });
};
Branch.prototype.showReferrals = function(a) {
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  this.api(resources.referrals, {identity_id:this.identity_id}, function(b, d) {
    b ? a(b) : a(d);
  });
};
Branch.prototype.showCredits = function(a) {
  if (!this.initialized) {
    return a(utils.message(utils.messages.nonInit));
  }
  this.api(resources.credits, {identity_id:this.identity_id}, function(b, d) {
    b ? a(b) : a(d);
  });
};
Branch.prototype.redeemCredits = function(a, b) {
  if (!this.initialized) {
    return b(utils.message(utils.messages.nonInit));
  }
  this.api(resources.redeem, {identity_id:this.identity_id, app_id:this.app_id, amount:a.amount, bucket:a.bucket}, function(a, c) {
    a ? b(a) : b(c);
  });
};
Branch.prototype.appBanner = function(a) {
  if (!this.initialized) {
    return callback(utils.message(utils.messages.nonInit));
  }
  var b = document.head, d = document.body, c = document.createElement("style"), e = document.createElement("div"), f = document.createElement("div"), g = document.createElement("div");
  d.style.marginTop = "71px";
  c.type = "text/css";
  c.innerHTML = "#branch-banner { position: fixed; top: 0px; width: 100%; font-family: Helvetica, Arial, sans-serif; }#branch-banner .close-x { float: left; font-weight: 200; color: #aaa; font-size: 14px; padding-right: 4px; margin-top: -5px; margin-left: -2px; cursor: pointer; }#branch-banner .content { position: absolute; width: 100%; height: 71px; z-index: 99999; background: white; color: #444; border-bottom: 1px solid #ddd; }#branch-banner .content .left { width: 60%; float: left; padding: 5px 0 0 7px; }#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }";
  f.innerHTML = '<div id="branch-banner"><div class="content"><div class="left"><div class="close-x" id="branch-banner-close">&times;</div><div class="icon" style="float: left;"><img src="' + a.icon + '"></div><div class="details"><span class="title">' + a.title + '</span><span class="description">' + a.description + '</span></div></div><div class="right" id="branch-banner-action"></div></div></div>';
  var h = function() {
    var b = document.getElementById("branch-sms-phone"), c = b.value.replace(/[^0-9.]/g, "");
    /^\d{7,}$/.test(c.replace(/[\s()+\-\.]|ext/gi, "")) ? branch.SMSLink({phone:c, data:a.data ? a.data : {}}, function() {
      document.getElementById("branch-sms-block").innerHTML = '<span class="sms-sent">App link sent to ' + c + "!</span>";
    }) : b.className = "error";
  };
  b.appendChild(c);
  e.appendChild(f);
  d.appendChild(e);
  document.getElementById("branch-banner-action").appendChild(g);
  document.getElementById("branch-banner-close").onclick = function() {
    var a = document.getElementById("branch-banner");
    a && (a.parentNode.removeChild(a), document.body.style.marginTop = "0px");
  };
  utils.mobileUserAgent() ? this.createLink({channel:"appBanner", data:a.data || {}}, function(a) {
    c.innerHTML += "#branch-banner .close-x { float: left; font-weight: 200; color: #aaa; font-size: 14px; padding-right: 4px; margin-top: -5px; margin-left: -2px; cursor: pointer; }#branch-banner .content .left .details { margin: 13px 0; }#branch-banner .content .left .details .title { display: block; font-size: 12px; font-weight: 400; }#branch-banner .content .left .details .description { display: block; font-size: 10px; font-weight: 200; }#branch-banner .content .right { width: 40%; float: left; padding: 23px 6px 0 0; text-align: right; }#branch-banner .content .right a { display: block; float: right; margin-right: 5px; background: #6EBADF; color: white; font-size: 10px; font-weight: 400; padding: 5px 5px 4px; border-radius: 2px; letter-spacing: .08rem; text-transform: uppercase; }#branch-banner .content .right a:hover { text-decoration: none; }";
    g.innerHTML = '<a href="' + a + '">View in App</a>';
  }) : (c.innerHTML += "#branch-banner .content .left .details { margin: 10px 0; }#branch-banner .content .left .details .title { display: block; font-size: 14px; font-weight: 400; }#branch-banner .content .left .details .description { display: block; font-size: 12px; font-weight: 200; }#branch-banner .content .right { width: 40%; float: left; padding: 21px 9px 0 0; text-align: right; }#branch-banner .content .right input { font-weight: 100; border-radius: 2px; border: 1px solid #bbb; padding: 5px 7px 4px; width: 125px; text-align: center; font-size: 12px; }#branch-banner .content .right button { margin-top: 0px; display: inline-block; height: 28px; float: right; margin-left: 5px; font-family: Helvetica, Arial, sans-serif; font-weight: 400; border-radius: 2px; border: 1px solid #6EBADF; background: #6EBADF; color: white; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; padding: 0px 12px; }#branch-banner .content .right button:hover { color: #6EBADF; background: white; }#branch-banner .content .right input:focus, button:focus { outline: none; }#branch-banner .content .right input.error { color: red; border-color: red; }#branch-banner .content .right span { display: inline-block; font-weight: 100; margin: 7px 9px; font-size: 12px; }", 
  g.innerHTML = '<div id="branch-sms-block"><input type="phone" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999"><button id="branch-sms-send">TXT Me The App!</button></div>', document.getElementById("branch-sms-send").onclick = h);
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
