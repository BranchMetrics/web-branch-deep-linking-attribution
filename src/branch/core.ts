import { config } from '../core/config.js';
import { safejson } from '../core/safejson.js';
import { task_queue } from '../core/queue.js';
import { utils } from '../core/utils.js';
import { session } from '../core/session.js';
import { storage } from '../core/storage.js';
import { Server } from '../network/api.js';
import { createContext, log } from '../core/context.js';
import { formatMessage } from '../lib/messages.js';

/*globals Ti, BranchStorage, require */

let default_branch: any;

/**
 * Enum for what parameters are in a wrapped Branch method
 */
export const callback_params = {
  NO_CALLBACK: 0,
  CALLBACK_ERR: 1,
  CALLBACK_ERR_DATA: 2,
};

/**
 * Enum for the initialization state of the Branch Object
 */
export const init_states = {
  NO_INIT: 0,
  INIT_PENDING: 1,
  INIT_FAILED: 2,
  INIT_SUCCEEDED: 3,
};

/**
 * Failure codes for Branch initialization
 */
export const init_state_fail_codes = {
  NO_FAILURE: 0,
  UNKNOWN_CAUSE: 1,
  OPEN_FAILED: 2,
  BFP_NOT_FOUND: 3,
  HAS_APP_FAILED: 4,
};

/***
 * @param parameters
 * @param func
 * @param init
 */
export const wrap = function (
  parameters: number,
  func: (...args: any[]) => void,
  init?: boolean,
) {
  const r = function (...callArgs) {
    const self = this;
    let args: any[];
    let callback: Function | undefined;
    const lastArg = callArgs[callArgs.length - 1];
    if (
      parameters === callback_params.NO_CALLBACK ||
      typeof lastArg !== 'function'
    ) {
      callback = function (_err) {
        return;
      };
      args = callArgs.slice();
    } else {
      args = callArgs.slice(0, callArgs.length - 1) || [];
      callback = lastArg;
    }
    self._queue(function (next) {
      const done = function (err, data) {
        try {
          if (err && parameters === callback_params.NO_CALLBACK) {
            throw err;
          } else if (parameters === callback_params.CALLBACK_ERR) {
            callback(err);
          } else if (parameters === callback_params.CALLBACK_ERR_DATA) {
            callback(err, data);
          }
        } finally {
          // ...but we always want to call next
          next();
        }
      };
      if (!init) {
        let msg: string | undefined;
        if (self.init_state === init_states.INIT_PENDING) {
          msg = formatMessage(utils.messages.initPending);
        } else if (self.init_state === init_states.INIT_FAILED) {
          msg = formatMessage(
            utils.messages.initFailed,
            self.init_state_fail_code,
            self.init_state_fail_details,
          );
        } else if (
          self.init_state === init_states.NO_INIT ||
          !self.init_state
        ) {
          msg = formatMessage(utils.messages.nonInit);
        }
        if (msg) {
          log(self._ctx, msg);
          return done(new Error(msg), null);
        }
      }
      args.unshift(done);
      func.apply(self, args);
    });
  };
  return r;
};

export const Branch = function () {
  if (!(this instanceof Branch)) {
    if (!default_branch) {
      // @ts-expect-error -- TS 7 doesn't treat JS constructor functions as classes
      default_branch = new Branch();
    }
    return default_branch;
  }
  this._queue = task_queue();

  const storageMethods = ['session', 'cookie', 'pojo'];

  this._ctx = createContext();

  // @ts-expect-error -- TS 7 doesn't treat JS constructor functions as classes
  this._storage = new storage.BranchStorage(storageMethods);
  this._storage.ctx = this._ctx;

  this._server = new Server(this._ctx);

  const sdk = 'web';

  this._listeners = [];

  this.sdk = sdk + config.version;
  this.requestMetadata = {};

  this.init_state = init_states.NO_INIT;
  this.init_state_fail_code = init_state_fail_codes.NO_FAILURE;
  this.init_state_fail_details = null;
};

/***
 * @param resource
 * @param obj
 * @param callback
 */
Branch.prototype._api = function (
  resource: Record<string, any>,
  obj: Record<string, any>,
  callback?: (err: Error | null, data?: any) => void,
) {
  if (this.app_id) {
    obj.app_id = this.app_id;
  }
  if (this.branch_key) {
    obj.branch_key = this.branch_key;
  }
  if (
    (resource.params?.session_id || resource.queryPart?.session_id) &&
    this.session_id
  ) {
    obj.session_id = this.session_id;
  }
  if (
    (resource.params?.identity_id || resource.queryPart?.identity_id) &&
    this.identity_id
  ) {
    obj.identity_id = this.identity_id;
  }

  if (resource.endpoint.indexOf('/v1/') < 0) {
    if (
      (resource.params?.developer_identity ||
        resource.queryPart?.developer_identity) &&
      this.identity
    ) {
      obj.developer_identity = this.identity;
    }
  } else {
    if (
      (resource.params?.identity || resource.queryPart?.identity) &&
      this.identity
    ) {
      obj.identity = this.identity;
    }
  }

  if (
    (resource.params?.link_click_id || resource.queryPart?.link_click_id) &&
    this.link_click_id
  ) {
    obj.link_click_id = this.link_click_id;
  }
  if ((resource.params?.sdk || resource.queryPart?.sdk) && this.sdk) {
    obj.sdk = this.sdk;
  }

  if (
    (resource.params?.browser_fingerprint_id ||
      resource.queryPart?.browser_fingerprint_id) &&
    this.browser_fingerprint_id
  ) {
    obj.browser_fingerprint_id = this.browser_fingerprint_id;
  }
  // Adds tracking_disabled to every post request when enabled
  if (this._ctx.userPreferences.trackingDisabled) {
    obj.tracking_disabled = this._ctx.userPreferences.trackingDisabled;
  }
  if (this.requestMetadata) {
    for (const metadata_key in this.requestMetadata) {
      if (
        Object.prototype.hasOwnProperty.call(this.requestMetadata, metadata_key)
      ) {
        if (!obj.branch_requestMetadata) {
          obj.branch_requestMetadata = {};
        }
        obj.branch_requestMetadata[metadata_key] =
          this.requestMetadata[metadata_key];
      }
    }
  }
  if (utils.shouldAddDMAParams(resource.endpoint)) {
    const dmaData = this._storage.get('branch_dma_data', true);
    obj.branch_dma_data = dmaData ? safejson.parse(dmaData) : null;
  }
  if (resource.endpoint !== '/_r') {
    resource.destination = config.api_endpoint;
  }
  return this._server.request(
    resource,
    obj,
    this._storage,
    function (err, data) {
      callback(err, data);
    },
  );
};

/***
 * @function Branch._referringLink
 */
Branch.prototype._referringLink = function (forJourneys) {
  const sessionData = session.get(this._storage);
  const referringLink = sessionData?.referring_link;
  if (referringLink) {
    return referringLink;
  } else {
    if (this._ctx.userPreferences.enableExtendedJourneysAssist && forJourneys) {
      const localStorageData = session.get(this._storage, true);
      const referring_Link = localStorageData?.referring_link;
      const referringLinkExpiry = localStorageData?.referringLinkExpiry;
      if (referring_Link && referringLinkExpiry) {
        const now = new Date();
        // compare the expiry time of the item with the current time
        if (now.getTime() > referringLinkExpiry) {
          session.patch(
            this._storage,
            { 'referringLinkExpiry': null },
            true,
            true,
          );
        } else {
          return referring_Link;
        }
      }
    }
  }

  const clickId = this._storage.get('click_id');
  if (clickId) {
    return config.link_service_endpoint + '/c/' + clickId;
  }

  return null;
};

/***
 * @function Branch._publishEvent
 * @param event
 * @param data - _optional_ - data to pass into listener callback.
 */
Branch.prototype._publishEvent = function (
  event: string,
  data?: Record<string, any>,
) {
  for (let i = 0; i < this._listeners.length; i++) {
    if (!this._listeners[i].event || this._listeners[i].event === event) {
      this._listeners[i].listener(event, data);
    }
  }
};
