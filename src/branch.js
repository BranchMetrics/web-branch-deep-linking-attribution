var Branch = function Branch(app_id, debug, callback) {
  'use strict';
  this.initialized = false;
  this.api = {};
  this.utils = {};
  // Begin Utilities
  this.utils.console = function(stdout) {
    if (debug) console.error(stdout);
    return false;
  };
  this.utils.readSession = function() {
    return JSON.parse(sessionStorage.getItem('branch_session'));
  };
  this.utils.identity = function() {
    var identity_id = '';
    if (sessionStorage.getItem('branch_session')) {
      identity_id = this.readSession().identity_id;
    }
    return identity_id;
  };
  this.utils.session = function() {
    var session_id = '';
    if (sessionStorage.getItem('branch_session')) {
      session_id = this.readSession().session_id;
    }
    return session_id;
  };
  this.utils.mergeMeta = function(obj_1, obj_2) {
    var fin = {};
    for (var attr in obj_1) {
      fin[attr] = obj_1[attr];
    }
    for (attr in obj_2) {
      fin[attr] = obj_2[attr];
    }
    return fin;
  };
  this.utils.hashValue = function(key) {
    var v;
    try {
      v = location.hash.match(new RegExp(key + ':([^&]*)'))[1];
    } catch (e) {
      v = undefined;
    }
    return v;
  };
  this.utils.queue = function(){
    var self = this;
    self.free  = true;
    self.chain = [];
    self.next  = function(){
      if(self.chain.length > 0){
        self.free = true;
        self.chain[0].call();
        self.chain.shift();
      }else{
        self.free = true;
      }
    };
    self.route = function(pass, queue){
      if(self.free){
        pass();
        self.free = false;
      }
      else {
        queue();
      }
    };
  };
  // End Utilities
  // Begin API Routines
  this.api.validateRequest = function(resource, data) {
    for (var i in resource.params) {
      var v = resource.params[i];
      if (v.required === true) {
        // TODO: Expected values.
        if (typeof data[i] === 'undefined' || data[i] === '' || data[i] === null) {
          self.utils.console(config.debugMsgs['missingParam'] + i);
          return false;
        }
      }
      if (v.type == 'jsonObj') {
        if (v.required === true && typeof(data[i]) !== 'object') {
          self.utils.console(config.debugMsgs['invalidParam'] + i);
          return false;
        }
        if (v.params) {
          return (self.api.validateRequest(resource.params[v.ref], data[v.ref]));
        }
      } else if (v.type = 'jsonArray') {
        if (v.required === true && !data[i] instanceof Array) {
          self.utils.console(config.debugMsgs['invalidParam'] + i);
          return false;
        }
      } else {
        if (!config.formap[v.type].test(data[i])) {
          self.utils.console(config.debugMsgs['invalidParam'] + i);
          return false;
        }
      }
    };
    return true;
  };
  this.api.makeRequest = function(resource, data, callback, error) {
    if (self.api.validateRequest(resource, data)) {
      if (typeof(callback) !== 'function') {
        callback = function(data) {
          self.utils.console('Request complete', data);
        };
      }
      if (typeof(error) !== 'function') {
        error = function(xhr, status, error) {
          self.utils.console('Request failed', [xhr, status, error]);
        }
      }
      var r;
      if (window.XMLHttpRequest) {
        r = new XMLHttpRequest();
      } else {
        r = new ActiveXObject("Microsoft.XMLHTTP");
      };
      r.onreadystatechange = function() {
        if (r.readyState === 4 && r.status === 200) {
          callback(JSON.parse(r.responseText));
        } else if (r.readyState === 4 && r.status === 402) {
          callback({
            error: 'Not enough credits to redeem.'
          });
        }
      };
      var query = '';
      if (resource.rest) {
        for (var rp = 0; rp < resource.rest.length; rp++) {
          resource.endpoint = resource.endpoint.replace(':' + resource.rest[rp], data[resource.rest[rp]]);
          delete data[resource.rest[rp]];
        }
      }
      var connector_url = config.connector.url;
      if(resource.api !== undefined && resource.api === false){
        connector_url = '';
      }else{
        if (resource.method === 'GET') {
          query = '?';
          for (var key in data) {
            query += key + '=' + data[key] + '&';
          }
        }
      }
      r.open(resource.method, connector_url + resource.endpoint + query.substring(0, query.length - 1), true);
      r.setRequestHeader('Content-Type', 'application/json');
      r.setRequestHeader('Accept', 'application/json');
      r.setRequestHeader('Branch-Connector', config.connector.name + '/' + config.connector.version);
      if (resource.ref) {
        data = self.utils.mergeMeta(data, data[resource.ref]);
        delete data[resource.ref];
      }
      r.send(JSON.stringify(data));
    }
  };
  // End API Routines
  // Begin API Requests
  this.init = function(callback) {
    if (self.utils.readSession() === null || config.linkId !== undefined) {
      var request = function(cb){
        self.api.makeRequest(config.resources.session.sessionOpen, {
          app_id: config.appId,
          identity_id: self.utils.identity(),
          link_identifier: (config.linkId !== undefined ? config.linkId : ''),
          is_referrable: 1
        }, function(data) {
          sessionStorage.setItem('branch_session', JSON.stringify(data));
          self.initialized = true;
          if (typeof(cb) === 'function') cb(data);
        });
      };
      self.q.route(function(){
        request(function(data){
          self.q.next();
          if (typeof(callback) === 'function') callback(data);
        });
      },
      function(){
        self.q.chain.push(function(){
          self.initialized.apply(null, [callback]);
        });
      });

    } else {
      self.initialized = true;
      if (typeof(callback) === 'function') callback(self.utils.readSession());
    }
  };
  this.close = function(callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    var request = function(cb){
      self.api.makeRequest(config.resources.session.sessionClose, {
        app_id: config.appId,
        session_id: self.utils.session()
      }, function(data) {
        sessionStorage.clear();
        self.initialized = false;
        if (typeof(cb) === 'function') cb(data);
      });
    };
    self.q.route(function(){
      request(function(data){
        self.q.next();
        if (typeof(callback) === 'function') callback(data);
      });
    },
    function(){
      self.q.chain.push(function(){
        self.close.apply(null, [callback]);
      });
    });
  };
  this.logout = function(callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    var request = function(cb){
      self.api.makeRequest(config.resources.session.sessionLogout, {
        app_id: config.appId,
        session_id: self.utils.session()
      }, function(data) {
        var session = self.utils.readSession();
        session.session_id = data.session_id;
        session.identity_id = data.identity_id;
        session.link = data.link;
        sessionStorage.setItem('branch_session', JSON.stringify(session));
        if (typeof(cb) === 'function') cb(data);
      });
    };
    self.q.route(function(){
      request(function(data){
        self.q.next();
        if (typeof(callback) === 'function') callback(data);
      });
    },
    function(){
      self.q.chain.push(function(){
        self.logout.apply(null, [callback]);
      });
    });
  };
  this.track = function(event, metadata, callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    if (typeof(metadata) === 'function') {
      callback = metadata;
      metadata = {};
    }
    var meta_cap = {
      url: document.URL,
      user_agent: navigator.userAgent,
      language: navigator.language
    };
    if (metadata) {
      meta_cap = self.utils.mergeMeta(meta_cap, metadata);
    }
    var request = function(cb){
      self.api.makeRequest(config.resources.events.track, {
        app_id: config.appId,
        session_id: self.utils.session(),
        event: event,
        metadata: meta_cap
      }, function(data) {
        if (typeof(cb) === 'function') cb(data);
      });
    };
    self.q.route(function(){
      request(function(data){
        self.q.next();
        if(callback) callback(data);
      });
    },
    function(){
      self.q.chain.push(function(){
        self.track.apply(null, [event, metadata, callback]);
      });
    });
  };
  this.identify = function(obj, callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    var request = function(cb){
      self.api.makeRequest(config.resources.session.sessionProfile, {
        app_id: config.appId,
        identity_id: self.utils.identity(),
        obj: obj
      }, function(data) {
        var session = self.utils.readSession();
        session.identity_id = data.identity_id;
        session.link = data.link;
        session.referring_data = data.referring_data;
        session.referring_identity = data.referring_identity;
        sessionStorage.setItem('branch_session', JSON.stringify(session));
        if (typeof(cb) === 'function') cb(data);
      });
    };
    self.q.route(function(){
      request(function(data){
        self.q.next();
        if(callback) callback(data);
      });
    },
    function(){
      self.q.chain.push(function(){
        self.identify.apply(null, [obj, callback]);
      });
    });
  };
  this.createLink = function(obj, callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    obj.source = 'web-sdk';
    self.api.makeRequest(config.resources.links.createLink, {
      app_id: config.appId,
      identity: self.utils.identity(),
      obj: obj
    }, function(data) {
      if (typeof(callback) === 'function') callback(data.url);
    });
  };
  this.createLinkClick = function(url, callback){
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    self.api.makeRequest(config.resources.links.createLinkClick, {
      url: url
    }, function(data) {
      if (typeof(callback) === 'function') callback(data.click_id);
    });
  };
  this.SMSLink = function(obj, callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    var phone = obj.phone;
    obj.channel = 'sms';
    if(config.linkId === undefined){
      this.createLink(obj, function(url){
        self.api.makeRequest(config.resources.links.createLinkClick, {
          link_url: url + '?click'
        }, function(data) {
          self.sendSMSLink(phone, config.linkUrl + '/c/' + data.click_id, function(){
            if (typeof(callback) === 'function') callback();
          });
        });
      });
    }else{
      self.sendSMSLink(phone, config.linkUrl + '/c/' + config.linkId, function(){
        if (typeof(callback) === 'function') callback();
      });
    }
  };
  this.sendSMSLink = function(phone, url, callback){
    self.api.makeRequest(config.resources.links.sendSMSLink, {
      link_url: url,
      phone: phone
    }, function(data) {
      if (typeof(callback) === 'function') callback(data);
    });
  };
  this.showReferrals = function(callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    self.api.makeRequest(config.resources.referrals.showReferrals, {
      app_id: config.appId,
      identity_id: self.utils.identity()
    }, function(data) {
      if (typeof(callback) === 'function') callback(data);
    });
  };
  this.showCredits = function(callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    self.api.makeRequest(config.resources.referrals.showCredits, {
      app_id: config.appId,
      identity_id: self.utils.identity()
    }, function(data) {
      if (typeof(callback) === 'function') callback(data);
    });
  };
  this.redeemCredits = function(obj, callback) {
    if (!self.initialized) return self.utils.console(config.debugMsgs['nonInit']);
    self.api.makeRequest(config.resources.referrals.redeemCredits, {
      app_id: config.appId,
      identity_id: self.utils.identity(),
      obj: obj
    }, function(data) {
      if (typeof(callback) === 'function') callback(data);
    });
  };
  // End API Requests
  // Begin SDK Init
  debug = typeof debug !== 'undefined' ? debug : false;
  var self = this;
  var config = {
    appId: app_id,
    connector: {
      url: 'https://api.branch.io',
      name: 'web-sdk',
      version: '0.1'
    },
    linkUrl: 'http://bnc.lt',
    linkId: self.utils.hashValue('r'),
    formap: branch_map.formap,
    resources: branch_map.resources,
    debugMsgs: branch_map.debugMessages
  };
  if (app_id === undefined) {
    self.utils.console(config.debugMsgs['missingAppId']);
    return false;
  }
  self.q = new self.utils.queue();
};
var q = window.branch.queued;
window.branch = new Branch(window.branch.app_id, window.branch.debug, window.branch.callback);
branch.init(function(){
  if(q.length){
    for(i = 0; i < q.length; i++){
      window.branch[q[i].shift()].apply(window.branch, q[i]);
    }
  }
  if(typeof self.init_callback === 'function'){
    self.init_callback()
  }
});
