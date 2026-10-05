/**
 * This provides the principal function to make a call to the API. Basically
 * a fancy wrapper around XHR/JSONP/etc.
 */

import { safejson } from '../core/safejson.js';
import { utils } from '../core/utils.js';
import { applyNonce, log } from '../core/context.js';
import { formatMessage } from '../lib/messages.js';

/**
 * @param {import('../core/context.js').Context} ctx
 */
export const Server = function (ctx) {
  this._ctx = ctx;
};

Server.prototype._jsonp_callback_index = 0;

/**
 * @param {Object} obj
 * @param {string} prefix
 */
Server.prototype.serializeObject = function (obj, prefix) {
  if (typeof obj === 'undefined') {
    return '';
  }

  const pairs = [];
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      pairs.push(encodeURIComponent(prefix) + '=' + encodeURIComponent(obj[i]));
    }
    return pairs.join('&');
  }

  for (const prop in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
      continue;
    }
    if (Array.isArray(obj[prop]) || typeof obj[prop] === 'object') {
      pairs.push(
        this.serializeObject(obj[prop], prefix ? prefix + '.' + prop : prop),
      );
    } else {
      pairs.push(
        encodeURIComponent(prefix ? prefix + '.' + prop : prop) +
          '=' +
          encodeURIComponent(obj[prop]),
      );
    }
  }
  return pairs.join('&');
};

/**
 * @param {Object} resource
 * @param {Object.<string, *>} data
 */
Server.prototype.getUrl = function (resource, data) {
  let k;
  let v;
  let err;
  const ctx = this._ctx;
  let url = resource.destination + resource.endpoint;
  const branch_id = /^[0-9]{15,20}$/;
  const branch_key = /key_(live|test)_[A-Za-z0-9]{32}/;

  const appendKeyOrId = function (data, destinationObject) {
    if (typeof destinationObject === 'undefined') {
      destinationObject = {};
    }
    if (data.branch_key && branch_key.test(data.branch_key)) {
      destinationObject.branch_key = data.branch_key;
      return destinationObject;
    } else if (data.app_id && branch_id.test(data.app_id)) {
      destinationObject.app_id = data.app_id;
      return destinationObject;
    } else if (data.instrumentation) {
      destinationObject.instrumentation = data.instrumentation;
    } else {
      const msg = formatMessage(utils.messages.missingParam, [
        resource.endpoint,
        'branch_key or app_id',
      ]);
      log(ctx, msg);
      throw Error(msg);
    }
  };

  if (typeof resource.queryPart !== 'undefined') {
    for (k in resource.queryPart) {
      if (!Object.prototype.hasOwnProperty.call(resource.queryPart, k)) {
        continue;
      }
      err =
        typeof resource.queryPart[k] === 'function'
          ? resource.queryPart[k](resource.endpoint, k, data[k], ctx)
          : err;
      if (err) {
        log(ctx, err);
        return { error: err };
      }
      url += '/' + data[k];
    }
  }

  const d = {};
  // TODO: Add validation for v1/pageview and v1/dismiss, move setBranchViewData into a separate location so that it is isolated
  if (
    typeof resource.params !== 'undefined' &&
    resource.endpoint !== '/v1/pageview' &&
    resource.endpoint !== '/v1/dismiss'
  ) {
    for (k in resource.params) {
      if (Object.prototype.hasOwnProperty.call(resource.params, k)) {
        err = resource.params[k](resource.endpoint, k, data[k], ctx);
        if (err) {
          log(ctx, err);
          return {
            error: err,
          };
        }

        v = data[k];
        if (!(typeof v === 'undefined' || v === '' || v === null)) {
          d[k] = v;
        }
      }
    }
  } else if (
    resource.endpoint === '/v1/pageview' ||
    resource.endpoint === '/v1/dismiss'
  ) {
    utils.merge(d, data);
    if (d.branch_requestMetadata) {
      d.metadata = utils.merge(d.metadata || {}, d.branch_requestMetadata);
      delete d.branch_requestMetadata;
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(data, 'branch_requestMetadata') &&
    data.branch_requestMetadata &&
    !(
      resource.endpoint === '/v1/pageview' ||
      resource.endpoint === '/v1/dismiss'
    )
  ) {
    d.metadata = safejson.stringify(data.branch_requestMetadata);
  }
  if (data.branch_dma_data) {
    utils.setDMAParams(d, data.branch_dma_data, resource.endpoint);
    if (d.branch_dma_data) {
      delete d.branch_dma_data;
    }
  }

  if (resource.method === 'POST') {
    try {
      data = appendKeyOrId(data, d);
    } catch (e) {
      return {
        error: e.message,
      };
    }
  }

  if (
    resource.endpoint === '/v1/pageview' ||
    resource.endpoint === '/v1/dismiss'
  ) {
    if (d.metadata) {
      d.metadata = safejson.stringify(d.metadata || {});
    }
  }

  if (resource.endpoint === '/v1/open') {
    d.options = safejson.stringify(d.options || {});
  }

  return {
    data: this.serializeObject(d, ''),
    url: url.replace(/^\//, ''),
  };
};

/**
 * This function is standalone for easy mocking.
 * @param {string} src
 */
Server.prototype.createScript = function (src, onError, onLoad) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = src;

  applyNonce(this._ctx, script);

  const heads = document.getElementsByTagName('head');
  if (!heads || heads.length < 1) {
    if (typeof onError === 'function') {
      onError();
    }
    return;
  }
  heads[0].appendChild(script);

  if (typeof onError === 'function') {
    utils.addEvent(script, 'error', onError);
  }
  if (typeof onLoad === 'function') {
    utils.addEvent(script, 'load', onLoad);
  }
};

/**
 * @param {string} requestURL
 * @param {Object} requestData
 * @param {string} requestMethod
 * @param {((err: Error | string | null, data?: any, status?: any) => void)=} callback
 */
Server.prototype.jsonpRequest = function (
  requestURL,
  requestData,
  requestMethod,
  callback,
) {
  const ctx = this._ctx;
  const brtt = Date.now();
  const brttTag = ctx.currentRequestBrttTag;
  /* On iOS 11-Safari when a partner calls .deepview() and uses $uri_redirect_mode: 2,
		they will not get transported into the app (if installed) on pageload because
		callbackString will evaluate to branch_callback_0. The backend expects branch_callback_1
		for auto-open to work. This is why we have the fix below.
	*/
  if (this._jsonp_callback_index === 0 && utils.isSafari11OrGreater()) {
    this._jsonp_callback_index++;
  }
  const callbackString = 'branch_callback__' + this._jsonp_callback_index++;

  const postPrefix =
    requestURL.indexOf('branch.io') >= 0 ? '&data=' : '&post_data=';
  const postData =
    requestMethod === 'POST'
      ? encodeURIComponent(utils.base64encode(safejson.serialize(requestData)))
      : '';

  const timeoutTrigger = window.setTimeout(function () {
    window[callbackString] = function () {};
    utils.addPropertyIfNotNull(
      ctx.instrumentation,
      brttTag,
      utils.calculateBrtt(brtt),
    );
    callback(new Error(utils.messages.timeout), null, 504);
  }, ctx.timeout);

  window[callbackString] = function (data) {
    window.clearTimeout(timeoutTrigger);
    callback(null, data);
  };

  this.createScript(
    requestURL +
      (requestURL.indexOf('?') < 0 ? '?' : '') +
      (postData ? postPrefix + postData : '') +
      (requestURL.indexOf('/c/') >= 0 ? '&click=1' : '') +
      '&callback=' +
      callbackString,
    function onError() {
      // This occurs for all errors from these endpoints (/_r and /v1/deepview),
      // including 5xx and no connectivity.
      callback(new Error(utils.messages.blockedByClient), null);
    },
    function onLoad() {
      utils.addPropertyIfNotNull(
        ctx.instrumentation,
        brttTag,
        utils.calculateBrtt(brtt),
      );
      try {
        if (typeof this.remove === 'function') {
          this.remove();
        } else {
          // some browsers do not have a 'remove' method
          // for Element, so fall back
          this.parentNode.removeChild(this);
        }
      } catch (_e) {
        // we're trying to remove the script tag during a
        // jsonp request, but if that fails, we shouldn't
        // break anything else...just continue
      }
      delete window[callbackString];
    },
  );
};

/**
 * @param {string} url
 * @param {Object} data
 * @param {string} method
 * @param {Object} storage
 * @param {((err: Error | string | null, data?: any, status?: any) => void)=} callback
 * @param {?boolean=} noParse - _optional_ -
 * @param {?XMLHttpRequestResponseType=} responseType - _optional_ -
 */
Server.prototype.XHRRequest = function (
  url,
  data,
  method,
  storage,
  callback,
  noParse,
  responseType,
) {
  const ctx = this._ctx;
  const brtt = Date.now();
  const brttTag = ctx.currentRequestBrttTag;
  const req = window.XMLHttpRequest
    ? new XMLHttpRequest()
    : new ActiveXObject('Microsoft.XMLHTTP');

  if (responseType) {
    req.responseType = responseType;
  }

  const errorResponseText = function () {
    return (
      (req.responseType === 'arraybuffer' ? '' : req.responseText) ||
      'No response text available'
    );
  };

  req.ontimeout = function () {
    utils.addPropertyIfNotNull(
      ctx.instrumentation,
      brttTag,
      utils.calculateBrtt(brtt),
    );
    callback(new Error(utils.messages.timeout), null, 504);
  };
  req.onerror = function (e) {
    const url = req.responseURL || 'Unknown';
    const status = req.status || 'No status available';
    const responseText = errorResponseText();
    const errorMessage =
      'Error in API: URL - ' +
      url +
      ', Status - ' +
      status +
      ', Response - ' +
      responseText;
    console.log(errorMessage);
    // @ts-expect-error -- some old browsers put an `error` on the XHR error event
    callback(new Error(e.error || errorMessage), null, req.status);
  };
  req.onreadystatechange = function () {
    let data;
    if (req.readyState === 4) {
      utils.addPropertyIfNotNull(
        ctx.instrumentation,
        brttTag,
        utils.calculateBrtt(brtt),
      );
      if (req.status === 200) {
        // Response value will be in "req.responseText" by default, unless
        // the "req.responseType" is "text" or null.
        // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
        if (req.responseType === 'arraybuffer') {
          data = req.response;
        } else if (noParse) {
          data = req.responseText;
        } else {
          try {
            data = safejson.parse(req.responseText);
          } catch (_e) {
            data = {};
          }
        }
        callback(null, data, req.status);
      } else if (
        req.status.toString().substring(0, 1) === '4' ||
        req.status.toString().substring(0, 1) === '5'
      ) {
        // Server returns helpful information when a partner sends up incorrect fields in logEvent().
        // This information appears in req.responseText.
        if (req.responseURL?.includes('v2/event')) {
          callback(req.responseText, null, req.status);
        } else {
          const url = req.responseURL || 'Unknown';
          const status = req.status || 'No status available';
          const responseText = errorResponseText();
          const errorMessage =
            'Error in API: URL - ' +
            url +
            ', Status - ' +
            status +
            ', Response - ' +
            responseText;
          console.log(errorMessage);
          callback(new Error(errorMessage), null, req.status);
        }
      }
    }
  };

  try {
    req.open(method, url, true);
    req.timeout = ctx.timeout;
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.send(data);
  } catch (_e) {
    storage.set('use_jsonp', true);
    this.jsonpRequest(url, data, method, callback);
  }
};

/**
 * @param {Object} resource
 * @param {Object.<string, *>} data
 * @param {Object} storage
 * @param {((err: Error | null, data?: any) => void)=} callback
 */
Server.prototype.request = function (resource, data, storage, callback) {
  const self = this;
  const ctx = self._ctx;

  ctx.currentRequestBrttTag = resource.endpoint + '-brtt';

  if (
    resource.endpoint === '/v1/url' &&
    Object.keys(ctx.instrumentation).length > 1
  ) {
    delete ctx.instrumentation['-brtt'];
    data.instrumentation = safejson.stringify(
      utils.merge({}, ctx.instrumentation),
    );
    ctx.instrumentation = {};
  }

  // Removes PII from request data in case fields flow in from cascading requests
  if (ctx.userPreferences.trackingDisabled) {
    const PII = [
      'browser_fingerprint_id',
      'alternative_browser_fingerprint_id',
      'identity_id',
      'session_id',
      'identity',
    ];
    for (let index = 0; index < PII.length; index++) {
      if (Object.prototype.hasOwnProperty.call(data, PII[index])) {
        delete data[PII[index]];
      }
    }
  }

  const u = this.getUrl(resource, data);
  if (u.error) {
    const errorObj = {
      message: u.error,
      endpoint: resource.endpoint,
      data: data,
    };
    return callback(new Error(safejson.stringify(errorObj)));
  }

  let url;
  let postData = '';
  if (resource.method === 'GET') {
    url = u.url + '?' + u.data;
  } else {
    url = u.url;
    postData = u.data;
  }

  let requestBody;
  if (storage.get('use_jsonp') || resource.jsonp) {
    requestBody = data;
  } else {
    requestBody = postData;
  }

  // How many times to retry the request if the initial attempt fails
  let retries = ctx.retries;
  // If request fails, retry after X miliseconds
  const done = function (err, data, status) {
    if (typeof self.onAPIResponse === 'function') {
      // Record every request and response, including retries
      // Note status is always undefined for jsonp requests (/_r and
      // /v1/deepview). These are loaded in async script tags.
      self.onAPIResponse(url, resource.method, requestBody, err, status, data);
    }

    if (
      err &&
      retries > 0 &&
      (status || '').toString().substring(0, 1) === '5'
    ) {
      retries--;
      window.setTimeout(function () {
        makeRequest();
      }, ctx.retry_delay);
    } else {
      callback(err, data);
    }
  };

  if (
    ctx.userPreferences.trackingDisabled &&
    ctx.userPreferences.shouldBlockRequest(url, data)
  ) {
    // If partners call functions that reach-out to blocked endpoints after init() finishes, then we should return an error with a message
    return ctx.userPreferences.allowErrorsInCallback
      ? done(new Error(utils.messages.trackingDisabled), null, 300)
      : done(null, {}, 200);
  }

  let noParseJsonResp = false;
  let responseType;
  if (resource.endpoint === '/v1/qr-code') {
    noParseJsonResp = true;
    responseType = 'arraybuffer';
  }

  const makeRequest = function () {
    if (storage.get('use_jsonp') || resource.jsonp) {
      self.jsonpRequest(url, data, resource.method, done);
    } else {
      self.XHRRequest(
        url,
        postData,
        resource.method,
        storage,
        done,
        noParseJsonResp,
        responseType,
      );
    }
  };

  makeRequest();
};
