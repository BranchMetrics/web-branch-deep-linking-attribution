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

/*globals CORDOVA_BUILD, TITANIUM_BUILD, WEB_BUILD, Ti, BranchStorage, cordova, require */

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
				if (err) {
					throw err;
				}
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
					return done(new Error(utils.message(utils.messages.initFailed)), null);
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

	var storageMethods = [ ];
	if (CORDOVA_BUILD) {
		storageMethods = [ 'local' ];
	}
	else if (TITANIUM_BUILD) {
		storageMethods = [ 'titanium' ];
	}
	else if (WEB_BUILD) {
		if (utils.mobileUserAgent()) {
			storageMethods = [ 'local', 'permcookie' ];
		}
		else {
			storageMethods = [ 'session', 'cookie' ];
		}
	}
	storageMethods.push('pojo');

	this._storage = new BranchStorage(storageMethods);

	this._server = new Server();

	var sdk = 'web';

	/** @type {Array<utils.listener>} */
	this._listeners = [ ];

	if (CORDOVA_BUILD) {
		sdk = 'cordova';
	}
	if (TITANIUM_BUILD) {
		sdk = 'titanium';
	}
	this.sdk = sdk + config.version;

	if (CORDOVA_BUILD || TITANIUM_BUILD) {
		this.debug = false;
	}

	this.init_state = init_states.NO_INIT;
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

	if (CORDOVA_BUILD || TITANIUM_BUILD) {
		if (((resource.params && resource.params['device_fingerprint_id']) ||
				(resource.queryPart && resource.queryPart['device_fingerprint_id'])) &&
				this.device_fingerprint_id) {
			obj['device_fingerprint_id'] = this.device_fingerprint_id;
		}
	}

	if (WEB_BUILD) {
		if (((resource.params && resource.params['browser_fingerprint_id']) ||
				(resource.queryPart && resource.queryPart['browser_fingerprint_id'])) &&
				this.browser_fingerprint_id) {
			obj['browser_fingerprint_id'] = this.browser_fingerprint_id;
		}
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
 */
Branch.prototype._publishEvent = function(event) {
	for (var i = 0; i < this._listeners.length; i++) {
		if (!this._listeners[i].event || this._listeners[i].event === event) {
			this._listeners[i].listener(event);
		}
	}
};

if (CORDOVA_BUILD || TITANIUM_BUILD) {
	/** =CORDOVA
	 * @function Branch.setDebug
	 * @param {boolean} debug - _required_ - Set the SDK debug flag.
	 *
	 * Setting the SDK debug flag will generate a new device ID each time the app is installed
	 * instead of possibly using the same device id.  This is useful when testing.
	 *
	 * This needs to be set before the Branch.init call!!!
	 *
	 * ___
	 *
	 */
	Branch.prototype['setDebug'] = function(debug) {
		this.debug = debug;
	};
}

/**
 * @function Branch.init
 * @param {string} branch_key - _required_ - Your Branch [live key](http://dashboard.branch.io/settings), or (depreciated) your app id.
 * @param {{isReferrable:?boolean}=} options - _optional_ - { *isReferrable*: _Is this a referrable session_ }.
 * @param {function(?Error, utils.sessionData=)=} callback - _optional_ - callback to read the
 * session data.
 *
 * THE "isReferrable" OPTION IS ONLY USED IN THE CORDOVA/PHONEGAP PLUGIN
 * AND THE TITANIUM MODULE
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

		var self = this;

		self.init_state = init_states.INIT_PENDING;

		if (utils.isKey(branch_key)) {
			self.branch_key = branch_key;
		}
		else {
			self.app_id = branch_key;
		}

		options = (options && typeof options === 'function') ?
			{
				"isReferrable": null
			} :
			options;

		if (TITANIUM_BUILD && Ti.Platform.osname === 'android') {
			self.keepAlive = true;
		}

		var setBranchValues = function(data) {
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
				data['click_id'] = utils.clickIdFromLink(data['referring_link']);
			}

			if (CORDOVA_BUILD || TITANIUM_BUILD) {
				self.device_fingerprint_id = data['device_fingerprint_id'];
				if (data['link_click_id']) {
					self.link_click_id = data['link_click_id'];
				}
			}
			if (WEB_BUILD) {
				self.browser_fingerprint_id = data['browser_fingerprint_id'];
			}
			return data;
		};

		var isReferrable = (options &&
				typeof options.isReferrable !== 'undefined' &&
				options.isReferrable !== null) ?
			options.isReferrable :
			null;
		var sessionData = session.get(self._storage);
		var url = (options && typeof options.url !== 'undefined' && options.url !== null) ?
			options.url :
			null;
		var link_identifier = WEB_BUILD ?
			(utils.getParamValue('_branch_match_id') || utils.hashValue('r')) :
			(url ? utils.getParamValue(url) : null);
		var freshInstall = !sessionData || !sessionData['identity_id'];

		function currentDesktopUrlMatchesSession() {
			var currentDesktopUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
			var sessionDesktopUrl = null;
			try {
				sessionDesktopUrl = JSON.parse(sessionData['data'])['$desktop_url'];
			}
			finally {
				return sessionDesktopUrl === currentDesktopUrl;
			}
		}

		var checkHasApp = function(sessionData, cb) {
			if (WEB_BUILD) {
				self._api(
					resources._r,
					{ "sdk": config.version },
					function(err, browser_fingerprint_id) {
						if (browser_fingerprint_id) {
							currentSessionData['browser_fingerprint_id'] = browser_fingerprint_id;
						}
					}
				);
			}
			var currentSessionData = sessionData || session.get(self._storage) || {};
			self._api(
				resources.hasApp,
				{ "browser_fingerprint_id": currentSessionData['browser_fingerprint_id'] },
				function(err, has_app) {
					if (has_app && !currentSessionData['has_app']) {
						currentSessionData['has_app'] = true;
						session.update(self._storage, currentSessionData);
						self._publishEvent('didDownloadApp');
					}
					if (cb) {
						cb(err, currentSessionData);
					}
				}
			);
		};

		var finishInit = function(err, data) {
			if (data) {
				data = setBranchValues(data);
				session.set(self._storage, data, freshInstall);

				self.init_state = init_states.INIT_SUCCEEDED;
				data['data_parsed'] = data['data'] ? goog.json.parse(data['data']) : null;
			}
			if (err) {
				self.init_state = init_states.INIT_FAILED;
			}

			// Keep android titanium from calling close
			if (self.keepAlive) {
				setTimeout(
					function() {
						self.keepAlive = false;
					},
					2000
				);
			}
			done(err, data && utils.whiteListSessionData(data));
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
				document.addEventListener(changeEvent, function() {
					if (!document[hidden]) {
						checkHasApp(null, null);
					}
				}, false);
			}
		};

		if (WEB_BUILD &&
				sessionData &&
				sessionData['session_id'] &&
				currentDesktopUrlMatchesSession() &&
				(utils.processReferringLink(link_identifier) === sessionData['referring_link'] ||
				link_identifier === sessionData['click_id'])) {
			attachVisibilityEvent();
			checkHasApp(sessionData, finishInit);
			return;
		}

		if (WEB_BUILD) {

			self._api(
				resources._r,
				{ "sdk": config.version },
				function(err, browser_fingerprint_id) {
					if (err) {
						return finishInit(err, null);
					}
					self._api(
						resources.open,
						{
							"link_identifier": link_identifier,
							"is_referrable": 1,
							"browser_fingerprint_id": browser_fingerprint_id
						},
						function(err, data) {
							if (data && link_identifier) {
								data['click_id'] = link_identifier;
							}
							attachVisibilityEvent();
							finishInit(err, data);
						}
					);
				}
			);
			return;
		}

		var apiCordovaTitanium = function(data) {
			if (!freshInstall) {
				data['identity_id'] = sessionData['identity_id'];
				data['device_fingerprint_id'] = sessionData['device_fingerprint_id'];
			}
			self._api(
				freshInstall ? resources.install : resources.open,
				data,
				function(err, data) {
					finishInit(err, data);
				}
			);
		};

		if (CORDOVA_BUILD) {
			var args = [ ];
			if (isReferrable !== null) {
				args.push(isReferrable ? 1 : 0);
			}
			if (freshInstall) {
				// 'debug' is the first argument to getInstallData, but is not used in getOpenData
				args.unshift(self.debug);
			}
			cordova.require('cordova/exec')(
				apiCordovaTitanium,
				function() {
					done('Error getting device data!');
				},
				'BranchDevice',
				freshInstall ? 'getInstallData' : 'getOpenData',
				args
			);
		}
		else if (TITANIUM_BUILD) {
			var data = { };
			var branchTitaniumSDK = require('io.branch.sdk');
			if (link_identifier) {
				data['link_identifier'] = link_identifier;
			}
			if (freshInstall) {
				data = branchTitaniumSDK.getInstallData(
					self.debug,
					(isReferrable === null) ? -1 : (isReferrable ? 1 : 0)
				);
			}
			else {
				data = branchTitaniumSDK.getOpenData(
					(isReferrable === null) ? -1 : (isReferrable ? 1 : 0)
				);
			}
			apiCordovaTitanium(data);
		}
	},
	true
);

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
				goog.json.parse(data['referring_data']) :
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


if (CORDOVA_BUILD || TITANIUM_BUILD) {
	/** =CORDOVA
	 * @function Branch.close
	 * @param {function(?Error)=} callback - _optional_
	 *
	 * Close the current session.
	 *
	 * ##### Usage
	 * ```js
	 * branch.close(
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
	 * ## Tracking events
	 *
	 */
	/*** +TOC_ITEM #closecallback &.close()& ^CORDOVA ***/
	Branch.prototype['close'] = wrap(callback_params.CALLBACK_ERR, function(done) {
		var self = this;
		if (this.keepAlive) {
			return done(null);
		}
		this._api(resources.close, { }, function(err, data) {
			delete self.session_id;
			delete self.sessionLink;
			self.init_state = init_states.NO_INIT;
			self._storage.clear();
			done(null);
		});
	});
}

/**
 * @function Branch.track
 * @param {string} event - _required_ - name of the event to be tracked.
 * @param {Object=} metadata - _optional_ - object of event metadata.
 * @param {function(?Error)=} callback - _optional_
 *
 * This function allows you to track any event with supporting metadata. Use the events you track to
 * create funnels in the Branch dashboard.  The `metadata` parameter is a formatted JSON object that
 * can contain any data and has limitless hierarchy.
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
 *
 * # Deeplinking Methods
 *
 * ## Creating a deep linking link
 *
 */
/*** +TOC_HEADING &Event Tracking& ^ALL ***/
/*** +TOC_ITEM #trackevent-metadata-callback &.track()& ^ALL ***/
Branch.prototype['track'] = wrap(callback_params.CALLBACK_ERR, function(done, event, metadata) {
	if (!metadata) {
		metadata = { };
	}

	if (!TITANIUM_BUILD) {
		this._api(resources.event, {
			"event": event,
			"metadata": utils.merge({
				"url": document.URL,
				"user_agent": navigator.userAgent,
				"language": navigator.language
			}, metadata || {})
		}, done);
	}
	else {
		this._api(resources.event, {
			"event": event,
			"metadata": metadata || {}
		}, done);
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
	this._api(resources.link, utils.cleanLinkData(data), function(err, data) {
		done(err, data && data['url']);
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
 * If this behaivior is not desired, set `make_new_link: true` in the `options` object argument
 * of `sendSMS`, and `sendSMS` will always make a new link.
 *
 * **Supports international SMS**.
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
			sendSMS(referringLink.substring(
				referringLink.lastIndexOf('/') + 1, referringLink.length
			));
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
					self._api(
						resources.linkClick,
						{
							"link_url": utils.extractDeeplinkPath(url),
							"click": "click"
						},
						function(err, data) {
							if (err) {
								return done(err);
							}
							self._storage.set('click_id', data['click_id']);
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
 *             '$deepview_path': 'item_id=12345'
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

	var fallbackUrl = config.link_service_endpoint + '/a/' + self.branch_key;
	var first = true;
	var encodeLinkProperty = function(key, data) {
		return encodeURIComponent(utils.base64encode(goog.json.serialize(data[key])));
	};

	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			if (key !== 'data') {
				if (first) {
					fallbackUrl += '?';
					first = false;
				}
				else {
					fallbackUrl += '&';
				}
				fallbackUrl += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
			}
		}
	}

	var cleanedData = utils.cleanLinkData(data);

	if (options['open_app'] || options['open_app'] === null || typeof options['open_app'] === 'undefined') {
		cleanedData['open_app'] = true;
	}

	var referringLink = self._referringLink();
	if (referringLink && !options['make_new_link']) {
		cleanedData['link_click_id'] = referringLink.substring(
			referringLink.lastIndexOf('/') + 1, referringLink.length
		);
	}

	this._api(resources.deepview, cleanedData, function(err, data) {
		if (err) {
			self._deepviewCta = function() {
				self._windowRedirect(fallbackUrl);
			};
			return done(err);
		}

		if (typeof data === 'function') {
			self._deepviewCta = data;
		}

		done(null);
	});
});

Branch.prototype._windowRedirect = function(url) {
	window.location = url;
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
 *     ${'a.deepview-cta').click(branch.deepviewCta);
 * });
 *
 * // You can call this function any time after branch.deepview() is finished by simply:
 * branch.deepviewCta();
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
 * ## Retrieve referrals list
 *
 */
/*** +TOC_ITEM #deepviewcta &.deepviewCta()& ^ALL ***/
Branch.prototype['deepviewCta'] = wrap(callback_params.NO_CALLBACK, function(done) {
	if (typeof this._deepviewCta === 'undefined') {
		throw new Error('Cannot call Deepview CTA, please call branch.deepview() first.');
	}
	if (window.event) {
		if (window.event.preventDefault) {
			window.event.preventDefault();
		}
		else {
			window.event.returnValue = false;
		}
	}
	this._deepviewCta();
	done();
});

/**
 * @function Branch.referrals
 * @param {function(?Error,Object=)=} callback - _required_ - returns an object with referral data.
 *
 * **[Formerly `showReferrals()`](CHANGELOG.md)**
 *
 * Retrieves a complete summary of the referrals the current user has made.
 *
 * ##### Usage
 * ```js
 * branch.referrals(
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message",
 *     {
 *         'install': {
 *              total: 5,
 *              unique: 2
 *         },
 *         'open': {
 *              total: 4,
 *              unique: 3
 *         },
 *         'buy': {
 *             total: 7,
 *             unique: 3
 *         }
 *     }
 * );
 * ```
 *
 * ## Referral Codes
 *
 */
/*** +TOC_HEADING &Referrals and Credits& ^ALL ***/
/*** +TOC_ITEM #referralscallback &.referrals()& ^ALL ***/
Branch.prototype['referrals'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done) {
	this._api(resources.referrals, { }, done);
});

/**
 * @function Branch.getCode
 * @param {Object} options - _required_ - contins options for referral code creation.
 * @param {function(?Error)=} callback - _optional_ - returns an error if unsuccessful
 *
 * Create a referral code using the supplied parameters.  The code can be given to other users to
 * enter.  Applying the code will add credits to the referrer, referree or both.
 * The `options` object can containt the following properties:
 *
 * | Key | Value
 * | --- | ---
 * | amount | *reqruied* - An integer specifying the number of credits added when the code is applied.
 * | calculation_type | *required* - An integer of 1 for unlimited uses, or 0 for one use.
 * | location | *required* - An integer that determines who gets the credits:  0 for the referree, 2 for the referring user or 3 for both.
 * | bucket | *optional* - The bucket to apply the credits to.  Defaults to "default".
 * | prefix | *optional* - A string to be prepended to the code.
 * | expiration | *optional* - A date string that if present, determines the date on which the code expires.
 *
 * ##### Usage
 *
 * branch.getCode(
 *     options,
 *     callback(err,data)
 * );
 *
 * ##### Example
 *
 * ```js
 * branch.getCode(
 *     {
 *       "amount":10,
 *       "bucket":"party",
 *       "calculation_type":1,
 *       "location":2
 *     },
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *      "Error message",
 *      {
 *        "referral_code":"AB12CD"
 *      }
 * );
 * ```
 * ___
 *
 */
/*** +TOC_ITEM #getcodeoptions-callback &.getCode()& ^ALL ***/
Branch.prototype['getCode'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done, data) {
	data['type'] = 'credit';
	data['creation_source'] = data['creation_source'] || 2; // EventResponse.CREATION_SOURCE_SDK
	this._api(resources.getCode, data, done);
});

/**
 * @function Branch.validateCode
 * @param {string} code - _required_ - the code string to validate.
 * @param {function(?Error)=} callback - _optional_ - returns an error if unsuccessful
 *
 * Validate a referral code before using.
 *
 * ##### Usage
 *
 * ```js
 * branch.validateCode(
 *     code, // The code to validate
 *     callback (err)
 * );
 * ```
 *
 * ##### Example
 *
 * ```js
 * branch.validateCode(
 *     "AB12CD",
 *     function(err) {
 *         if (err) {
 *             console.log(err);
 *         }
 *         else {
 *             console.log("Code is valid");
 *         }
 *     }
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message",
 *     callback(err)
 * );
 * ```
 * ___
 *
 */
/*** +TOC_ITEM #validatecodecode-callback &.validateCode()& ^ALL ***/
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
 * @function Branch.applyCode
 * @param {string} code - _required_ - the code string to apply.
 * @param {function(?Error)=} callback - _optional_ - returns an error if unsuccessful
 *
 * Apply a referral code.
 *
 * ##### Usage
 *
 * ```js
 * branch.applyCode(
 *     code, // The code to apply
 *     callback (err)
 * );
 * ```
 *
 * ##### Example
 *
 * ```js
 * branch.applyCode(
 *     "AB12CD",
 *     function(err) {
 *         if (err) {
 *             console.log(err);
 *         }
 *         else {
 *             console.log("Code applied");
 *         }
 *     }
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message",
 *     callback(err)
 * );
 * ```
 * ___
 *
 * ## Credit Functions
 *
 */
/*** +TOC_ITEM #applycodecode-callback &.applyCode()& ^ALL ***/
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
/*** +TOC_ITEM #creditscallback &.credits()& ^ALL ***/
Branch.prototype['credits'] = wrap(callback_params.CALLBACK_ERR_DATA, function(done) {
	this._api(resources.credits, { }, done);
});

/**
 * @function Branch.creditHistory
 * @param {Object} options - _optional_ - options controlling the returned history.
 * @param {function(?Error,Object=)=} callback - _required_ - returns an array with credit history
 * data.
 *
 * This call will retrieve the entire history of credits and redemptions from the individual user.
 * Properties available in the `options` object:
 *
 * | Key | Value
 * | --- | ---
 * | bucket | *optional (max 63 characters)* - The bucket from which to retrieve credit transactions.
 * | begin_after_id | *optional* - The credit transaction id of the last item in the previous retrieval. Retrieval will start from the transaction next to it. If none is specified, retrieval starts from the very beginning in the transaction history, depending on the order.
 * | length | *optional* - The number of credit transactions to retrieve. If none is specified, up to 100 credit transactions will be retrieved.
 * | direction | *optional* - The order of credit transactions to retrieve. If direction is `1`, retrieval is in least recent first order; If direction is `0`, or if none is specified, retrieval is in most recent first order.
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
 *       "direction":0,
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

if (WEB_BUILD) {
	/** =WEB
	 * @function Branch.addListener
	 * @param {String} event - _optional_ - Specify which events you would like to listen for. If
	 * not defined, the observer will recieve all events.
	 * @param {function(String)} listener - _required_ - Listeneing function that will recieves an
	 * event as a string.
	 *
	 * The Branch Web SDK includes a simple event listener, that currently only publishes events for
	 * `Branch.banner()` events.
	 * Future development will include the ability to subscribe to events related to all other Web
	 * SDK functionality.
	 *
	 * ##### Example
	 *
	 * ```js
	 * var listener = function(event) { console.log(event); }
	 *
	 * // Specify an event to listen for
	 * branch.addListener('willShowBanner', listener);
	 *
	 * // Listen for all events
	 * branch.addListener(listener);
	 * ```
	 *
	 * #### Available `Branch.banner()` Events:
	 * - *willShowBanner*: `banner()` called, and the smart banner is about to be shown.
	 * - *willNotShowBanner*: `banner()` called, and the smart banner will not be shown. No more
	 *      events will be emitted.
	 * - *didShowBanner*: Smart banner animation started and was is being shown to the user.
	 * - *willCloseBanner*: `closeBanner()` called, and the smart banner will close.
	 * - *didCloseBanner*: Smart banner close animation started, and is closing.
	 * - *willSendBannerSMS*: Phone number in correct format, and will attempt to send SMS.
	 * - *sendBannerSMSError*: `sendSMS()` error returned.
	 * - *didSendBannerSMS*: SMS successfully sent.
	 * - *didDownloadApp*: User installed app, and banner text updated.
	 *
	 */
	/*** +TOC_HEADING &Event Listener& ^WEB ***/
	/*** +TOC_ITEM #addlistenerevent-listener &.addListener()& ^WEB ***/
	Branch.prototype['addListener'] = function(event, listener) {
		if (typeof event === 'function' && listener === undefined) {
			listener = event;
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
	 * @function Branch.banner
	 * @param {Object} options - _required_ - object of all the options to setup the banner
	 * @param {Object} data - _required_ - object of all link data, same as Branch.link()
	 *
	 * **[Formerly `appBanner()`](CHANGELOG.md)**
	 *
	 * Display a smart banner directing the user to your app through a Branch referral link.  The
	 * `data` param is the exact same as in `branch.link()`.
	 *
	 * *Be sure to checkout the [Smart Banner Guide](SMART_BANNER_GUIDE.md) for a full explanation
	 * of everything you can do!*
	 *
	 * | iOS Smart Banner | Android Smart Banner | Desktop Smart Banner |
	 * |------------------|----------------------|----------------------|
	 * | ![iOS Smart Banner](docs/images/ios-web-sdk-banner-1.0.0.png) | ![Android Smart Banner](docs/images/android-web-sdk-banner-1.0.0.png) | ![Desktop Smart Banner](docs/images/desktop-web-sdk-banner-1.0.0.png) |
	 *
	 * #### Usage
	 *
	 * ```js
	 * branch.banner(
	 *     options, // Banner options: See example for all available options
	 *     data // Data for link, same as Branch.link()
	 * );
	 * ```
	 *
	 * ##### Example
	 *
	 * ```js
	 * branch.banner({
	 *     icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
	 *     title: 'Branch Demo App',
	 *     description: 'The Branch demo app!',
	 *     rating: 5,                              // Displays a star rating out of 5. Supports half stars through increments of .5
	 *     reviewCount: 1500,                      // Amount of reviews your app has received next to the star rating
	 *     theme: 'light',                         // Overrides the default color theme of the banner. Possible values 'light' or 'dark'.
	 *     openAppButtonText: 'Open',              // Text to show on button if the user has the app installed
	 *     downloadAppButtonText: 'Download',      // Text to show on button if the user does not have the app installed
	 *     sendLinkText: 'Send Link',              // Text to show on desktop button to allow users to text themselves the app
	 *     phonePreviewText: '+44 9999-9999',      // The default phone placeholder is a US format number, localize the placeholder number with a custom placeholder with this option
	 *     buttonBorderColor: null,                // Overrides the default button border color
	 *     buttonBackgroundColor: null,            // Overrides the default button background color
	 *     buttonFontColor: null,                  // Overrides the default button font color
	 *     buttonBorderColorHover: null,           // Overrides the default button border color during mouse over
	 *     buttonBackgroundColorHover: null,       // Overrides the default button background color during mouse over
	 *     buttonFontColorHover: null,             // Overrides the default button font color during mouse over
	 *     showiOS: true,                          // Should the banner be shown on iOS devices (both iPhones and iPads)?
	 *     showiPad: true,                         // Should the banner be shown on iPads (this overrides showiOS)?
	 *     showAndroid: true,                      // Should the banner be shown on Android devices?
	 *     showBlackberry: true,                   // Should the banner be shown on Blackberry devices?
	 *     showWindowsPhone: true,                 // Should the banner be shown on Windows Phone devices?
	 *     showKindle: true,                       // Should the banner be shown on Kindle devices?
	 *     showDesktop: true,                      // Should the banner be shown on desktop devices?
	 *     iframe: true,                           // Show banner in an iframe, recomended to isolate Branch banner CSS
	 *     disableHide: false,                     // Should the user have the ability to hide the banner? (show's X on left side)
	 *     forgetHide: false,                      // Should we show the banner after the user closes it? Can be set to true, or an integer to show again after X days
	 *     position: 'top',                        // Sets the position of the banner, options are: 'top' or 'bottom', and the default is 'top'
	 *     mobileSticky: false,                    // Determines whether the mobile banner will be set `position: fixed;` (sticky) or `position: absolute;`, defaults to false *this property only applies when the banner position is 'top'
	 *     desktopSticky: true,                    // Determines whether the desktop banner will be set `position: fixed;` (sticky) or `position: absolute;`, defaults to true *this property only applies when the banner position is 'top'
	 *     customCSS: '.title { color: #F00; }',   // Add your own custom styles to the banner that load last, and are gauranteed to take precedence, even if you leave the banner in an iframe
	 *     make_new_link: false,                   // Should the banner create a new link, even if a link already exists?
	 *     open_app: false,                        // Should the banner try to open the app passively (without the user actively clicking) on load?
	 *
	 * }, {
	 *     tags: ['tag1', 'tag2'],
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
	 * });
	 * ```
	 * ___
	 *
	 * ### closeBanner()
	 *
	 * #### Closing the App Banner Programmatically
	 *
	 * The App Banner includes a close button the user can click, but you may want to close the
	 * banner with a timeout, or via some other user interaction with your web app. In this case,
	 * closing the banner is very simple by calling `Branch.closeBanner()`.
	 *
	 * ##### Usage
	 * ```js
	 * branch.closeBanner();
	 * ```
	 *
	 */
	/*** +TOC_HEADING &Smart Banner& ^WEB ***/
	/*** +TOC_ITEM #banneroptions-data &.banner()& ^WEB ***/
	Branch.prototype['banner'] = wrap(callback_params.NO_CALLBACK, function(done, options, data) {
		if (typeof options['showAgain'] === 'undefined' &&
				typeof options['forgetHide'] !== 'undefined') {
			options['showAgain'] = options['forgetHide'];
		}
		var bannerOptions = {
			icon: options['icon'] || '',
			title: options['title'] || '',
			description: options['description'] || '',
			reviewCount: (
				typeof options['reviewCount'] === 'number' &&
				options['reviewCount'] > 0 // force greater than 0
			) ?
				Math.floor(options['reviewCount']) : // force no decimal
				null,
			rating: (
				typeof options['rating'] === 'number' &&
				options['rating'] <= 5 &&
				options['rating'] > 0
			) ?
				Math.round(options['rating'] * 2) / 2 : // force increments of .5
				null,
			openAppButtonText: options['openAppButtonText'] || 'View in app',
			downloadAppButtonText: options['downloadAppButtonText'] || 'Download App',
			sendLinkText: options['sendLinkText'] || 'Send Link',
			phonePreviewText: options['phonePreviewText'] || '(999) 999-9999',
			iframe: typeof options['iframe'] === 'undefined' ?
				true :
				options['iframe'],
			showiOS: typeof options['showiOS'] === 'undefined' ?
				true :
				options['showiOS'],
			showiPad: typeof options['showiPad'] === 'undefined' ?
				true :
				options['showiPad'],
			showAndroid: typeof options['showAndroid'] === 'undefined' ?
				true :
				options['showAndroid'],
			showBlackberry: typeof options['showBlackberry'] === 'undefined' ?
				true :
				options['showBlackberry'],
			showWindowsPhone: typeof options['showWindowsPhone'] === 'undefined' ?
				true :
				options['showWindowsPhone'],
			showKindle: typeof options['showKindle'] === 'undefined' ?
				true :
				options['showKindle'],
			showDesktop: typeof options['showDesktop'] === 'undefined' ?
				true :
				options['showDesktop'],
			disableHide: !!options['disableHide'],
			forgetHide: typeof options['forgetHide'] === 'number' ?
				options['forgetHide'] :
				!!options['forgetHide'],
			position: options['position'] || 'top',
			customCSS: options['customCSS'] || '',
			mobileSticky: typeof options['mobileSticky'] === 'undefined' ?
				false :
				options['mobileSticky'],
			desktopSticky: typeof options['desktopSticky'] === 'undefined' ?
				true :
				options['desktopSticky'],
			theme: (
				typeof options['theme'] === 'string' &&
				utils.bannerThemes.indexOf(options['theme']) > -1
			) ?
				options['theme'] :
				utils.bannerThemes[0],
			buttonBorderColor: options['buttonBorderColor'] || '',
			buttonBackgroundColor: options['buttonBackgroundColor'] || '',
			buttonFontColor: options['buttonFontColor'] || '',
			buttonBorderColorHover: options['buttonBorderColorHover'] || '',
			buttonBackgroundColorHover: options['buttonBackgroundColorHover'] || '',
			buttonFontColorHover: options['buttonFontColorHover'] || '',
			make_new_link: !!options['make_new_link'],
			open_app: !!options['open_app']
		};

		if (typeof options['showMobile'] !== 'undefined') {
			bannerOptions.showiOS = options['showMobile'];
			bannerOptions.showAndroid = options['showMobile'];
			bannerOptions.showBlackberry = options['showMobile'];
			bannerOptions.showWindowsPhone = options['showMobile'];
			bannerOptions.showKindle = options['showMobile'];
		}

		this.closeBannerPointer = banner(this, bannerOptions, data, this._storage);
		done();
	});

	Branch.prototype['closeBanner'] = wrap(0, function(done) {
		if (this.closeBannerPointer) {
			var self = this;
			this._publishEvent("willCloseBanner");
			this.closeBannerPointer(function() {
				self._publishEvent("didCloseBanner");
			});
		}
		done();
	});
}
