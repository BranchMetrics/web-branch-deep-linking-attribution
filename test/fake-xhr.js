/**
 * Minimal fake XMLHttpRequest covering what Server.prototype.XHRRequest
 * (src/3_api.js) uses.
 *
 * var fake = installFakeXHR(function (req) { requests.push(req); });
 * // ...code under test calls new XMLHttpRequest()...
 * requests[0].url / .method / .requestBody / .requestHeaders
 * requests[0].respond(200, {}, '{}');   // or .error() / .triggerTimeout()
 * fake.restore();
 */

const FakeXMLHttpRequest = function () {
  this.readyState = 0;
  this.status = 0;
  this.response = '';
  this.responseURL = '';
  this.requestHeaders = {};
  this.requestBody = null;
  this._responseText = '';
  if (FakeXMLHttpRequest.onCreate) {
    FakeXMLHttpRequest.onCreate(this);
  }
};

// Like browsers, reading responseText on a non-text response throws.
Object.defineProperty(FakeXMLHttpRequest.prototype, 'responseText', {
  get: function () {
    if (this.responseType && this.responseType !== 'text') {
      throw new DOMException(
        "responseText is only available if responseType is '' or 'text'.",
        'InvalidStateError',
      );
    }
    return this._responseText;
  },
});

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

FakeXMLHttpRequest.prototype._done = function (status) {
  this.status = status;
  this.readyState = 4;
  if (typeof this.onreadystatechange === 'function') {
    this.onreadystatechange();
  }
};

// `headers` is accepted for call-site compatibility; the SDK never reads them.
// `body` is a string, or an ArrayBuffer when responseType is 'arraybuffer'.
FakeXMLHttpRequest.prototype.respond = function (status, _headers, body) {
  if (this.responseType === 'arraybuffer') {
    this.response = body || new ArrayBuffer(0);
  } else {
    this._responseText = body || '';
    this.response = this._responseText;
  }
  this.responseURL = this.url;
  this._done(status);
};

// Network failure: browsers finish with status 0, then fire `error`.
FakeXMLHttpRequest.prototype.error = function () {
  this._done(0);
  if (typeof this.onerror === 'function') {
    this.onerror({ type: 'error' });
  }
};

// Timeout: browsers finish with status 0, then fire `timeout`.
FakeXMLHttpRequest.prototype.triggerTimeout = function () {
  this._done(0);
  if (typeof this.ontimeout === 'function') {
    this.ontimeout({ type: 'timeout' });
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
