import { config } from '../core/config.js';
import { safejson } from '../core/safejson.js';
import { task_queue } from '../core/queue.js';
import { shouldAddDMAParams } from '../lib/dma.js';
import { session } from '../core/session.js';
import { storage } from '../core/storage.js';
import { Server } from '../network/api.js';
import { type Context, createContext } from '../core/context.js';
import * as init from './init.js';
import * as identity from './identity.js';
import * as events from './events.js';
import * as links from './links.js';
import * as listeners from './listeners.js';
import * as journeys from './journeys.js';
import * as settings from './settings.js';
import {
  callback_params,
  init_state_fail_codes,
  init_states,
  wrap,
} from './wrap.js';

/**
 * The SDK instance behind window.branch. Instance state is assigned in the
 * constructor; every method lives on the prototype and is registered in the
 * API table at the bottom of this file.
 *
 * All fields are `declare`d (type-only) so the class adds no own properties
 * beyond what the constructor assigns, in the same order as before.
 */
// biome-ignore lint/suspicious/noUnsafeDeclarationMerging: the merged interface types the methods the API table assigns to Branch.prototype
export class Branch {
  declare _queue: any;
  declare _ctx: Context;
  declare _storage: any;
  declare _server: any;
  declare _listeners: Array<{ listener: Function; event: string | null }>;
  declare sdk: string;
  declare requestMetadata: Record<string, any>;
  declare init_state: number;
  declare init_state_fail_code: number;
  declare init_state_fail_details: string | null;

  // Assigned later by init(), setIdentity(), journeys and deepview.
  declare branch_key?: string;
  declare app_id?: string;
  declare identity_id?: string;
  declare session_id?: string;
  declare browser_fingerprint_id?: string;
  declare identity?: string | null;
  declare link_click_id?: string;
  declare session_link_click_id?: string;
  declare sessionLink?: string;
  declare init_options?: Record<string, any>;
  declare changeEventListenerAdded?: boolean;
  declare closeBannerPointer?: any;
  declare _branchViewEnabled?: boolean;
  declare _branchViewData?: Record<string, any>;
  declare _deepviewCta?: () => void;
  declare _deepviewRequestForReplay?: () => void;
  declare _renderQueue?: Array<() => void>;
  declare _renderFinalized?: boolean;

  constructor() {
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
  }
}

/***
 * @param resource
 * @param obj
 * @param callback
 */
function _api(
  this: Branch,
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
  if (shouldAddDMAParams(resource.endpoint)) {
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
}

/***
 * @function Branch._referringLink
 */
function _referringLink(this: Branch, forJourneys) {
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
}

/***
 * @function Branch._publishEvent
 * @param event
 * @param data - _optional_ - data to pass into listener callback.
 */
function _publishEvent(this: Branch, event: string, data: Record<string, any>) {
  for (let i = 0; i < this._listeners.length; i++) {
    if (!this._listeners[i].event || this._listeners[i].event === event) {
      this._listeners[i].listener(event, data);
    }
  }
}

/**
 * The public (and internal) API of window.branch, registered in one place.
 * Each entry is a feature function from src/branch/*.ts; `wrap` queues the
 * call, gates it on init state and adapts the trailing callback.
 */
const api = {
  _api: _api,
  _referringLink: _referringLink,
  _publishEvent: _publishEvent,
  init: wrap(callback_params.CALLBACK_ERR_DATA, init.init, true),
  renderQueue: wrap(callback_params.NO_CALLBACK, init.renderQueue),
  renderFinalize: wrap(callback_params.CALLBACK_ERR_DATA, init.renderFinalize),
  data: wrap(callback_params.CALLBACK_ERR_DATA, identity.data),
  first: wrap(callback_params.CALLBACK_ERR_DATA, identity.first),
  setIdentity: wrap(callback_params.CALLBACK_ERR_DATA, identity.setIdentity),
  logout: wrap(callback_params.CALLBACK_ERR, identity.logout),
  getBrowserFingerprintId: wrap(
    callback_params.CALLBACK_ERR_DATA,
    identity.getBrowserFingerprintId,
  ),
  crossPlatformIds: wrap(
    callback_params.CALLBACK_ERR_DATA,
    identity.crossPlatformIds,
  ),
  lastAttributedTouchData: wrap(
    callback_params.CALLBACK_ERR_DATA,
    identity.lastAttributedTouchData,
  ),
  referringLink: identity.referringLink,
  track: wrap(callback_params.CALLBACK_ERR, events.track),
  logEvent: wrap(callback_params.CALLBACK_ERR, events.logEvent),
  trackCommerceEvent: wrap(
    callback_params.CALLBACK_ERR,
    events.trackCommerceEvent,
  ),
  link: wrap(callback_params.CALLBACK_ERR_DATA, links.link),
  qrCode: wrap(callback_params.CALLBACK_ERR_DATA, links.qrCode),
  deepview: wrap(callback_params.CALLBACK_ERR, links.deepview),
  _windowRedirect: links._windowRedirect,
  deepviewCta: wrap(callback_params.CALLBACK_ERR, links.deepviewCta),
  addListener: listeners.addListener,
  removeListener: listeners.removeListener,
  setBranchViewData: wrap(
    callback_params.CALLBACK_ERR,
    journeys.setBranchViewData,
    /* allowed before init */ true,
  ),
  closeJourney: wrap(callback_params.CALLBACK_ERR, journeys.closeJourney),
  banner: wrap(callback_params.CALLBACK_ERR, journeys.showBanner),
  closeBanner: wrap(0, journeys.closeBanner),
  disableTracking: wrap(
    callback_params.CALLBACK_ERR,
    settings.disableTracking,
    /* allowed before init */ true,
  ),
  setAPIResponseCallback: wrap(
    callback_params.NO_CALLBACK,
    settings.setAPIResponseCallback,
    /* allowed before init */ true,
  ),
  setDMAParamsForEEA: wrap(
    callback_params.CALLBACK_ERR,
    settings.setDMAParamsForEEA,
    true,
  ),
  setRequestMetaData: settings.setRequestMetaData,
  setAPIUrl: settings.setAPIUrl,
  getAPIUrl: settings.getAPIUrl,
};

Object.assign(Branch.prototype, api);

// Gives the instance type the methods registered above. Their arguments stay
// loosely typed, as they were when the methods were assigned to a prototype.
export interface Branch extends BranchApi {}
type BranchApi = { [K in keyof typeof api]: (...args: any[]) => any };
