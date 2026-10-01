/**
 * Minimal fake XMLHttpRequest covering what Server.prototype.XHRRequest
 * (src/3_api.js) uses.
 *
 * var fake = installFakeXHR(function (req) { requests.push(req); });
 * // ...code under test calls new XMLHttpRequest()...
 * requests[0].url / .method / .requestBody / .requestHeaders
 * requests[0].respond(200, {}, '{}');
 * fake.restore();
 */

var FakeXMLHttpRequest = function () {
  this.readyState = 0;
  this.status = 0;
  this.responseText = '';
  this.response = '';
  this.responseURL = '';
  this.requestHeaders = {};
  this.requestBody = null;
  if (FakeXMLHttpRequest.onCreate) {
    FakeXMLHttpRequest.onCreate(this);
  }
};

FakeXMLHttpRequest.prototype.open = function (method, url) {
  this.method = method;
  this.url = url;
};

FakeXMLHttpRequest.prototype.setRequestHeader = function (name, value) {
  this.requestHeaders[name] = value;
};

FakeXMLHttpRequest.prototype.send = function (body) {
  this.requestBody = typeof body === 'undefined' ? null : body;
};

// `headers` is accepted for call-site compatibility; the SDK never reads them.
FakeXMLHttpRequest.prototype.respond = function (status, headers, body) {
  this.status = status;
  this.responseText = body || '';
  this.response = this.responseText;
  this.responseURL = this.url;
  this.readyState = 4;
  if (typeof this.onreadystatechange === 'function') {
    this.onreadystatechange();
  }
};

/**
 * Installs FakeXMLHttpRequest as the global XMLHttpRequest.
 * @param {function(FakeXMLHttpRequest)=} onCreate - called with every new request
 * @return {{restore: function()}}
 */
export function installFakeXHR(onCreate) {
  FakeXMLHttpRequest.onCreate = onCreate;
  vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
  return {
    restore: function () {
      FakeXMLHttpRequest.onCreate = null;
      vi.unstubAllGlobals();
    },
  };
}
