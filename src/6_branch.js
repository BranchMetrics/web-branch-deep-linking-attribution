/***
 * This file provides the main Branch function.
 */
'use strict';
goog.provide('Branch');
goog.require('goog.json'); // jshint unused:false

goog.require('utils');
goog.require('resources');
goog.require('Server');
goog.require('banner');
goog.require('task_queue');
goog.require('storage');
goog.require('session');
goog.require('config');
goog.require('safejson');
goog.require('branch_view');
goog.require('appindexing');
goog.require('journeys_utils');

/*globals Ti, BranchStorage, require */

var default_branch;

/**
 * Enum for what parameters are in a wrapped Branch method
 * @enum {number}
 */
var callback_params = {
	NO_CALLBACK: 0,
	CALLBACK_ERR: 1,
	CALLBACK_ERR_DATA: 2
};

/**
 * Enum for the initialization state of the Branch Object
 * @enum {number}
 */
var init_states = {
	NO_INIT: 0,
	INIT_PENDING: 1,
	INIT_FAILED: 2,
	INIT_SUCCEEDED: 3
};

/**
 * Enum for the initialization state of the Branch Object
 * @enum {number}
 */
var init_state_fail_codes = {
	NO_FAILURE: 0,
	UNKNOWN_CAUSE: 1,
	OPEN_FAILED: 2,
	BFP_NOT_FOUND: 3,
	HAS_APP_FAILED: 4
};

/***
 * @param {number} parameters
 * @param {function(...?): undefined} func
 * @param {boolean=} init
 */
var wrap = function(parameters, func, init) {
	var r = function() {
		var self = this;
		var args;
		var callback;
		var lastArg = arguments[arguments.length - 1];
		if (parameters === callback_params.NO_CALLBACK || typeof lastArg !== 'function') {
			callback = function(err) {
				return;
			};
			args = Array.prototype.slice.call(arguments);
		}
		else {
			args = Array.prototype.slice.call(arguments, 0, arguments.length - 1) || [];
			callback = lastArg;
		}
		self._queue(function(next) {
			/***
			 * @type {function(?Error,?): undefined}
			 */
			var done = function(err, data) {
				try {
					if (err && parameters === callback_params.NO_CALLBACK) {
						throw err;
					}
					else if (parameters === callback_params.CALLBACK_ERR) {
						callback(err);
					}
					else if (parameters === callback_params.CALLBACK_ERR_DATA) {
						callback(err, data);
					}
				}
				finally {
					// ...but we always want to call next
					next();
				}
			};
			if (!init) {
				if (self.init_state === init_states.INIT_PENDING) {
					return done(new Error(utils.message(utils.messages.initPending)), null);
				}
				else if (self.init_state === init_states.INIT_FAILED) {
					return done(new Error(utils.message(utils.messages.initFailed, self.init_state_fail_code, self.init_state_fail_details)), null);
				}
				else if (self.init_state === init_states.NO_INIT || !self.init_state) {
					return done(new Error(utils.message(utils.messages.nonInit)), null);
				}
			}
			args.unshift(done);
			func.apply(self, args);
		});
	};
	return r;
};

/***
 * @class Branch
 * @constructor
 */
Branch = function() {
	if (!(this instanceof Branch)) {
		if (!default_branch) {
			default_branch = new Branch();
		}
		return default_branch;
	}
	this._queue = task_queue();

	var storageMethods = [ 'session', 'cookie', 'pojo' ];

	this._storage = /** @type {storage} */ (new BranchStorage(storageMethods));

	this._server = new Server();

	var sdk = 'web';

	/** @type {Array<utils.listener>} */
	this._listeners = [ ];

	this.sdk = sdk + config.version;

	this.init_state = init_states.NO_INIT;
	this.init_state_fail_code = init_state_fail_codes.NO_FAILURE;
	this.init_state_fail_details = null;
};

/***
 * @param {utils.resource} resource
 * @param {Object.<string, *>} obj
 * @param {function(?Error,?)=} callback
 */
Branch.prototype._api = function(resource, obj, callback) {
	if (this.app_id) {
		obj['app_id'] = this.app_id;
	}
	if (this.branch_key) {
		obj['branch_key'] = this.branch_key;
	}
	if (((resource.params && resource.params['session_id']) ||
			(resource.queryPart && resource.queryPart['session_id'])) &&
			this.session_id) {
		obj['session_id'] = this.session_id;
	}
	if (((resource.params && resource.params['identity_id']) ||
			(resource.queryPart && resource.queryPart['identity_id'])) &&
			this.identity_id) {
		obj['identity_id'] = this.identity_id;
	}
	if (((resource.params && resource.params['link_click_id']) ||
			(resource.queryPart && resource.queryPart['link_click_id'])) &&
			this.link_click_id) {
		obj['link_click_id'] = this.link_click_id;
	}
	if (((resource.params && resource.params['sdk']) ||
			(resource.queryPart && resource.queryPart['sdk'])) && this.sdk) {
		obj['sdk'] = this.sdk;
	}

	if (((resource.params && resource.params['browser_fingerprint_id']) ||
			(resource.queryPart && resource.queryPart['browser_fingerprint_id'])) &&
			this.browser_fingerprint_id) {
		obj['browser_fingerprint_id'] = this.browser_fingerprint_id;
	}
	// Adds tracking_disabled to every post request when enabled
	if (utils.userPreferences.trackingDisabled) {
		obj['tracking_disabled'] = utils.userPreferences.trackingDisabled;
	}

	return this._server.request(resource, obj, this._storage, function(err, data) {
		callback(err, data);
	});
};

/***
 * @function Branch._referringLink
 */
Branch.prototype._referringLink = function() {
	var sessionData = session.get(this._storage);
	var referringLink = sessionData && sessionData['referring_link'];
	if (referringLink) {
		return referringLink;
	}

	var clickId = this._storage.get('click_id');
	if (clickId) {
		return config.link_service_endpoint + '/c/' + clickId;
	}

	return null;
};

/***
 * @function Branch._publishEvent
 * @param {string} event
 * @param {Object} data - _optional_ - data to pass into listener callback.
 */
Branch.prototype._publishEvent = function(event, data) {
	for (var i = 0; i < this._listeners.length; i++) {
		if (!this._listeners[i].event || this._listeners[i].event === event) {
			this._listeners[i].listener(event, data);
		}
	}
};

/**
 * @function Branch.init
 * @param {string} branch_key - _required_ - Your Branch [live key](http://dashboard.branch.io/settings), or (deprecated) your app id.
 * @param {Object=} options - _optional_ - { }.
 * @param {function(?Error, utils.sessionData=)=} callback - _optional_ - callback to read the
 * session data.
 *
 * Adding the Branch script to your page automatically creates a window.branch
 * object with all the external methods described below. All calls made to
 * Branch methods are stored in a queue, so even if the SDK is not fully
 * instantiated, calls made to it will be queued in the order they were
 * originally called.
 * If the session was opened from a referring link, `data()` will also return the referring link
 * click as `referring_link`, which gives you the ability to continue the click flow.
 *
 * The init function on the Branch object initiates the Branch session and
 * creates a new user session, if it doesn't already exist, in
 * `sessionStorage`.
 *
 * **Useful Tip**: The init function returns a data object where you can read
 * the link the user was referred by.
 *
 * Properties available in the options object:
 *
 * | Key | Value
 * | --- | ---
 * | branch_match_id | *optional* - `string`. The current user's browser-fingerprint-id. The value of this parameter should be the same as the value of ?_branch_match_id (automatically appended by Branch after a link click). _Only necessary if ?_branch_match_id is lost due to multiple redirects in your flow_.
 * | branch_view_id | *optional* - `string`. If you would like to test how Journeys render on your page before activating them, you can set the value of this parameter to the id of the view you are testing. _Only necessary when testing a view related to a Journey_.
 * | no_journeys | *optional* - `boolean`. When true, prevents Journeys from appearing on current page.
 * | disable_entry_animation | *optional* - `boolean`. When true, prevents a Journeys entry animation.
 * | disable_exit_animation | *optional* - `boolean`. When true, prevents a Journeys exit animation.
 * | retries | *optional* - `integer`. Value specifying the number of times that a Branch API call can be re-attempted. Default 2.
 * | retry_delay | *optional* - `integer `. Amount of time in milliseconds to wait before re-attempting a timed-out request to the Branch API. Default 200 ms.
 * | timeout | *optional* - `integer`. Duration in milliseconds that the system should wait for a response before considering any Branch API call to have timed out. Default 5000 ms.
 * | metadata | *optional* - `object`. Key-value pairs used to target Journeys users via the "is viewing a page with metadata key" filter.
 * | nonce | *optional* - `string`. A nonce value that will be added to branch-journey-cta injected script. Used to allow that script from a Content Security Policy.
 * | tracking_disabled | *optional* - `boolean`. true disables tracking
 *
 * ##### Usage
 * ```js
 * branch.init(
 *     branch_key,
 *     options,
 *     callback (err, data),
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *      "Error message",
 *      {
 *           data_parsed:        { },                          // If the user was referred from a link, and the link has associated data, the data is passed in here.
 *           referring_identity: '12345',                      // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
 *           has_app:            true,                         // Does the user have the app installed already?
 *           identity:           'BranchUser',                 // Unique string that identifies the user
 *           referring_link:     'https://bnc.lt/c/jgg75-Gjd3' // The referring link click, if available.
 *      }
 * );
 * ```
 *
 * **Note:** `Branch.init` must be called prior to calling any other Branch functions.
 * ___
 */
/*** +TOC_HEADING &Branch Session& ^ALL ***/
/*** +TOC_ITEM #initbranch_key-options-callback &.init()& ^ALL ***/
Branch.prototype['init'] = wrap(
	callback_params.CALLBACK_ERR_DATA,
	function(done, branch_key, options) {

		if (utils.navigationTimingAPIEnabled) {
			utils.instrumentation['init-began-at'] = utils.timeSinceNavigationStart();
		}

		var self = this;

		self.init_state = init_states.INIT_PENDING;

		if (utils.isKey(branch_key)) {
			self.branch_key = branch_key;
		}
		else {
			self.app_id = branch_key;
		}

		options = options && utils.validateParameterType(options, 'object') ? options : { };
		self.init_options = options;

		utils.retries = options && options['retries'] && Number.isInteger(options['retries']) ? options['retries'] : utils.retries;
		utils.retry_delay = options && options['retry_delay'] && Number.isInteger(options['retry_delay']) ? options['retry_delay'] : utils.retry_delay;
		utils.timeout = options && options['timeout'] && Number.isInteger(options['timeout']) ? options['timeout'] : utils.timeout;
		utils.nonce = options && options['nonce'] ? options['nonce'] : utils.nonce;

		utils.userPreferences.trackingDisabled = options && options['tracking_disabled'] && options['tracking_disabled'] === true ? true : false;
		utils.userPreferences.allowErrorsInCallback = false;

		if (utils.userPreferences.trackingDisabled) {
			utils.cleanApplicationAndSessionStorage(self);
		}

		var setBranchValues = function(data) {
			if (data['link_click_id']) {
				self.link_click_id = data['link_click_id'].toString();
			}
			if (data['session_id']) {
				self.session_id = data['session_id'].toString();
			}
			if (data['identity_id']) {
				self.identity_id = data['identity_id'].toString();
			}
			if (data['link']) {
				self.sessionLink = data['link'];
			}
			if (data['referring_link']) {
				data['referring_link'] = utils.processReferringLink(data['referring_link']);
			}
			if (!data['click_id'] && data['referring_link']) {
				data['click_id'] = utils.getClickIdAndSearchStringFromLink(data['referring_link']);
			}

			self.browser_fingerprint_id = data['browser_fingerprint_id'];

			return data;
		};

		var sessionData = session.get(self._storage);
		var branchMatchIdFromOptions = (options && typeof options['branch_match_id'] !== 'undefined' && options['branch_match_id'] !== null) ?
			options['branch_match_id'] :
			null;
		var link_identifier = (branchMatchIdFromOptions || utils.getParamValue('_branch_match_id') || utils.hashValue('r'));
		var freshInstall = !sessionData || !sessionData['identity_id'];
		self._branchViewEnabled = !!self._storage.get('branch_view_enabled');
		var checkHasApp = function(cb) {
			var params_r = { "sdk": config.version, "branch_key": self.branch_key };
			var currentSessionData = session.get(self._storage) || {};
			var permData = session.get(self._storage, true) || {};
			if (permData['browser_fingerprint_id']) {
				params_r['_t'] = permData['browser_fingerprint_id'];
			}
			if (!utils.isSafari11OrGreater()) {
				self._api(
					resources._r,
					params_r,
					function(err, browser_fingerprint_id) {
						if (err) {
							self.init_state_fail_code = init_state_fail_codes.BFP_NOT_FOUND;
							self.init_state_fail_details = err.message;
						}
						if (browser_fingerprint_id) {
							currentSessionData['browser_fingerprint_id'] = browser_fingerprint_id;
						}
					}
				);
			}
			self._api(
				resources.hasApp,
				{ "browser_fingerprint_id": currentSessionData['browser_fingerprint_id'] },
				function(err, has_app) {
					if (err) {
						self.init_state_fail_code = init_state_fail_codes.HAS_APP_FAILED;
						self.init_state_fail_details = err.message;
					}
					if (!err && has_app && !currentSessionData['has_app']) {
						currentSessionData['has_app'] = true;
						session.update(self._storage, currentSessionData);
						self._publishEvent('didDownloadApp');
					}
					if (cb) {
						cb(null, currentSessionData);
					}
				}
			);
		};

		var finishInit = function(err, data) {
			if (data) {
				data = setBranchValues(data);
				if (!utils.userPreferences.trackingDisabled) {
					session.set(self._storage, data, freshInstall);
				}
				self.init_state = init_states.INIT_SUCCEEDED;
				data['data_parsed'] = data['data'] && data['data'].length !== 0 ? safejson.parse(data['data']) : {};
			}
			if (err) {
				self.init_state = init_states.INIT_FAILED;
				if (!self.init_state_fail_code) {
					self.init_state_fail_code = init_state_fail_codes.UNKNOWN_CAUSE;
					self.init_state_fail_details = err.message;
				}

				return done(err, data && utils.whiteListSessionData(data));
			}

			try {
				done(err, data && utils.whiteListSessionData(data));
			}
			catch (e) {
				// pass
			}
			finally {
				self['renderFinalize']();
			}

			var additionalMetadata = utils.getAdditionalMetadata();
			var metadata = utils.validateParameterType(options['metadata'], "object") ? options['metadata'] : null;
			if (metadata) {
				var hostedDeeplinkDataWithMergedMetadata = utils.mergeHostedDeeplinkData(additionalMetadata['hosted_deeplink_data'], metadata);
				if (hostedDeeplinkDataWithMergedMetadata && Object.keys(hostedDeeplinkDataWithMergedMetadata).length > 0) {
					additionalMetadata['hosted_deeplink_data'] = hostedDeeplinkDataWithMergedMetadata;
				}
			}
			var requestData = branch_view._getPageviewRequestData(
				journeys_utils._getPageviewMetadata(options, additionalMetadata),
				options,
				self,
				false
			);
			self['renderQueue'](function() {
				self._api(
					resources.pageview,
					requestData,
					function(err, pageviewResponse) {
						if (!err && typeof pageviewResponse === "object") {
							var journeyInTestMode = requestData['branch_view_id'] ? true : false;
							if (branch_view.shouldDisplayJourney(
									pageviewResponse,
									options,
									journeyInTestMode
								)
							) {
								branch_view.displayJourney(
									pageviewResponse['template'],
									requestData,
									requestData['branch_view_id'] || pageviewResponse['event_data']['branch_view_data']['id'],
									pageviewResponse['event_data']['branch_view_data'],
									journeyInTestMode
								);
							}
							else {
								journeys_utils.branch._publishEvent('willNotShowJourney');
							}
						}
						if (utils.userPreferences.trackingDisabled) {
							utils.userPreferences.allowErrorsInCallback = true;
						}
					}
				);
			});
		};
		var attachVisibilityEvent = function() {
			var hidden;
			var changeEvent;
			if (typeof document.hidden !== 'undefined') {
				hidden = 'hidden';
				changeEvent = 'visibilitychange';
			}
			else if (typeof document.mozHidden !== 'undefined') {
				hidden = 'mozHidden';
				changeEvent = 'mozvisibilitychange';
			}
			else if (typeof document.msHidden !== 'undefined') {
				hidden = 'msHidden';
				changeEvent = 'msvisibilitychange';
			}
			else if (typeof document.webkitHidden !== 'undefined') {
				hidden = 'webkitHidden';
				changeEvent = 'webkitvisibilitychange';
			}
			if (changeEvent) {
				// Ensures that we add a change-event-listener exactly once in-case re-initialization occurs through branch.trackingDisabled(false)
				if (!self.changeEventListenerAdded) {
					self.changeEventListenerAdded = true;
					document.addEventListener(changeEvent, function() {
						if (!document[hidden]) {
							checkHasApp(null);
							if (typeof self._deepviewRequestForReplay === 'function') {
								self._deepviewRequestForReplay();
							}
						}
					}, false);
				}
			}
		};

		if (sessionData && sessionData['session_id'] && !link_identifier) {
			// resets data in session storage to prevent previous link click data from being returned to Branch.init()
			session.update(self._storage, { "data": "" });
			session.update(self._storage, { "referring_link": "" });
			attachVisibilityEvent();
			checkHasApp(finishInit);
			return;
		}

		var params_r = { "sdk": config.version, "branch_key": self.branch_key };
		var permData = session.get(self._storage, true) || {};
		if (permData['browser_fingerprint_id']) {
			params_r['_t'] = permData['browser_fingerprint_id'];
		}

		if (!utils.isSafari11OrGreater()) {
			self._api(
				resources._r,
				params_r,
				function(err, browser_fingerprint_id) {
					if (err) {
						self.init_state_fail_code = init_state_fail_codes.BFP_NOT_FOUND;
						self.init_state_fail_details = err.message;
						return finishInit(err, null);
					}
					self._api(
						resources.open,
						{
							"link_identifier": link_identifier,
							"browser_fingerprint_id": link_identifier || browser_fingerprint_id,
							"alternative_browser_fingerprint_id": permData['browser_fingerprint_id'],
							"options": options,
							"initial_referrer": utils.getInitialReferrer(self._referringLink())
						},
						function(err, data) {
							if (err) {
								self.init_state_fail_code = init_state_fail_codes.OPEN_FAILED;
								self.init_state_fail_details = err.message;
							}
							if (!err && typeof data === 'object') {
								if (data['branch_view_enabled']) {
									self._branchViewEnabled = !!data['branch_view_enabled'];
									self._storage.set('branch_view_enabled', self._branchViewEnabled);
								}
								if (link_identifier) {
									data['click_id'] = link_identifier;
								}
							}
							attachVisibilityEvent();
							finishInit(err, data);
						}
					);
				}
			);
		}
		else {
			self._api(
				resources.open,
				{
					"link_identifier": link_identifier,
					"browser_fingerprint_id": link_identifier || permData['browser_fingerprint_id'],
					"alternative_browser_fingerprint_id": permData['browser_fingerprint_id'],
					"options": options,
					"initial_referrer": utils.getInitialReferrer(self._referringLink())
				},
				function(err, data) {
					if (err) {
						self.init_state_fail_code = init_state_fail_codes.OPEN_FAILED;
						self.init_state_fail_details = err.message;
					}
					if (!err && typeof data === 'object') {
						if (data['branch_view_enabled']) {
							self._branchViewEnabled = !!data['branch_view_enabled'];
							self._storage.set('branch_view_enabled', self._branchViewEnabled);
						}
						if (link_identifier) {
							data['click_id'] = link_identifier;
						}
					}
					attachVisibilityEvent();
					finishInit(err, data);
				}
			);
		}
	},
	true
);


/**
 * currently private method, which may be opened to the public in the future
 */
Branch.prototype['renderQueue'] = wrap(callback_params.NO_CALLBACK, function(done, render) {
	var self = this;
	if (self._renderFinalized) {
		render();
	}
	else {
		self._renderQueue = self._renderQueue || [];
		self._renderQueue.push(render);
	}
	done(null, null);
});


/**
 * currently private method, which may be opened to the public in the future
 */
Branch.prototype['renderFinalize'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done) {
	var self = this;
	if (self._renderQueue && self._renderQueue.length > 0) {
		self._renderQueue.forEach(function(callback) {
			callback.call(this);
		});
		delete self._renderQueue;
	}
	self._renderFinalized = true;
	done(null, null);
});


/**
 * @function Branch.data
 * @param {function(?Error, utils.sessionData=)=} callback - _optional_ - callback to read the
 * session data.
 *
 * Returns the same session information and any referring data, as
 * `Branch.init`, but does not require the `app_id`. This is meant to be called
 * after `Branch.init` has been called if you need the session information at a
 * later point.
 * If the Branch session has already been initialized, the callback will return
 * immediately, otherwise, it will return once Branch has been initialized.
 * ___
 */
/*** +TOC_ITEM #datacallback &.data()& ^ALL ***/
Branch.prototype['data'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done) {
	var data = utils.whiteListSessionData(session.get(this._storage));
	data['referring_link'] = this._referringLink();
	data['data_parsed'] = data['data'] && data['data'].length !== 0 ? safejson.parse(data['data']) : {};
	done(null, data);
});

/**
 * @function Branch.first
 * @param {function(?Error, utils.sessionData=)=} callback - _optional_ - callback to read the
 * session data.
 *
 * Returns the same session information and any referring data, as
 * `Branch.init` did when the app was first installed. This is meant to be called
 * after `Branch.init` has been called if you need the first session information at a
 * later point.
 * If the Branch session has already been initialized, the callback will return
 * immediately, otherwise, it will return once Branch has been initialized.
 *
 * ___
 *
 */
/*** +TOC_ITEM #firstcallback &.first()& ^ALL ***/
Branch.prototype['first'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done) {
	done(null, utils.whiteListSessionData(session.get(this._storage, true)));
});

/**
 * @function Branch.setIdentity
 * @param {string} identity - _required_ - a string uniquely identifying the user - often a user ID
 * or email address.
 * @param {function(?Error, Object=)=} callback - _optional_ - callback that returns the user's
 * Branch identity id and unique link.
 *
 * **[Formerly `identify()`](CHANGELOG.md)**
 *
 * Sets the identity of a user and returns the data. To use this function, pass
 * a unique string that identifies the user - this could be an email address,
 * UUID, Facebook ID, etc.
 *
 * ##### Usage
 * ```js
 * branch.setIdentity(
 *     identity,
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *      "Error message",
 *      {
 *           identity_id:             '12345', // Server-generated ID of the user identity, stored in `sessionStorage`.
 *           link:                    'url',   // New link to use (replaces old stored link), stored in `sessionStorage`.
 *           referring_data_parsed:    { },      // Returns the initial referring data for this identity, if exists, as a parsed object.
 *           referring_identity:      '12345'  // Returns the initial referring identity for this identity, if exists.
 *      }
 * );
 * ```
 * ___
 */
/*** +TOC_ITEM #setidentityidentity-callback &.setIdentity()& ^ALL ***/
Branch.prototype['setIdentity'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done, identity) {
	var self = this;
	this._api(
		resources.profile,
		{
			"identity": identity
		},
		function(err, data) {
			if (err) {
				done(err);
			}

			data = data || { };
			self.identity_id = data['identity_id'] ? data['identity_id'].toString() : null;
			self.sessionLink = data['link'];
			self.identity = identity;

			data['referring_data_parsed'] = data['referring_data'] ?
				safejson.parse(data['referring_data']) :
				null;
			session.update(self._storage, data);

			done(null, data);
		}
	);
});

/**
 * @function Branch.logout
 * @param {function(?Error)=} callback - _optional_
 *
 * Logs out the current session, replaces session IDs and identity IDs.
 *
 * ##### Usage
 * ```js
 * branch.logout(
 *     callback (err)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *      "Error message"
 * );
 * ```
 * ___
 *
 */
/*** +TOC_ITEM #logoutcallback &.logout()& ^ALL ***/
Branch.prototype['logout'] = wrap(callback_params.CALLBACK_ERR, function(done) {
	var self = this;
	this._api(resources.logout, { }, function(err, data) {
		if (err) {
			done(err);
		}

		data = data || { };
		data = {
			"data_parsed": null,
			"data": null,
			"referring_link": null,
			"click_id": null,
			"link_click_id": null,
			"identity": null,
			"session_id": data['session_id'],
			"identity_id": data['identity_id'],
			"link": data['link'],
			"device_fingerprint_id": self.device_fingerprint_id || null
		};

		self.sessionLink = data['link'];
		self.session_id = data['session_id'];
		self.identity_id = data['identity_id'];
		self.identity = data['identity'];
		session.update(self._storage, data);

		done(null);
	});
});

/**
 * @function Branch.getBrowserFingerprintId
 * @param {function(?Error, data=)=} callback - callback to read a user's browser-fingerprint-id
 *
 * Returns the current user's browser-fingerprint-id. If tracking is disabled then 'null' is returned.
 *
 * ##### Usage
 * ```js
 * branch.getBrowserFingerprintId(function(err, data) { console.log(data); });
 *
 * *
 * ##### Callback Format
 * ```js
 * callback(
 *      null,
 *      '79336952217731267', // browser-fingerprint-id, stored in `localStorage`.
 * );
 * ```
 * ___
 *
 */
/*** +TOC_ITEM #getbrowserfingerprintidcallback &.getBrowserFingerprintId()& ^ALL ***/
Branch.prototype['getBrowserFingerprintId'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done) {
	var permData = session.get(this._storage, true) || {};
	done(null, permData['browser_fingerprint_id'] || null);
});

/**
 * @function Branch.track
 * @param {string} event - _required_ - name of the event to be tracked.
 * @param {Object=} metadata - _optional_ - object of event metadata.
 * @param {function(?Error)=} callback - _optional_
 *
 * This function allows you to track any event with supporting metadata.
 * The `metadata` parameter is a formatted JSON object that can contain
 * any data and has limitless hierarchy
 *
 * ##### Usage
 * ```js
 * branch.track(
 *     event,
 *     metadata,
 *     callback (err)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback("Error message");
 * ```
 * ___
 */
/*** +TOC_HEADING &Event Tracking& ^ALL ***/
/*** +TOC_ITEM #trackevent-metadata-callback &.track()& ^ALL ***/
Branch.prototype['track'] = wrap(callback_params.CALLBACK_ERR, function(done, event, metadata, options) {
	var self = this;

	metadata = metadata || {};

	options = options || {};

	utils.nonce = options['nonce'] ? options['nonce'] : utils.nonce;

	if (event === "pageview") {
		var hostedDeeplinkDataWithMergedMetadata = utils.mergeHostedDeeplinkData(utils.getHostedDeepLinkData(), metadata);
		if (hostedDeeplinkDataWithMergedMetadata && Object.keys(hostedDeeplinkDataWithMergedMetadata).length > 0) {
			metadata['hosted_deeplink_data'] = hostedDeeplinkDataWithMergedMetadata;
		}

		var requestData = branch_view._getPageviewRequestData(
			journeys_utils._getPageviewMetadata(options, metadata),
			options,
			self,
			false
		);
		self._api(resources.pageview,
			requestData,
			function(err, pageviewResponse) {
				if (!err && typeof pageviewResponse === "object") {
					var journeyInTestMode = requestData['branch_view_id'] ? true : false;
					if (branch_view.shouldDisplayJourney
						(
							pageviewResponse,
							options,
							journeyInTestMode
						)
					) {
						branch_view.displayJourney(
							pageviewResponse['template'],
							requestData,
							requestData['branch_view_id'] || pageviewResponse['event_data']['branch_view_data']['id'],
							pageviewResponse['event_data']['branch_view_data'],
							journeyInTestMode
						);
					}
					else {
						journeys_utils.branch._publishEvent('willNotShowJourney');
					}
				}
				if (typeof done === 'function') {
					done.apply(this, arguments);
				}
			}
		);

	}
	else {
		self._api(resources.event, {
			"event": event,
			"metadata": utils.merge({
				"url": utils.getWindowLocation(),
				"user_agent": navigator.userAgent,
				"language": navigator.language
			}, metadata),
			"initial_referrer": utils.getInitialReferrer(self._referringLink())
		}, function(err, data) {
			if (typeof done === 'function') {
				done.apply(this, arguments);
			}
		});
	}
});

/**
 * @function Branch.logEvent
 * @param {String} event - _required_
 * @param {Object} event_data_and_custom_data - _optional_
 * @param {Array} content_items - _optional_
 * @param {function(?Error)=} callback - _optional_
 *
 * Register commerce events, content events, user lifecycle events and custom events via logEvent()
 *
 * ##### NOTE: If this is the first time you are integrating our new event tracking feature via logEvent(), please use the latest Branch WebSDK snippet from the [Installation section](https://github.com/BranchMetrics/web-branch-deep-linking#quick-install). This has been updated in v2.30.0 of our SDK.
 *
 * The guides below provide information about what keys can be sent when triggering these event types:
 *
 * - [Logging Commerce Events](https://github.com/BranchMetrics/branch-deep-linking-public-api/blob/dfe601286f7b01a6951d6952fc833220e97d80c0/README.md#logging-commerce-events)
 * - [Logging Content Events](https://github.com/BranchMetrics/branch-deep-linking-public-api/blob/dfe601286f7b01a6951d6952fc833220e97d80c0/README.md#logging-content-events)
 * - [Logging User Lifecycle](https://github.com/BranchMetrics/branch-deep-linking-public-api/blob/dfe601286f7b01a6951d6952fc833220e97d80c0/README.md#logging-user-lifecycle-events)
 * - [Logging Custom Events](https://github.com/BranchMetrics/branch-deep-linking-public-api/blob/dfe601286f7b01a6951d6952fc833220e97d80c0/README.md#logging-custom-events)
 *
 * ##### Usage for Commerce, Content & User Lifecycle "Standard Events"
 * ```js
 * branch.logEvent(
 *     event,
 *     event_data_and_custom_data,
 *     content_items,
 *     callback (err)
 * );
 * ```
 * ##### Usage for "Custom Events"
 * ```js
 * branch.logEvent(
 *     event,
 *     custom_data,
 *     callback (err)
 * );
 * ```
 * ##### Notes:
 * - logEvent() sends user_data automatically
 * - When firing Standard Events, send custom and event data as part of the same object
 * - Custom Events do not contain content items and event data
 *
 * ##### Example -- How to log a Commerce Event
 * ```js
 *var event_and_custom_data = {
 *    "transaction_id": "tras_Id_1232343434",
 *    "currency": "USD",
 *    "revenue": 180.2,
 *    "shipping": 10.5,
 *    "tax": 13.5,
 *    "coupon": "promo-1234",
 *    "affiliation": "high_fi",
 *    "description": "Preferred purchase",
 *    "purchase_loc": "Palo Alto",
 *    "store_pickup": "unavailable"
 *};
 *
 *var content_items = [
 *{
 *    "$content_schema": "COMMERCE_PRODUCT",
 *    "$og_title": "Nike Shoe",
 *    "$og_description": "Start loving your steps",
 *    "$og_image_url": "http://example.com/img1.jpg",
 *    "$canonical_identifier": "nike/1234",
 *    "$publicly_indexable": false,
 *    "$price": 101.2,
 *    "$locally_indexable": true,
 *    "$quantity": 1,
 *    "$sku": "1101123445",
 *    "$product_name": "Runner",
 *    "$product_brand": "Nike",
 *    "$product_category": "Sporting Goods",
 *    "$product_variant": "XL",
 *    "$rating_average": 4.2,
 *    "$rating_count": 5,
 *    "$rating_max": 2.2,
 *    "$creation_timestamp": 1499892854966,
 *    "$exp_date": 1499892854966,
 *    "$keywords": [ "sneakers", "shoes" ],
 *    "$address_street": "230 South LaSalle Street",
 *    "$address_city": "Chicago",
 *    "$address_region": "IL",
 *    "$address_country": "US",
 *    "$address_postal_code": "60604",
 *    "$latitude": 12.07,
 *    "$longitude": -97.5,
 *    "$image_captions": [ "my_img_caption1", "my_img_caption_2" ],
 *    "$condition": "NEW",
 *    "$custom_fields": {"foo1":"bar1","foo2":"bar2"}
 *},
 *{
 *    "$og_title": "Nike Woolen Sox",
 *    "$canonical_identifier": "nike/5324",
 *    "$og_description": "Fine combed woolen sox for those who love your foot",
 *    "$publicly_indexable": false,
 *    "$price": 80.2,
 *    "$locally_indexable": true,
 *    "$quantity": 5,
 *    "$sku": "110112467",
 *    "$product_name": "Woolen Sox",
 *    "$product_brand": "Nike",
 *    "$product_category": "Apparel & Accessories",
 *    "$product_variant": "Xl",
 *    "$rating_average": 3.3,
 *    "$rating_count": 5,
 *    "$rating_max": 2.8,
 *    "$creation_timestamp": 1499892854966
 *}];
 *
 *branch.logEvent(
 *    "PURCHASE",
 *    event_and_custom_data,
 *    content_items,
 *    function(err) { console.log(err); }
 *);
 * ```
 * ___
 */
/*** +TOC_ITEM #logeventevent-event_data_and_custom_data-content_items-callback &.logEvent()& ^ALL ***/
Branch.prototype['logEvent'] = wrap(callback_params.CALLBACK_ERR, function(done, name, eventData, contentItems) {
	name = utils.validateParameterType(name, 'string') ? name : null;
	eventData = utils.validateParameterType(eventData, 'object') ? eventData : null;

	if (utils.isStandardEvent(name)) {
		contentItems = utils.validateParameterType(contentItems, 'array') ? contentItems : null;
		var extractedEventAndCustomData = utils.separateEventAndCustomData(eventData);
		this._api(resources.logStandardEvent,
			{ "name": name,
			"user_data": safejson.stringify(utils.getUserData(this)),
			"custom_data": safejson.stringify(extractedEventAndCustomData && extractedEventAndCustomData["custom_data"] || {}),
			"event_data": safejson.stringify(extractedEventAndCustomData && extractedEventAndCustomData["event_data"] || {}),
			"content_items": safejson.stringify(contentItems || [])
		}, function(err, data) {
			return done(err || null);
		});
	}
	else {
		this._api(resources.logCustomEvent,
			{ "name": name,
			"user_data": safejson.stringify(utils.getUserData(this)),
			"custom_data": safejson.stringify(utils.convertObjectValuesToString(eventData) || {})
		}, function(err, data) {
			return done(err || null);
		});
	}
});

/**
 * @function Branch.link
 * @param {Object} data - _required_ - link data and metadata.
 * @param {function(?Error,String=)} callback - _required_ - returns a string of the Branch deep
 * linking URL.
 *
 * **[Formerly `createLink()`](CHANGELOG.md)**
 *
 * Creates and returns a deep linking URL.  The `data` parameter can include an
 * object with optional data you would like to store, including Facebook
 * [Open Graph data](https://developers.facebook.com/docs/opengraph).
 *
 * **data** The dictionary to embed with the link. Accessed as session or install parameters from
 * the SDK.
 *
 * **Note**
 * You can customize the Facebook OG tags of each URL if you want to dynamically share content by
 * using the following optional keys in the data dictionary. Please use this
 * [Facebook tool](https://developers.facebook.com/tools/debug/og/object) to debug your OG tags!
 *
 * | Key | Value
 * | --- | ---
 * | "$og_title" | The title you'd like to appear for the link in social media
 * | "$og_description" | The description you'd like to appear for the link in social media
 * | "$og_image_url" | The URL for the image you'd like to appear for the link in social media
 * | "$og_video" | The URL for the video
 * | "$og_url" | The URL you'd like to appear
 * | "$og_redirect" | If you want to bypass our OG tags and use your own, use this key with the URL that contains your site's metadata.
 *
 * Also, you can set custom redirection by inserting the following optional keys in the dictionary:
 *
 * | Key | Value
 * | --- | ---
 * | "$desktop_url" | Where to send the user on a desktop or laptop. By default it is the Branch-hosted text-me service
 * | "$android_url" | The replacement URL for the Play Store to send the user if they don't have the app. _Only necessary if you want a mobile web splash_
 * | "$ios_url" | The replacement URL for the App Store to send the user if they don't have the app. _Only necessary if you want a mobile web splash_
 * | "$ipad_url" | Same as above but for iPad Store
 * | "$fire_url" | Same as above but for Amazon Fire Store
 * | "$blackberry_url" | Same as above but for Blackberry Store
 * | "$windows_phone_url" | Same as above but for Windows Store
 * | "$after_click_url" | When a user returns to the browser after going to the app, take them to this URL. _iOS only; Android coming soon_
 *
 * You have the ability to control the direct deep linking of each link as well:
 *
 * | Key | Value
 * | --- | ---
 * | "$deeplink_path" | The value of the deep link path that you'd like us to append to your URI. For example, you could specify "$deeplink_path": "radio/station/456" and we'll open the app with the URI "yourapp://radio/station/456?link_click_id=branch-identifier". This is primarily for supporting legacy deep linking infrastructure.
 * | "$always_deeplink" | true or false. (default is not to deep link first) This key can be specified to have our linking service force try to open the app, even if we're not sure the user has the app installed. If the app is not installed, we fall back to the respective app store or $platform_url key. By default, we only open the app if we've seen a user initiate a session in your app from a Branch link (has been cookied and deep linked by Branch).
 *
 * #### Usage
 * ```js
 * branch.link(
 *     data,
 *     callback (err, link)
 * );
 * ```
 *
 * #### Example
 * ```js
 * branch.link({
 *     tags: [ 'tag1', 'tag2' ],
 *     channel: 'facebook',
 *     feature: 'dashboard',
 *     stage: 'new user',
 *     data: {
 *         mydata: 'something',
 *         foo: 'bar',
 *         '$desktop_url': 'http://myappwebsite.com',
 *         '$ios_url': 'http://myappwebsite.com/ios',
 *         '$ipad_url': 'http://myappwebsite.com/ipad',
 *         '$android_url': 'http://myappwebsite.com/android',
 *         '$og_app_id': '12345',
 *         '$og_title': 'My App',
 *         '$og_description': 'My app\'s description.',
 *         '$og_image_url': 'http://myappwebsite.com/image.png'
 *     }
 * }, function(err, link) {
 *     console.log(err, link);
 * });
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message",
 *     'https://bnc.lt/l/3HZMytU-BW' // Branch deep linking URL
 * );
 * ```
 *
 */
/*** +TOC_HEADING &Deep Linking& ^ALL ***/
/*** +TOC_ITEM #linkdata-callback &.link()& ^ALL ***/
Branch.prototype['link'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done, data) {
	var linkData = utils.cleanLinkData(data);
	var keyCopy = this.branch_key;
	this._api(resources.link, linkData, function(err, data) {
		if (err) {
			// if an error occurs or if tracking is disabled then return a dynamic link
			return done(null, utils.generateDynamicBNCLink(keyCopy, linkData));
		}
		done(null, data && data['url']);
	});
});

/** =WEB
 * @function Branch.sendSMS
 * @param {string} phone - _required_ - phone number to send SMS to
 * @param {Object} linkData - _required_ - object of link data
 * @param {Object=} options - _optional_ - options: make_new_link, which forces the creation of a
 * new link even if one already exists
 * @param {function(?Error)=} callback - _optional_ - Returns an error if unsuccessful
 *
 * **[Formerly `SMSLink()`](CHANGELOG.md)**
 *
 * A robust function to give your users the ability to share links via SMS. If
 * the user navigated to this page via a Branch link, `sendSMS` will send that
 * same link. Otherwise, it will create a new link with the data provided in
 * the `params` argument. `sendSMS` also registers a click event with the
 * `channel` pre-filled with `'sms'` before sending an sms to the provided
 * `phone` parameter. This way the entire link click event is recorded starting
 * with the user sending an sms.
 *
 * **Note**: `sendSMS` will *automatically* send a previously generated link click,
 * along with the `data` object in the original link. Therefore, it is unneccessary for the
 * `data()` method to be called to check for an already existing link. If a link already
 * exists, `sendSMS` will simply ignore the `data` object passed to it, and send the existing link.
 * If this behavior is not desired, set `make_new_link: true` in the `options` object argument
 * of `sendSMS`, and `sendSMS` will always make a new link.
 *
 * **Supports international SMS**.
 *
 * Please note that the destination phone number needs to be from the same country the SMS is being sent from.
 *
 * #### Usage
 * ```js
 * branch.sendSMS(
 *     phone,
 *     linkData,
 *     options,
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Example
 * ```js
 * branch.sendSMS(
 *     '9999999999',
 *     {
 *         tags: ['tag1', 'tag2'],
 *         channel: 'facebook',
 *         feature: 'dashboard',
 *         stage: 'new user',
 *         data: {
 *             mydata: 'something',
 *             foo: 'bar',
 *             '$desktop_url': 'http://myappwebsite.com',
 *             '$ios_url': 'http://myappwebsite.com/ios',
 *             '$ipad_url': 'http://myappwebsite.com/ipad',
 *             '$android_url': 'http://myappwebsite.com/android',
 *             '$og_app_id': '12345',
 *             '$og_title': 'My App',
 *             '$og_description': 'My app\'s description.',
 *             '$og_image_url': 'http://myappwebsite.com/image.png'
 *         }
 *     },
 *     { make_new_link: true }, // Default: false. If set to true, sendSMS will generate a new link even if one already exists.
 *     function(err) { console.log(err); }
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback("Error message");
 * ```
 *
 * ___
 *
 * ## Deepview
 */
/*** +TOC_ITEM #sendsmsphone-linkdata-options-callback &.sendSMS()& ^ALL ***/
Branch.prototype['sendSMS'] = wrap(
	callback_params.CALLBACK_ERR,
	function(done, phone, linkData, options) {
		var self = this;
		if (typeof options === 'function') {
			options = { };
		}
		else if (typeof options === 'undefined' || options === null) {
			options = { };
		}
		options["make_new_link"] = options["make_new_link"] || false;

		if (!linkData['channel'] || linkData['channel'] === 'app banner') {
			linkData['channel'] = 'sms';
		}

		function sendSMS(click_id) {
			self._api(
				resources.SMSLinkSend, {
					"link_url": click_id,
					"phone": phone
				},
				function(err) {
					done(err || null);
				});
		}

		var referringLink = self._referringLink();
		if (referringLink && !options['make_new_link']) {
			sendSMS(utils.getClickIdAndSearchStringFromLink(referringLink));
		}
		else {
			self._api(
				resources.link,
				utils.cleanLinkData(linkData),
				function(err, data) {
					if (err) {
						return done(err);
					}
					var url = data['url'];
					if (!/(bnc.lt\/|app\.link\/)/.test(url)) {
						url = config.link_service_endpoint + '/' + utils.extractDeeplinkPath(url);
					}
					self._api(
						resources.linkClick,
						{
							"link_url": url,
							"click": "click"
						},
						function(err, data) {
							if (err) {
								return done(err);
							}
							sendSMS(data['click_id']);
						}
					);
				}
			);
		}
	}
);

/**
 * @function Branch.deepview
 * @param {Object} data - _required_ - object of all link data, same as branch.link().
 * @param {Object=} options - _optional_ - { *make_new_link*: _whether to create a new link even if
 * one already exists_. *open_app*, _whether to try to open the app passively (as opposed to
 * opening it upon user clicking); defaults to true_
 * }.
 * @param {function(?Error)=} callback - _optional_ - returns an error if the API call is unsuccessful
 *
 * Turns the current page into a "deepview" – a preview of app content. This gives the page two
 * special behaviors: (1) when the page is viewed on a mobile browser, if the user has the app
 * installed on their phone, we will try to open the app automaticaly and deeplink them to this
 * content (this can be toggled off by turning open_app to false, but this is not recommended),
 * and (2) provides a callback to open the app directly, accessible as `branch.deepviewCta()`;
 * you'll want to have a button on your web page that says something like "View in app", which
 * calls this function.
 *
 * See [this tutorial](https://blog.branch.io/how-to-deep-link-from-your-mobile-website) for a full
 * guide on how to use the deepview functionality of the Web SDK.
 *
 * #### Usage
 * ```js
 * branch.deepview(
 *     data,
 *     options,
 *     callback (err)
 * );
 * ```
 *
 * #### Example
 * ```js
 * branch.deepview(
 *     {
 *         channel: 'facebook',
 *         data: {
 *             mydata: 'content of my data',
 *             foo: 'bar',
 *             '$deeplink_path': 'item_id=12345'
 *         },
 *         feature: 'dashboard',
 *         stage: 'new user',
 *         tags: [ 'tag1', 'tag2' ],
 *     },
 *     {
 *         make_new_link: true,
 *         open_app: true
 *     },
 *     function(err) {
 *         console.log(err || 'no error');
 *     }
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message"
 * );
 * ```
 *
 */
/*** +TOC_ITEM #deepviewdata-options-callback &.deepview()& ^ALL ***/
Branch.prototype['deepview'] = wrap(callback_params.CALLBACK_ERR, function(done, data, options) {
	var self = this;

	if (!options) {
		options = { };
	}

	if (typeof options['deepview_type'] === 'undefined') {
		options['deepview_type'] = 'deepview';
	}
	else {
		// we are currently limited to just 'deepview' or 'banner', but if that changes,
		// then this line should be removed
		options['deepview_type'] = 'banner';
	}

	data['data'] = utils.merge(utils.getHostedDeepLinkData(), data['data']);
	data = utils.isIframe() ? utils.merge({ 'is_iframe': true }, data) : data;

	var cleanedData = utils.cleanLinkData(data);
	var fallbackUrl = utils.generateDynamicBNCLink(this.branch_key, cleanedData);

	if (options['open_app'] || options['open_app'] === null || typeof options['open_app'] === 'undefined') {
		cleanedData['open_app'] = true;
	}
	cleanedData['append_deeplink_path'] = !!options['append_deeplink_path'];
	cleanedData['deepview_type'] = options['deepview_type'];

	var referringLink = self._referringLink();
	if (referringLink && !options['make_new_link']) {
		cleanedData['link_click_id'] = utils.getClickIdAndSearchStringFromLink(referringLink);
	}

	cleanedData['banner_options'] = options;

	self._deepviewRequestForReplay = goog.bind(this._api, self,
		resources.deepview, cleanedData,
		function(err, data) {
			if (err) {
				// ensures that a partner cannot call branch._deepviewCta() if a user decides to disable tracking
				if (!utils.userPreferences.trackingDisabled) {
					self._deepviewCta = function() {
						self._windowRedirect(fallbackUrl);
					};
				}
				return done(err);
			}

			if (typeof data === 'function') {
				self._deepviewCta = data;
			}

			done(null);
		});

	self._deepviewRequestForReplay();
});

Branch.prototype._windowRedirect = function(url) {
	window.top.location = url;
};

/**
 * @function Branch.deepviewCta
 *
 * @description
 *
 * Perform the branch deepview CTA (call to action) on mobile after `branch.deepview()` call is
 * finished. If the `branch.deepview()` call is finished with no error, when `branch.deepviewCta()` is called,
 * an attempt is made to open the app and deeplink the end user into it; if the end user does not
 * have the app installed, they will be redirected to the platform-appropriate app stores. If on the
 * other hand, `branch.deepview()` returns with an error, `branch.deepviewCta()` will fall back to
 * redirect the user using
 * [Branch dynamic links](https://github.com/BranchMetrics/Deferred-Deep-Linking-Public-API#structuring-a-dynamic-deeplink).
 *
 * If `branch.deepview()` has not been called, an error will arise with a reminder to call
 * `branch.deepview()` first.
 *
 * ##### Usage
 * ```js
 * $('a.deepview-cta').click(branch.deepviewCta); // If you are using jQuery
 *
 * document.getElementById('my-elem').onClick = branch.deepviewCta; // Or generally
 *
 * <a href='...' onclick='branch.deepviewCta()'> // In HTML
 *
 * // We recommend to assign deepviewCta in deepview callback:
 * branch.deepview(data, option, function(err) {
 *     if (err) {
 *         throw err;
 *     }
 *     $('a.deepview-cta').click(branch.deepviewCta);
 * });
 *
 * // You can call this function any time after branch.deepview() is finished by simply:
 * branch.deepviewCta();
 *
 * When debugging, please call branch.deepviewCta() with an error callback like so:
 *
 * branch.deepviewCta(function(err) {
 * 	if (err) {
 * 		console.log(err);
 * 	}
 * });
 * ```
 *
 * ___
 *
 * # Referral system rewarding functionality
 * In a standard referral system, you have 2 parties: the original user and the invitee. Our system
 * is flexible enough to handle rewards for all users for any actions. Here are a couple example
 * scenarios:
 * 1. Reward the original user for taking action (eg. inviting, purchasing, etc)
 * 2. Reward the invitee for installing the app from the original user's referral link
 * 3. Reward the original user when the invitee takes action (eg. give the original user credit when
 *     their the invitee buys something)
 *
 * These reward definitions are created on the dashboard, under the 'Reward Rules' section in the
 * 'Referrals' tab on the dashboard.
 *
 * Warning: For a referral program, you should not use unique awards for custom events and redeem
 * pre-identify call. This can allow users to cheat the system.
 *
 * ___
 *
 */
/*** +TOC_ITEM #deepviewcta &.deepviewCta()& ^ALL ***/
Branch.prototype['deepviewCta'] = wrap(callback_params.CALLBACK_ERR, function(done) {
	if (typeof this._deepviewCta === 'undefined') {
		return utils.userPreferences.trackingDisabled ? done(new Error(utils.messages.trackingDisabled), null) :
		done(new Error(utils.messages.deepviewNotCalled), null);
	}
	if (window.event) {
		if (window.event.preventDefault) {
			window.event.preventDefault();
		}
		else {
			window.event.returnValue = false;
		}
	}
	this._publishEvent('didDeepviewCTA');
	this._deepviewCta();
	done();
});

Branch.prototype['referrals'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done) {
	this._api(resources.referrals, { }, done);
});

/**
 * Removing from documentation
 */
Branch.prototype['getCode'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done, data) {
	data['type'] = 'credit';
	data['creation_source'] = data['creation_source'] || 2; // EventResponse.CREATION_SOURCE_SDK
	this._api(resources.getCode, data, done);
});

/**
 * Removing from documentation
 */
Branch.prototype['validateCode'] = wrap(callback_params.CALLBACK_ERR, function(done, code) {
	this._api(
		resources.validateCode,
		{
			"code": code
		},
		done
	);
});

/**
 * Removing from documentation
 */
Branch.prototype['applyCode'] = wrap(callback_params.CALLBACK_ERR, function(done, code) {
	this._api(
		resources.applyCode,
		{
			"code": code
		}, done
	);
});

/**
 * @function Branch.credits
 * @param {function(?Error,Object=)=} callback - _required_ - returns an object with credit data.
 *
 * **[Formerly `showCredits()`](CHANGELOG.md)**
 *
 * This call will retrieve the entire history of credits and redemptions from the individual user.
 *
 * ##### Usage
 * ```js
 * branch.credits(
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message",
 *     {
 *         'default': 15,
 *         'other bucket': 9
 *     }
 * );
 * ```
 *
 */
/*** +TOC_HEADING &Credit Functions& ^ALL ***/
/*** +TOC_ITEM #creditscallback &.credits()& ^ALL ***/
Branch.prototype['credits'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done) {
	this._api(resources.credits, {
		"branch_key": this.branch_key,
		"identity": this.identity
	}, done);
});

/**
 * @function Branch.creditHistory
 * @param {Object} options - _optional_ - options controlling the returned history
 * @param {function(?Error,Object=)=} callback - _required_ - returns an array with credit history
 * data
 *
 * This call will retrieve the entire history of credits and redemptions from the individual user.
 * Properties available in the `options` object:
 *
 * | Key | Value
 * | --- | ---
 * | bucket | *optional (max 63 characters)* - The bucket from which to retrieve credit transactions.
 * | begin_after_id | *optional* - The credit transaction id of the last item in the previous retrieval. Retrieval will start from the transaction next to it. If none is specified, retrieval starts from the very beginning in the transaction history, depending on the order.
 * | length | *optional* - The number of credit transactions to retrieve. If none is specified, up to 100 credit transactions will be retrieved.
 * | direction | **DEPRECATED** - The order of credit transactions to retrieve. If direction is `1`, retrieval is in least recent first order; If direction is `0`, or if none is specified, retrieval is in most recent first order. No longer supported.
 *
 * ##### Usage
 *
 * ```js
 * branch.creditHistory(
 *      options,
 *      callback(err, data)
 * );
 * ```
 *
 * ##### Example
 *
 * ```js
 * branch.creditHistory(
 *     {
 *       "length":50,
 *       "direction":0, // no longer supported.
 *       "begin_after_id":"123456789012345",
 *       "bucket":"default"
 *     }
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message",
 * [
 *     {
 *         "transaction": {
 *                            "date": "2014-10-14T01:54:40.425Z",
 *                            "id": "50388077461373184",
 *                            "bucket": "default",
 *                            "type": 0,
 *                            "amount": 5
 *                        },
 *         "referrer": "12345678",
 *         "referree": null
 *     },
 *     {
 *         "transaction": {
 *                            "date": "2014-10-14T01:55:09.474Z",
 *                            "id": "50388199301710081",
 *                            "bucket": "default",
 *                            "type": 2,
 *                            "amount": -3
 *                        },
 *         "referrer": null,
 *         "referree": "12345678"
 *     }
 * ]
 * );
 * ```
 *
 * ___
 *
 * ## Credit redemption
 *
 */
/*** +TOC_ITEM #credithistoryoptions-callback &.creditHistory()& ^ALL ***/
Branch.prototype['creditHistory'] = wrap(
	callback_params.CALLBACK_ERR_DATA,
	function(done, options) {
		this._api(resources.creditHistory, options || { }, done);
	}
);

/**
 * @function Branch.redeem
 * @param {number} amount - _required_ - an `amount` (int) of number of credits to redeem
 * @param {string} bucket - _required_ - the name of the `bucket` (string) of which bucket to redeem the credits from
 * @param {function(?Error)=} callback - _optional_ - returns an error if unsuccessful
 *
 * **[Formerly `redeemCredits()`](CHANGELOG.md)**
 *
 * Credits are stored in `buckets`, which you can define as points, currency, whatever makes sense
 * for your app. When you want to redeem credits, call this method with the number of points to be
 * redeemed, and the bucket to redeem them from.
 *
 * ```js
 * branch.redeem(
 *     amount, // Amount of credits to be redeemed
 *     bucket,  // String of bucket name to redeem credits from
 *     callback (err)
 * );
 * ```
 *
 * ##### Example
 *
 * ```js
 * branch.redeem(
 *     5,
 *     "Rubies",
 *     function(err) {
 *         console.log(err);
 *     }
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback("Error message");
 * ```
 * ___
 */
/*** +TOC_ITEM #redeemamount-bucket-callback &.redeem()& ^ALL ***/
Branch.prototype['redeem'] = wrap(callback_params.CALLBACK_ERR, function(done, amount, bucket) {
	this._api(
		resources.redeem,
		{
			"amount": amount,
			"bucket": bucket
		},
		function(err) {
			done(err || null);
		}
	);
});

/** =WEB
 * @function Branch.addListener
 * @param {String} event - _optional_ - Specify which events you would like to listen for. If
 * not defined, the observer will recieve all events.
 * @param {function(String, Object)} listener - _required_ - Listening function that will recieves an
 * event as a string and optional data as an object.
 *
 * The Branch Web SDK includes a simple event listener, that currently only publishes events for
 * Journeys events.
 * Future development will include the ability to subscribe to events related to all other Web
 * SDK functionality.
 *
 * ##### Example
 *
 * ```js
 * var listener = function(event, data) { console.log(event, data); }
 *
 * // Specify an event to listen for
 * branch.addListener('willShowJourney', listener);
 *
 * // Listen for all events
 * branch.addListener(listener);
 * ```
 *
 * #### Available `Journey` Events:
 * - *willShowJourney*: Journey is about to be shown.
 * - *didShowJourney*: Journey's entrance animation has completed and it is being shown to the user.
 * - *willNotShowJourney*: Journey will not be shown and no other events will be emitted.
 * - *didClickJourneyCTA*: User clicked on Journey's CTA button.
 * - *didClickJourneyClose*: User clicked on Journey's close button.
 * - *willCloseJourney*: Journey close animation has started.
 * - *didCloseJourney*: Journey's close animation has completed and it is no longer visible to the user.
 * - *didCallJourneyClose*: Emitted when developer calls `branch.closeJourney()` to dismiss Journey.
 */
/*** +TOC_HEADING &Event Listener& ^WEB ***/
/*** +TOC_ITEM #addlistenerevent-listener &.addListener()& ^WEB ***/
Branch.prototype['addListener'] = function(event, listener) {
	if (typeof event === 'function' && listener === undefined) {
		listener = event;
		event = null;
	}
	if (listener) {
		this._listeners.push({
			listener: listener,
			event: event || null
		});
	}
};

/** =WEB
 * @function Branch.removeListener
 * @param {function(String)} listener - _required_ - Reference to the listening function you
 * would like to remove. *note*: this must be the same reference that was passed to
 * `branch.addListener()`, not an identical clone of the function.
 *
 * Remove the listener from observations, if it is present. Not that this function must be
 * passed a referrence to the _same_ function that was passed to `branch.addListener()`, not
 * just an identical clone of the function.
 *
 */
/*** +TOC_ITEM #removelistenerlistener &.removeListener()& ^WEB ***/
Branch.prototype['removeListener'] = function(listener) {
	if (listener) {
		this._listeners = this._listeners.filter(function(subscription) {
			if (subscription.listener !== listener) {
				return subscription;
			}
		});
	}
};


/** =WEB
 * @function Branch.setBranchViewData
 * @param {Object} data - _required_ - object of all link data, same as Branch.link()
 *
 * This function lets you set the deep link data dynamically for a given mobile web Journey. For
 * example, if you desgin a full page interstitial, and want the deep link data to be custom for each
 * page, you'd need to use this function to dynamically set the deep link params on page load. Then,
 * any Journey loaded on that page will inherit these deep link params.
 *
 * #### Usage
 *
 * ```js
 * branch.setBranchViewData(
 *   data // Data for link, same as Branch.link()
 * );
 * ```
 *
 * ##### Example
 *
 * ```js
 * branch.setBranchViewData({
 *   tags: ['tag1', 'tag2'],
 *   data: {
 *     mydata: 'something',
 *     foo: 'bar',
 *     '$deeplink_path': 'open/item/1234'
 *   }
 * });
 * ```
 */
/*** +TOC_HEADING &Journeys Web To App& ^WEB ***/
/*** +TOC_ITEM #setbranchviewdatadata &.setBranchViewData()& ^WEB ***/
function _setBranchViewData(context, done, data) {
	data = data || {};
	try {
		context._branchViewData = safejson.parse(safejson.stringify(data));
	}
	finally {
		context._branchViewData = context._branchViewData || {};
	}
	done();
}

Branch.prototype['setBranchViewData'] = wrap(callback_params.CALLBACK_ERR, function(done, data) {
	_setBranchViewData.call(null, this, done, data);
});

/**
 * @function Branch.closeJourney
 * @param {function(?Error)=} callback - _optional_
 *
 * Journeys include a close button the user can click, but you may want to close the
 * Journey with a timeout, or via some other user interaction with your web app. In this case,
 * closing the Journey is very simple by calling `Branch.closeJourney()`.
 *
 * ##### Usage
 * ```js
 * branch.closeJourney(function(err) { console.log(err); });
 * ```
 * ___
 *
 */
/*** +TOC_ITEM #closejourneycallback &.closeJourney()& ^WEB ***/
Branch.prototype['closeJourney'] = wrap(callback_params.CALLBACK_ERR, function(done) {
	var self = this;
	self['renderQueue'](function() {
		if (journeys_utils.banner && journeys_utils.isJourneyDisplayed) {
			self._publishEvent('didCallJourneyClose', journeys_utils.journeyLinkData);
			journeys_utils.animateBannerExit(journeys_utils.banner, true);
		}
		else {
			return done('Journey already dismissed.');
		}
	});
	done();
});

Branch.prototype['banner'] = wrap(callback_params.CALLBACK_ERR, function(done, options, data) {
	data = data || {};
	_setBranchViewData.call(null, this, function() {}, data);

	if (typeof options['showAgain'] === 'undefined' &&
			typeof options['forgetHide'] !== 'undefined') {
		options['showAgain'] = options['forgetHide'];
	}
	/** @type {banner_utils.options} */
	var bannerOptions = {
		icon: /** @type {string} */ (utils.cleanBannerText(options['icon']) || ''),
		title: /** @type {string} */ (utils.cleanBannerText(options['title']) || ''),
		description: /** @type {string} */ (utils.cleanBannerText(options['description']) || ''),
		reviewCount: /** @type {number} */ ((
			typeof options['reviewCount'] === 'number' &&
			options['reviewCount'] > 0 // force greater than 0
		) ?
			Math.floor(options['reviewCount']) : // force no decimal
			null),
		rating: /** @type {number} */ ((
			typeof options['rating'] === 'number' &&
			options['rating'] <= 5 &&
			options['rating'] > 0
		) ?
			Math.round(options['rating'] * 2) / 2 : // force increments of .5
			null),
		openAppButtonText: /** @type {string} */ (utils.cleanBannerText(options['openAppButtonText']) || 'View in app'),
		downloadAppButtonText: /** @type {string} */ (utils.cleanBannerText(options['downloadAppButtonText']) || 'Download App'),
		sendLinkText: /** @type {string} */ (utils.cleanBannerText(options['sendLinkText']) || 'Send Link'),
		phonePreviewText: /** @type {string} */ (utils.cleanBannerText(options['phonePreviewText']) || '(999) 999-9999'),
		iframe: /** @type {boolean} */ (typeof options['iframe'] === 'undefined' ?
			true :
			options['iframe']),
		showiOS: /** @type {boolean} */ (typeof options['showiOS'] === 'undefined' ?
			true :
			options['showiOS']),
		showiPad: /** @type {boolean} */ (typeof options['showiPad'] === 'undefined' ?
			true :
			options['showiPad']),
		showAndroid: /** @type {boolean} */ (typeof options['showAndroid'] === 'undefined' ?
			true :
			options['showAndroid']),
		showBlackberry: /** @type {boolean} */ (typeof options['showBlackberry'] === 'undefined' ?
			true :
			options['showBlackberry']),
		showWindowsPhone: /** @type {boolean} */ (typeof options['showWindowsPhone'] === 'undefined' ?
			true :
			options['showWindowsPhone']),
		showKindle: /** @type {boolean} */ (typeof options['showKindle'] === 'undefined' ?
			true :
			options['showKindle']),
		showDesktop: /** @type {boolean} */ (typeof options['showDesktop'] === 'undefined' ?
			true :
			options['showDesktop']),
		disableHide: /** @type {boolean} */ (!!options['disableHide']),
		forgetHide: /** @type {boolean} */ (typeof options['forgetHide'] === 'number' ?
			options['forgetHide'] :
			!!options['forgetHide']),
		respectDNT: /** @type {boolean} */ (typeof options['respectDNT'] === 'undefined' ?
			false :
			options['respectDNT']),
		position: /** @type {string} */ (options['position'] || 'top'),
		customCSS: /** @type {string} */ (options['customCSS'] || ''),
		mobileSticky: /** @type {boolean} */ (typeof options['mobileSticky'] === 'undefined' ?
			false :
			options['mobileSticky']),
		desktopSticky: /** @type {boolean} */ (typeof options['desktopSticky'] === 'undefined' ?
			true :
			options['desktopSticky']),
		buttonBorderColor: /** @type {string} */ (options['buttonBorderColor'] || ''),
		buttonBackgroundColor: /** @type {string} */ (options['buttonBackgroundColor'] || ''),
		buttonFontColor: /** @type {string} */ (options['buttonFontColor'] || ''),
		buttonBorderColorHover: /** @type {string} */ (options['buttonBorderColorHover'] || ''),
		buttonBackgroundColorHover: /** @type {string} */ (options['buttonBackgroundColorHover'] || ''),
		buttonFontColorHover: /** @type {string} */ (options['buttonFontColorHover'] || ''),
		make_new_link: /** @type {boolean} */ (!!options['make_new_link']),
		open_app: /** @type {boolean} */ (!!options['open_app']),
		immediate: /** @type {boolean} */ (!!options['immediate']),
		append_deeplink_path: /** @type {boolean} */ (!!options['append_deeplink_path'])
	};

	if (typeof options['showMobile'] !== 'undefined') {
		bannerOptions.showiOS = options['showMobile'];
		bannerOptions.showAndroid = options['showMobile'];
		bannerOptions.showBlackberry = options['showMobile'];
		bannerOptions.showWindowsPhone = options['showMobile'];
		bannerOptions.showKindle = options['showMobile'];
	}

	data['data'] = utils.merge(utils.getHostedDeepLinkData(), data['data']);

	var self = this;
	self['renderQueue'](function() {
		self.closeBannerPointer = banner(self, bannerOptions, data, self._storage);
	});

	done();
});

Branch.prototype['closeBanner'] = wrap(0, function(done) {
	var self = this;
	self['renderQueue'](function() {
		if (self.closeBannerPointer) {
			self._publishEvent("willCloseBanner");
			self.closeBannerPointer(function() {
				self._publishEvent("didCloseBanner");
			});
		}
	});
	done();
});

/**
 * @function Branch.autoAppIndex
 *
 * @param {Object} data - _optional_ - Information on how to build your App Indexing tags for your webpage
 * @param {function(?Error)=} callback - _optional_ - Returns an error string if unsuccessful
 *
 * This function generates and inserts Firebase App Indexing tags between the `<head></head>` section of your webpage.
 * Once inserted, these tags will help Google index and surface content from your App in Google Search.
 *
 * Listed below are optional parameters which can be used to build your page's App Indexing Tags:
 *
 * | Key | Value
 * | --- | ---
 * | "androidPackageName" | Android App's package name
 * | "androidURL" | A custom scheme for your Android App such as: `example/home/cupertino/12345` where `example` is the App's URI scheme and `home/cupertino/12345` routes to unique content in the App
 * | "iosAppId" | iTunes App Store ID for your iOS App
 * | "iosURL" | A custom scheme for your iOS App such as: `example/home/cupertino/12345`
 * | "data" | Any additional deep link data that you would like to pass to your App
 *
 * Resultant Firebase App Indexing tags will have the following format:
 *```
 * <link rel="alternate" href="android-app://{androidPackageName}/{androidURL}?{branch_tracking_params_and_additional_deep_link_data}"/>
 * <link rel="alternate" href="ios-app://{iosAppId}/{iosURL}?{branch_tracking_params_and_additional_deep_link_data}"/>
 *```
 * Note: If optional parameters above are not specified, Branch will try to build Firebase App Indexing tags using your page's App Links tags.
 * Alternatively, if optional parameters are specified but Firebase App Indexing tags already exist on your webpage then Branch tracking params will be appended to the end of these tags and ignore what is passed into `Branch.autoAppIndex()`.
 *
 * Analytics related to Google's attempts to index your App's content via this method can be found from Source Analytics in Dashboard where `channel` is `Firebase App Indexing` and `feature` is `Auto App Indexing`.
 *
 * ##### Usage
 * ```js
 * branch.autoAppIndex(
 *     data,
 *     callback (err)
 * );
 * ```
 * ##### Example
 * ```js
 * branch.autoAppIndex({
 *     iosAppId:'123456789',
 *     iosURL:'example/home/cupertino/12345',
 *     androidPackageName:'com.somecompany.app',
 *     androidURL:'example/home/cupertino/12345',
 *     data:{"walkScore":65, "transitScore":50}
 * }, function(err) { console.log(err); });
 * ```
 * ___
 */
/*** +TOC_HEADING &Firebase App Indexing& ^ALL ***/
/*** +TOC_ITEM #autoappindexdata-callback &.autoAppIndex()& ^ALL ***/
Branch.prototype['autoAppIndex'] = wrap(callback_params.CALLBACK_ERR, function(done, options) {
	var self = this;
	options = options || {};

	appindexing.updateAppIndexingTagsIfPresent();

	appindexing.options = options;

	if (!appindexing.state['androidAppIndexingTagsPresent']) {
		appindexing.insertAppIndexingTagsFromConfig('android');
		if (!appindexing.state['androidDetailsComplete']) {
			appindexing.populateConfigFromAppLinksTags('android');
		}
	}

	if (!appindexing.state['iosAppIndexingTagsPresent']) {
		appindexing.insertAppIndexingTagsFromConfig('ios');
		if (!appindexing.state['iosDetailsComplete']) {
			appindexing.populateConfigFromAppLinksTags('ios');
		}
	}

	if (!appindexing.state['iosDetailsComplete'] && !appindexing.state['androidDetailsComplete']) {
		done('Firebase App Indexing tags were not added to your webpage. Please check your configuration.');
	}
	else {
		done(null);
	}
});

/**
 * @function Branch.trackCommerceEvent
 * @param {String} event - _required_ - Name of the commerce event to be tracked. We currently support 'purchase' events
 * @param {Object} commerce_data - _required_ - Data that describes the commerce event
 * @param {Object} metadata - _optional_ - metadata you may want add to the event
 * @param {function(?Error)=} callback - _optional_ - Returns an error if unsuccessful
 *
 * Sends a user commerce event to the server
 *
 * Use commerce events to track when a user purchases an item in your online store,
 * makes an in-app purchase, or buys a subscription. The commerce events are tracked in
 * the Branch dashboard along with your other events so you can judge the effectiveness of
 * campaigns and other analytics.
 *
 * ##### Usage
 *
 * ```js
 * branch.trackCommerceEvent(
 *     event,
 *     commerce_data,
 *     metadata,
 *     callback (err)
 * );
 * ```
 *
 * ##### Example
 *
 * ```js
 * var commerce_data = {
 *     "revenue": 50.0,
 *     "currency": "USD",
 *     "transaction_id": "foo-transaction-id",
 *     "shipping": 0.0,
 *     "tax": 5.0,
 *     "affiliation": "foo-affiliation",
 *     "products": [
 *          { "sku": "foo-sku-1", "name": "foo-item-1", "price": 45.00, "quantity": 1, "brand": "foo-brand",
 *            "category": "Electronics", "variant": "foo-variant-1"},
 *          { "sku": "foo-sku-2", "price": 2.50, "quantity": 2}
 *      ],
 * };
 *
 * var metadata =  { "foo": "bar" };
 *
 * branch.trackCommerceEvent('purchase', commerce_data, metadata, function(err) {
 *     if(err) {
 *          throw err;
 *     }
 * });
 * ```
 * ___
 */
/*** +TOC_HEADING &Revenue Analytics& ^WEB ***/
/*** +TOC_ITEM #trackcommerceeventevent-commerce_data-metadata-callback &.trackCommerceEvent()& ^WEB ***/
Branch.prototype['trackCommerceEvent'] = wrap(callback_params.CALLBACK_ERR, function(done, event, commerce_data, metadata) {
	var self = this;
	self['renderQueue'](function() {

		var validationError = utils.validateCommerceEventParams(event, commerce_data);
		if (validationError) {
			return done(new Error(validationError));
		}

		self._api(resources.commerceEvent, {
			"event": event,
			"metadata": utils.merge({
				"url": document.URL,
				"user_agent": navigator.userAgent,
				"language": navigator.language
			}, metadata || {}),
			"initial_referrer": utils.getInitialReferrer(self._referringLink()),
			"commerce_data": commerce_data
		}, function(err, data) {
			done(err || null);
		});
	});
	done();
});

/**
 * @function Branch.disableTracking
 * @param {Boolean} disableTracking - _optional_ - true disables tracking and false re-enables tracking.
 *
 * ##### Notes:
 * - disableTracking() without a parameter is a shorthand for disableTracking(true).
 * - If a call to disableTracking(false) is made, the WebSDK will re-initialize. Additionally, if tracking_disabled: true is passed
 *   as an option to init(), it will be removed during the reinitialization process.
 *
 * Allows User to Remain Private
 *
 * This will prevent any Branch requests from being sent across the network, except for the case of deep linking.
 * If someone clicks a Branch link, but has expressed not to be tracked, we will return deep linking data back to the
 * client but without tracking information.
 *
 * In do-not-track mode, you will still be able to create links and display Journeys however, they will not have identifiable
 * information associated to them. You can change this behavior at any time, by calling the aforementioned function.
 * The do-not-track mode state is persistent: it is saved for the user across browser sessions for the web site.
 * ___
 */
/*** +TOC_HEADING &User Privacy& ^WEB ***/
/*** +TOC_ITEM #disabletrackingdisabletracking &.disableTracking()& ^WEB ***/
Branch.prototype['disableTracking'] = wrap(callback_params.CALLBACK_ERR, function(done, disableTracking) {
	if (disableTracking === false || disableTracking === "false") {
		utils.userPreferences.trackingDisabled = false;
		utils.userPreferences.allowErrorsInCallback = false;
		if (this.branch_key && this.init_options) {
			if (this.init_options['tracking_disabled'] === true) {
				delete this.init_options['tracking_disabled'];
			}
			this['init'](this.branch_key, this.init_options);
		}
	}
	else if (disableTracking === undefined || disableTracking === true || disableTracking === "true") {
		utils.cleanApplicationAndSessionStorage(this);
		utils.userPreferences.trackingDisabled = true;
		utils.userPreferences.allowErrorsInCallback = true;
		this['closeBanner']();
		this['closeJourney']();
		// Branch will not re-initialize
	}
	done();
});
