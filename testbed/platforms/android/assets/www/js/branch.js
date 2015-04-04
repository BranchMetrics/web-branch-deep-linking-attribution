// This is a singleton.  Only one Branch object should exist.
// All the methods and members of Branch are defined in the setup function.
var Branch = (function () {
    var instance;
              
    function setup() {
        // Private methods and variables
        var baseUrl = "https://api.branch.io/";
        var initied = false;
        var session_id = null;
        var link = null;
              
        var initCallback = null;
              
        var createCallbackFn = function (callbackFn, scope) {
          if (typeof callbackFn != 'function')
            return;
              
          return function () {
            callbackFn.apply(scope || this, arguments);
          };
        };
        
        var completeInstall = function(response) {
          console.log("Install complete: " + JSON.stringify(response));
          localStorage.identity_id = response.identity_id;
          localStorage.device_fingerprint_id = response.device_fingerprint_id;
          this.session_id = response.session_id;
          if (response.link_click_id) {
            this.link = response.link_click_id;
          }
          if (response.data) {
            localStorage.first_params = JSON.stringify(response.data);
            localStorage.latest_params = JSON.stringify(response.data);
            if (this.initCallback) {
              this.initCallback(response.data);
            }
          } else {
            localStorage.removeItem("first_params");
            localStorage.removeItem("latest_params");
            if (this.initCallback) {
              this.initCallback({});
            }
          }
        };
              
        var completeOpen = function(response) {
          console.log("Open complete: " + JSON.stringify(response));
          localStorage.identity_id = response.identity_id;
          localStorage.device_fingerprint_id = response.device_fingerprint_id;
          this.session_id = response.session_id;
          if (response.link_click_id) {
            this.link = response.link_click_id;
          }
          if (response.data) {
            console.log("Data found: " + JSON.stringify(response.data));
            localStorage.latest_params = JSON.stringify(response.data);
            if (this.initCallback) {
              this.initCallback(response.data);
            } else {
              console.log("No callback...");
            }
          } else {
            console.log("No data found.");
              localStorage.removeItem("latest_params");
            if (this.initCallback) {
              this.initCallback({});
            } else {
              console.log("No callback...");
            }
          }
        };
              
        var installSession = function(data) {
          data.app_id = this.app_key;
          data.sdk = "cordova"+this.version;
          var xhr = new XMLHttpRequest();
          var url = baseUrl + "v1/install";
          console.log("Sending install: " + JSON.stringify(data) + " \nTo: " + url);
          xhr.open("POST", url, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          var fn = createCallbackFn(completeInstall, this);
          xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
              if (xhr.status == 200) {
                console.log("Install successful");
                fn(JSON.parse(xhr.responseText));
              } else {
                console.log("Install error: " + xhr.statusText);
                if (callback) {
                  var error;
                  error.error_code = xhr.status;
                  error.error_message = xhr.statusText;
                  callback(error);
                }
              }
            }
          };
          xhr.timeout = this.timeout * 1000;
          xhr.ontimeout = function () {
            console.log("Install timeout");
            var error;
            error.error_code = -1;
            error.error_message = "Operation timed out";
            if (callback) {
              callback(error);
            }
          }
          xhr.send(JSON.stringify(data));
        };
              
        var openSession = function(data) {
          data.app_id = this.app_key;
          data.sdk = "cordova"+this.version;
          if (localStorage.identity_id) {
            data.identity_id = localStorage.identity_id;
          }
          if (localStorage.device_fingerprint_id) {
            data.device_fingerprint_id = localStorage.device_fingerprint_id;
          }
          var xhr = new XMLHttpRequest();
          var url = baseUrl + "v1/open";
          console.log("Sending open: " + JSON.stringify(data) + " \nTo: " + url);
          xhr.open("POST", url, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          var fn = createCallbackFn(completeOpen, this);
          xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
              if (xhr.status == 200) {
                console.log("Open successful");
                fn(JSON.parse(xhr.responseText));
              } else {
                console.log("Open error: " + xhr.statusText);
                if (callback) {
                  var error;
                  error.error_code = xhr.status;
                  error.error_message = xhr.statusText;
                  callback(error);
                }
              }
            }
          };
          xhr.timeout = this.timeout * 1000;
          xhr.ontimeout = function () {
            console.log("Open timeout");
            var error;
            error.error_code = -1;
            error.error_message = "Operation timed out";
            if (callback) {
              callback(error);
            }
          }
          xhr.send(JSON.stringify(data));
        };
              
        // Public methods and variables
        return {
              version: "1.0.0",
              timeout: 5,
              debug: false,
              app_key: "",
              
              initSession: function(callback) {
                if (this.initied) {
                  // call callback with empty data
                  if (callback) {
                    callback({});
                  }
                } else {
                  this.inited = true;
                  if (callback) {
                    this.initCallback = callback;
                  } else {
                    this.initCallback = null;
                  }
              
                  if (localStorage.identity_id) {
                    cordova.plugins.branch_device.getOpenData(true, 3, localStorage.identity_id, localStorage.device_fingerprint_id, openSession, this, callback);
                  } else {
                    cordova.plugins.branch_device.getInstallData(true, 3, installSession, this, callback);
                  }
                }
              },
              
              close: function(callback) {
                this.inited = false;
                var data = {};
                data.app_id = this.app_key;
                data.sdk = "cordova"+this.version;
                data.identity_id = localStorage.identity_id;
                data.session_id = this.session_id;
                data.device_fingerprint_id = localStorage.device_fingerprint_id;
                if (this.link) {
                  data.link_click_id = this.link;
                }

                var xhr = new XMLHttpRequest();
                var url = baseUrl + "v1/close";
                console.log("Sending close: " + JSON.stringify(data) + " \nTo: " + url);
                xhr.open("POST", url, false);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onreadystatechange = function () {
                  if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                      console.log("Close successful");
                      if (callback) {
                        calback({});
                      }
                    } else {
                      console.log("Close error: " + xhr.statusText);
                      if (callback) {
                        var error;
                        error.error_code = xhr.status;
                        error.error_message = xhr.statusText;
                        callback(error);
                      }
                    }
                  }
                };
                xhr.send(JSON.stringify(data));
              },
              
              getFirstParams: function() {
                if (localStorage.first_params) {
                  return JSON.parse(localStorage.first_params);
                } else {
                  var ret = {};
                  return ret;
                }
              },
              
              getLatestParams: function() {
                if (localStorage.latest_params) {
                  return JSON.parse(localStorage.latest_params);
                } else {
                  var ret = {};
                  return ret;
                }
              },
              
              getShortUrl: function(callback, type, feature, alias, channel, stage, tags, params) {
              console.log("In getShortUrl");
                var data = {};
                data.app_id = this.app_key;
                data.sdk = "cordova"+this.version;
                data.identity_id = localStorage.identity_id;
                data.session_id = this.session_id;
                data.device_fingerprint_id = localStorage.device_fingerprint_id;
                if (alias) {
                  data.alias = alias;
                }
                if (channel) {
                  data.channel = channel;
                }
                if (stage) {
                  data.stage = stage;
                }
                if (tags && (tags instanceof Array)) {
                  data.tags = tags;
                }
                if (type) {
                  data.type = type;
                } else {
                  data.type = 0;
                }
                if (feature) {
                  if (feature === "none") {
                  } else {
                    data.feature = feature;
                  }
                }
                if (params && (params instanceof Object)) {
                  data.data = params;
                }
              
                var xhr = new XMLHttpRequest();
                var url = baseUrl + "v1/url";
                console.log("Sending get url: " + JSON.stringify(data) + " \nTo: " + url);
                xhr.open("POST", url, false);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                  console.log("Get URL done: " + xhr.responseText);
                  var resp = JSON.parse(xhr.responseText);
                  if (xhr.status == 200) {
                    console.log("Get url successful: " + xhr.responseText);
                    if (callback) {
                      callback(resp);
                    }
                  } else {
                    console.log("Get url error: " + xhr.statusText);
                    if (callback) {
                      if (resp.error) {
                        callback(resp);
                      } else {
                        var error = {};
                        error.error = {};
                        error.error.code = xhr.status;
                        error.error.message = xhr.statusText;
                        callback(error);
                      }
                    }
                  }
                }
              };
              xhr.send(JSON.stringify(data));
            }
        };
    };
              
    return {
        init: function (app_key) {
          if (!instance) {
            instance = setup();
            instance.app_key = app_key;
          }
        },
        getInstance: function () {
            return instance;
        }
    };
})();
