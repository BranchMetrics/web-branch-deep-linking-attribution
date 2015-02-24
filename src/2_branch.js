/***
 * This file provides the main Branch function.
 */

goog.provide('Branch');
goog.require('utils');
goog.require('resources');
goog.require('api');
goog.require('banner');

var default_branch;

/***
 * @class Branch
 * @constructor
 */
Branch = function() {
	if (!(this instanceof Branch)) {
		if (!default_branch) { default_branch = new Branch(); }
		return default_branch;
	}
	this.initialized = false;
};

Branch.prototype.pushQueue = utils.pushQueue;
Branch.prototype.nextQueue = utils.nextQueue;

/***
 * @param {resources.resource} resource
 * @param {Object.<string, *>} data
 * @param {function(?new:Error,*)|null} callback
 */
Branch.prototype._api = function(resource, data, callback) {
	if (((resource.params && resource.params['app_id']) || (resource.queryPart && resource.queryPart['app_id'])) && this.app_id) { data['app_id'] = this.app_id; }
	if (((resource.params && resource.params['session_id']) || (resource.queryPart && resource.queryPart['session_id'])) && this.session_id) { data['session_id'] = this.session_id; }
	if (((resource.params && resource.params['identity_id']) || (resource.queryPart && resource.queryPart['identity_id'])) && this.identity_id) { data['identity_id'] = this.identity_id; }
	return api(resource, data, callback);
};

/**
 * @function Branch.init
 * @param {string} app_id - __required__ - Your Branch [app key](http://dashboard.branch.io/settings).
 * @param {function|null} callback - __optional__ - callback to read the session data.
 *
 * Adding the Branch script to your page automatically creates a window.branch
 * object with all the external methods described below. All calls made to
 * Branch methods are stored in a queue, so even if the SDK is not fully
 * instantiated, calls made to it will be queued in the order they were
 * originally called.
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
 *     app_id,
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *      "Error message",
 *      {
 *           data:               {},      // If the user was referred from a link, and the link has associated data, the data is passed in here.
 *           referring_identity: '12345', // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
 *           has_app:            true,    // Does the user have the app installed already?
 *           identity:       'BranchUser' // Unique string that identifies the user
 *      }
 * );
 * ```
 *
 * **Note:** `Branch.init` must be called prior to calling any other Branch functions.
 * ___
 */
Branch.prototype['init'] = function(app_id, callback) {
	callback = callback|| function() { };
	this.pushQueue(function(app_id, callback) {
		if (this.initialized) {
			this.nextQueue();
			return callback(utils.message(utils.messages.existingInit));
		}

		this.app_id = app_id;
		var self = this, sessionData = utils.readStore();

		var setBranchValues = function(data) {
			self.session_id = data['session_id'];
			self.identity_id = data['identity_id'];
			self.sessionLink = data["link"];
			self.initialized = true;
		};

		if (sessionData  && sessionData['session_id']) {
			setBranchValues(sessionData);
			this.nextQueue();
			callback(null, utils.whiteListSessionData(sessionData));
		}
		else {
			this._api(resources._r, {}, function(err, browser_fingerprint_id) {
				self._api(resources.open, {
					"is_referrable": 1,
					"browser_fingerprint_id": browser_fingerprint_id
				}, function(err, data) {
					setBranchValues(data);
					utils.store(data);
					self.nextQueue();
					callback(err, utils.whiteListSessionData(data));
				});
			});
		}
	}, this, [ app_id, callback ]);
};

/**
 * @function Branch.data
 * @param {function|null} callback - __optional__ - callback to read the session data.
 *
 * Returns the same session information and any referring data, as
 * `Branch.init`, but does not require the `app_id`. This is meant to be called
 * after `Branch.init` has been called if you need the session information at a
 * later point.
 * If the Branch session has already been initialized, the callback will return
 * immediately, otherwise, it will return once Branch has been initialized.
 * ___
 */
Branch.prototype["data"] = function(callback) {
	callback = callback || function() { };
	var self = this;
	this.pushQueue(function(callback) {
		self.nextQueue();
		callback(null, utils.whiteListSessionData(utils.readStore()));
	}, this, [ callback ]);
};

/**
 * @function Branch.setIdentity
 * @param {string} identity - __required__ - a string uniquely identifying the user – often a user ID or email address.
 * @param {function|null} callback - __optional__ - callback that returns the user's Branch identity id and unique link.
 *
 * **Formerly `identify()` (depreciated). **See [CHANGELOG](CHANGELOG.md)**
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
 *           identity_id:        '12345', // Server-generated ID of the user identity, stored in `sessionStorage`.
 *           link:               'url',   // New link to use (replaces old stored link), stored in `sessionStorage`.
 *           referring_data:     {},      // Returns the initial referring data for this identity, if exists.
 *           referring_identity: '12345'  // Returns the initial referring identity for this identity, if exists.
 *      }
 * );
 * ```
 * ___
 */
Branch.prototype['setIdentity'] = function(identity, callback) {
	callback = callback || function() { };
	var self = this;
	this.pushQueue(function(identity, callback) {
		if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
		this._api(resources.profile, { "identity": identity }, function(err, data) {
			self.nextQueue();
			callback(err, data);
		});
	}, this, [ identity, callback ]);
};

/**
 * @function Branch.logout
 * @param {function|null} callback - __optional__
 *
 * Logs out the current session, replaces session IDs and identity IDs.
 *
 * ##### Usage
 * ```js
 * branch.logout(
 *     callback(err)
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
 */
Branch.prototype['logout'] = function(callback) {
	callback = callback || function() { };
	var self = this;
	this.pushQueue(function(callback) {
		if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
		this._api(resources.logout, {}, function(err) {
			self.nextQueue();
			callback(err);
		});
	}, this, [ callback ]);
};

/*** NOT USED
 * This closes the active session, removing any relevant session account info stored in `sessionStorage`.
 *
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * ##### Usage
 * ```js
 * branch.close(
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Callback
 * ```js
 * callback("Error message");
 * ```
 *
 * ---
 */
 /*
Branch.prototype['close'] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	var self = this;
	this._api(resources.close, {}, function(err, data) {
		sessionStorage.clear();
		self.initialized = false;
		callback(err, data);
	});
};
*/

/**
 * @function Branch.track
 * @param {String} event - __required__ - name of the event to be tracked.
 * @param {Object|null} metadata - __optional__ - object of event metadata.
 * @param {function|null} callback - __optional__
 *
 * This function allows you to track any event with supporting metadata. Use the events you track to create funnels in the Branch dashboard.
 * The `metadata` parameter is a formatted JSON object that can contain any data and has limitless hierarchy.
 *
 * ##### Usage
 * ```js
 * branch.event(
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
Branch.prototype['track'] = function(event, metadata, callback) {
	callback = callback || function() { };
	var self = this;
	this.pushQueue(function(event, metadata, callback) {
		if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
		if (typeof metadata == 'function') {
			callback = metadata;
			metadata = {};
		}

		this._api(resources.event, {
			"event": event,
			"metadata": utils.merge({
				"url": document.URL,
				"user_agent": navigator.userAgent,
				"language": navigator.language
			}, {})
		}, function(err) {
			self.nextQueue();
			callback(err);
		});
	}, this, [ event, metadata, callback ]);
};

/**
 * @function Branch.link
 * @param {Object} linkData - __required__ - link data and metadata.
 * @param {function|null} callback - __optional__ - returns a string of the Branch deep linking URL.
 *
 * **Formerly `createLink()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * Creates and returns a deep linking URL.  The `data` parameter can include an object with optional data you would like to store, including Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).
 *
 * #### Usage
 * ```
 * branch.link(
 *     metadata,
 *     callback (err, data)
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
 *     type: 1,
 *     data: {
 *         mydata: {
 *             foo: 'bar'
 *         },
 *         '$desktop_url': 'http://myappwebsite.com',
 *         '$ios_url': 'http://myappwebsite.com/ios',
 *         '$ipad_url': 'http://myappwebsite.com/ipad',
 *         '$android_url': 'http://myappwebsite.com/android',
 *         '$og_app_id': '12345',
 *         '$og_title': 'My App',
 *         '$og_description': 'My app\'s description.',
 *         '$og_image_url': 'http://myappwebsite.com/image.png'
 *     }
 * }, function(err, data) {
 *     console.log(err, data);
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
 * ___
 *
 * ## Sharing links via SMS
 *
 */
Branch.prototype['link'] = function(obj, callback) {
	callback = callback || function() { };
	var self = this;
	this.pushQueue(function(obj, callback) {
		if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
		obj['source'] = 'web-sdk';
		if (obj['data']['$desktop_url'] !== undefined) {
			obj['data']['$desktop_url'] = obj['data']['$desktop_url'].replace(/#r:[a-z0-9-_]+$/i, '');
		}
		obj['data'] = JSON.stringify(obj['data']);
		this._api(resources.link, obj, function(err, data) {
			if (typeof callback == 'function') {
				self.nextQueue();
				callback(err, data['url']);
			}
		});
	}, this, [ obj, callback ]);
};

/***
 * Is there any reason we need to make this an external function?
 *
 * @param {String} url - __required__ - branch deep linking URL to register link click on.
 * @param {function|null} callback - __optional__ - returns an error if unsuccessful.
 */
Branch.prototype['linkClick'] = function(url, callback) {
	callback = callback || function() { };
	var self = this;
	this.pushQueue(function(url, callback) {
		if (!this.initialized) {
			this.nextQueue();
			return callback(utils.message(utils.messages.nonInit));
		}
		if (url) {
			this._api(resources.linkClick, {
				"link_url": url.replace('https://bnc.lt/', ''),
				"click": "click"
			}, function(err, data) {
				self.nextQueue();
				utils.storeKeyValue("click_id", data["click_id"]);
				if (err || data) { callback(err, data); }
			});
		}
	}, this, [ url, callback ]);
};

/**
 * @function Branch.sendSMS
 * @param {String} phone, __required__ phone number to send SMS to
 * @param {Object} linkData - __required__ - object of link data
 * @param {Object|null} options - __optional__ - options: make_new_link, which forces the creation of a new link even if one already exists
 * @param {function|null} callback - __optional__ - Returns an error if unsuccessful
 *
 * **Formerly `SMSLink()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * A robust function to give your users the ability to share links via SMS. If the user navigated to this page via a Branch link, `sendSMS` will send that same link. Otherwise, it will create a new link with the data provided in the `metadata` argument. `sendSMS` also  registers a click event with the `channel` pre-filled with `'sms'` before sending an sms to the provided `phone` parameter. This way the entire link click event is recorded starting with the user sending an sms. **Supports international SMS**.
 *
 * #### Usage
 * ```js
 * branch.sendSMS(
 *     phone,
 *     linkData,
 *     options (optional),
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Example
 * ```js
 * branch.sendSMS({
 *     phone: '9999999999',
 *     {
 *         tags: ['tag1', 'tag2'],
 *         channel: 'facebook',
 *         feature: 'dashboard',
 *         stage: 'new user',
 *         type: 1,
 *         data: {
 *             mydata: {
 *                 foo: 'bar'
 *             },
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
 * });
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback("Error message");
 * ```
 * ___
 *
 * # Referral system rewarding functionality
 * In a standard referral system, you have 2 parties: the original user and the invitee. Our system is flexible enough to handle rewards for all users for any actions. Here are a couple example scenarios:
 * 1. Reward the original user for taking action (eg. inviting, purchasing, etc)
 * 2. Reward the invitee for installing the app from the original user's referral link
 * 3. Reward the original user when the invitee takes action (eg. give the original user credit when their the invitee buys something)
 *
 * These reward definitions are created on the dashboard, under the 'Reward Rules' section in the 'Referrals' tab on the dashboard.
 *
 * Warning: For a referral program, you should not use unique awards for custom events and redeem pre-identify call. This can allow users to cheat the system.
 *
 * ## Retrieve referrals list
 *
 */
Branch.prototype['sendSMS'] = function(phone, obj, options, callback) {
	if (typeof options == 'function') {
		callback = options;
	}
	callback = callback || function() {};
	this.pushQueue(function(phone, obj, options, callback) {
		options = options || {};
		options["make_new_link"] = options["make_new_link"] || false;

		if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

		if (utils.readKeyValue("click_id") && !options["make_new_link"]) {
			this.sendSMSExisting(phone, callback);
		}
		else {
			this.sendSMSNew(phone, obj, callback);
		}
	}, this, [ phone, obj, options, callback ]);
};

/*** <--- Not in docs
 *
 * Forces the creation of a new link and stores it in `sessionStorage`, then registers a click event with the `channel` pre-filled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.
 *
 * @param {Object} metadata - __required__ Object of all link data, requires phone number as `phone`
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * #### Usage
 * ```js
 * branch.sendSMSNew(
 *     metadata, // Metadata must include phone number as `phone`
 *     callback (err, data)
 * );
 * ```
 *
 * ___
 */
Branch.prototype['sendSMSNew'] = function(phone, obj, callback) {
	callback = callback || function() { };
	var self = this;
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	if (obj["channel"] != "app banner") { obj["channel"] = 'sms'; }
	var self = this;
	this.link(obj, function(err, url) {
		if (err) { return callback(err); }
		self.linkClick(url, function(err) {
			if (err) { return callback(err); }
			self.sendSMSExisting(phone, function(err) {
				self.nextQueue();
				callback(err);
			});
		});
	});
};

/*** <--- Not in docs
 * Registers a click event on the already created Branch link stored in `sessionStorage` with the `channel` pre-filled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.
 *
 * @param {String} phone - __required__ String of phone number the link should be sent to
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * #### Usage
 * ```js
 * branch.sendSMSExisting(
 *     metadata, // Metadata must include phone number as `phone`
 *     callback (err, data)
 * );
 * ```
 * ___
 */
Branch.prototype['sendSMSExisting'] = function(phone, callback) {
	callback = callback || function() {};
	var self = this;
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	this._api(resources.SMSLinkSend, {
		"link_url": utils.readStore()["click_id"],
		"phone": phone
	}, function(err) {
		self.nextQueue();
		callback(err);
	});
};

/**
 * @function Branch.referrals
 * @param {function} callback - __required__ - returns an object with referral data.
 *
 * **Formerly `showReferrals()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
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
 * ## Credit history
 *
 */
Branch.prototype["referrals"] = function(callback) {
	callback = callback || function() {};
	var self = this;
	this.pushQueue(function(callback) {
		if (!this.initialized) {
			this.nextQueue();
			return callback(utils.message(utils.messages.nonInit));
		}
		this._api(resources.referrals, {}, function(err, data) {
			self.nextQueue();
			callback(err, data);
		});
	}, this, [ callback ]);
};

/**
 * @function Branch.credits
 * @param {function} callback - __required__ - returns an object with credit data.
 *
 * **Formerly `showCredits()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
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
 * ## Credit redemption
 *
 */
Branch.prototype["credits"] = function(callback) {
	callback = callback || function() { };
	var self = this;
	this.pushQueue(function(callback) {
		if (!this.initialized) {
			this.nextQueue();
			return callback(utils.message(utils.messages.nonInit));
		}
		this._api(resources.credits, {}, function(err, data) {
			self.nextQueue();
			callback(err, data);
		});
	}, this, [ callback ]);
};

/**
 * @function Branch.redeem
 * @param {Int} amount - __required__ - an `amount` (int) of number of credits to redeem
 * @param {String} bucket - __required__ - the name of the `bucket` (string) of which bucket to redeem the credits from
 * @param {function|null} callback - __optional__ - returns an error if unsuccessful
 *
 * **Formerly `redeemCredits()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * Credits are stored in `buckets`, which you can define as points, currency, whatever makes sense for your app. When you want to redeem credits, call this method with the number of points to be redeemed, and the bucket to redeem them from.
 *
 * ```js
 * branch.redeem(
 *     amount, // amount of credits to be redeemed
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
 *     function(data) {
 *         console.log(data);
 *     }
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback("Error message");
 * ```
 * ___
 *
 * # Smart App Sharing Banner
 *
 * The Branch Web SDK has a built in sharing banner, that automatically displays a device specific banner for desktop, iOS, and Android. If the banner is shown on a desktop, a form for sending yourself the download link via SMS is shown.
 * Otherwise, a button is shown that either says an "open" app phrase, or a "download" app phrase, based on whether or not the user has the app installed. Both of these phrases can be specified in the parameters when calling the banner function.
 * **Styling**: The banner automatically styles itself based on if it is being shown on the desktop, iOS, or Android.
 *
 */
Branch.prototype["redeem"] = function(amount, bucket, callback) {
	callback = callback || function() { };
	var self = this;
	this.pushQueue(function(amount, bucket, callback) {
		if (!this.initialized) {
			this.nextQueue();
			return callback(utils.message(utils.messages.nonInit));
		}
		this._api(resources.redeem, { "amount": amount, "bucket": bucket }, function(err, data) {
			self.nextQueue();
			callback(err, data);
		});
	}, this, [ amount, bucket, callback ]);
};

/**
 * @function Branch.banner
 * @param {Object} options - __required__ - object of all the options to setup the banner
 * @param {Object} linkData - __required__ - object of all link data, same as Branch.link()
 *
 * **Formerly `appBanner()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * Display a smart banner directing the user to your app through a Branch referral link.  The `linkData` param is the exact same as in `branch.link()`.
 *
 * ![iOS Smart Banner](docs/images/ios-web-sdk-banner-1.0.0.png)
 * ##### iOS Smart Banner
 * ___
 * ![Android Smart Banner](docs/images/android-web-sdk-banner-1.0.0.png)
 * ##### Android Smart Banner
 * ___
 * ![Desktop Smart Banner](docs/images/desktop-web-sdk-banner-1.0.0.png)
 * ##### Desktop Smart Banner
 * ___
 *
 * #### Usage
 *
 * ```js
 * branch.banner(
 *     options, // Banner options: icon, title, description, openAppButtonText, downloadAppButtonText, showMobile, showDesktop
 *     linkData // Data for link, same as Branch.link()
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
 *     openAppButtonText: 'Open',         // Text to show on button if the user has the app installed
 *     downloadAppButtonText: 'Download', // Text to show on button if the user does not have the app installed
 *     showMobile: true,                  // Should the banner be shown on mobile devices?
 *     showDesktop: true                  // Should the banner be shown on mobile devices?
 * }, {
 *     phone: '9999999999',
 *     tags: ['tag1', 'tag2'],
 *     feature: 'dashboard',
 *     stage: 'new user',
 *     type: 1,
 *     data: {
 *         mydata: {
 *             foo: 'bar'
 *         },
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
 */
Branch.prototype["banner"] = function(options, linkData) {
	options.showMobile = (options.showMobile === undefined) ? true : options.showMobile;
	options.showDesktop = (options.showDesktop === undefined) ? true : options.showDesktop;
	if (!document.getElementById('branch-banner') && !utils.readKeyValue("hideBanner")) {
		banner.smartBannerMarkup(options);
		banner.smartBannerStyles(options);
		banner.appendSmartBannerActions(this, options, linkData);
		banner.triggerBannerAnimation(options);
	}
};
