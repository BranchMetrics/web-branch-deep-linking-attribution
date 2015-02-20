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
 */
Branch = function() {
	if (!(this instanceof Branch)) {
		if (!default_branch) { default_branch = new Branch(); }
		return default_branch;
	}
	this.initialized = false;
};

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
 * @param {number} app_id - **Required** Found in your Branch dashboard
 * @param {function|null} callback - Callback function that returns the session data
 *
 * Adding the Branch script to your page automatically creates a window.branch object with all the external methods described below. All calls made to Branch methods are stored in a queue, so even if the SDK is not fully instantiated, calls made to it will be queued in the order they were originally called.
 * The init function on the Branch object initiates the Branch session and creates a new user session, if it doesn't already exist, in `sessionStorage`. 
 * **Useful Tip**: The init function returns a data object where you can read the link the user was referred by.
 *
 * ##### Usage
 * ```js
 * Branch.init(
 *     app_id,
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Callback
 * ```js
 * callback(
 *      error: "Error message",
 *      {
 *           data:               {},      // If the user was referred from a link, and the link has associated data, the data is passed in here.
 *           referring_identity: '12345', // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
 *      });
 * ```
 *
 * **Note:** `Branch.init` must be called prior to calling any other Branch functions.
 * ___
 */
Branch.prototype['init'] = function(app_id, callback) {
	callback = callback || function() {};
	if (this.initialized) { return callback(utils.message(utils.messages.existingInit)); }
	this.initialized = true;
	this.app_id = app_id;
	var self = this, sessionData = utils.readStore();

	var cleanseReturnData = function(data) {
		// change to light list
		// document what these are
		// return data, referring_identity, identity, has_app
		delete data['session_id'];
		delete data["device_fingerprint"];
		delete data["device_fingerprint_id"];
		delete data["browser_fingerprint_id"];
		return data;
	};

	if (sessionData && !sessionData['session_id']) { sessionData = null; }
	if (sessionData) {
		this.session_id = sessionData['session_id'];
		this.identity_id = sessionData['identity_id'];
		this.sessionLink = sessionData["link"];
	}
	if (sessionData && !utils.hashValue('r')) {
		callback(null, cleanseReturnData(sessionData));
	}
	else {
		this._api(resources._r, {}, function(err, browser_fingerprint_id) {
			self._api(resources.open, {
				"link_identifier": utils.hashValue('r'),
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, function(err, data) {
				self.session_id = data['session_id'];
				self.identity_id = data['identity_id'];
				self.sessionLink = data["link"];
				utils.store(data);
				callback(err, cleanseReturnData(data));
			});
		});
	}
};

/**
 * @function Branch.setIdentity
 * @param {string} identity - **Required** A string uniquely identifying the user
 * @param {function|null} callback - Callback that returns the user's Branch identity id and unique link
 *
 * **Formerly `identify()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * Sets the identity of a user and returns the data. To use this function, pas a unique string that identifies the user - this could be an email address, UUID, Facebook ID, etc.
 *
 * ##### Usage
 * ```js
 * Branch.setIdentity(
 *     identity,
 *     callback(err, data)
 * )
 * ```
 * 
 * ##### Callback 
 * ```js
 * callback(
 *      error: "Error message",
 *      {
 *           identity_id:        '12345', // Server-generated ID of the user identity, stored in `sessionStorage`.
 *           link:               'url',   // New link to use (replaces old stored link), stored in `sessionStorage`.
 *           referring_data:     {},      // Returns the initial referring data for this identity, if exists.
 *           referring_identity: '12345'  // Returns the initial referring identity for this identity, if exists.
 *      });
 * ```
 * ___
 */
Branch.prototype['setIdentity'] = function(identity, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	this._api(resources.profile, { "identity": identity }, function(err, data) {
		callback(err, data);
	});
};

/**
 * @function Branch.logout
 * @param {function|null} callback - Returns id's of the session and user identity, and the link
 *
 * Logs out the current session, replaces session IDs and identity IDs.
 *
 * ##### Usage
 * ```js
 * Branch.logout(
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Callback
 * ```js
 * callback(
 *      error: "Error message",
 *      {
 *           session_id:  '12345', // Server-generated ID of the session, stored in `sessionStorage`
 *           identity_id: '12345', // Server-generated ID of the user identity, stored in `sessionStorage`
 *           link:        'url',   // Server-generated link identity, for synchronous link creation, stored in `sessionStorage`
 *      });
 * ```
 * ___
 *
 * ## Tracking events
 */
Branch.prototype['logout'] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	this._api(resources.logout, {}, function(err) {
		callback(err);
	});
};

/*** NOT USED
 * This closes the active session, removing any relevant session account info stored in `sessionStorage`.
 *
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * ##### Usage
 * ```js
 * Branch.close(
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Callback
 * ```js
 * callback( error: "Error message" );
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
 * @param {String} event - **Required** The name of the event to be tracked
 * @param {Object|null} metadata - Object of event metadata
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * This function allows you to track any event with supporting metadata. Use the events you track to create funnels in the Branch dashboard.
 * The `metadata` parameter is a formatted JSON object that can contain any data and has limitless hierarchy.
 *
 * ##### Usage
 * ```js
 * Branch.event(
 *     event,
 *     metadata,
 *     callback(err)
 * )
 * ```
 *
 * ##### Callback
 * ```js
 * callback( error: "Error message" );
 * ```
 * ___
 *
 * # Deeplinking Methods
 *
 * ## Creating a deep linking link
 *
 */
Branch.prototype['track'] = function(event, metadata, callback) {
	callback = callback || function() {};
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
		callback(err);
	});
};

/**
 * @function Branch.link
 * @param {Object|null} metadata - Object of link metadata
 * @param {function|null} callback - Returns a string of the Branch deep linking URL
 *
 * **Formerly `createLink()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * Creates and returns a deep linking URL.  The `data` parameter can include an object with optional data you would like to store, including Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).
 *
 * #### Usage
 * ```
 * Branch.link(
 *     metadata,
 *     callback(err, data)
 * )
 * ```
 *
 * #### Example
 * ```js
 * branch.link({
 *     tags: ['tag1', 'tag2'],
 *     channel: 'facebook',
 *     feature: 'dashboard',
 *     stage: 'new user',
 *     type: 1,
 *     data: {
 *         mydata: {
 *	           foo: 'bar'
 *         },
 *     '$desktop_url': 'http://myappwebsite.com',
 *     '$ios_url': 'http://myappwebsite.com/ios',
 *     '$ipad_url': 'http://myappwebsite.com/ipad',
 *     '$android_url': 'http://myappwebsite.com/android',
 *     '$og_app_id': '12345',
 *     '$og_title': 'My App',
 *     '$og_description': 'My app\'s description.',
 *     '$og_image_url': 'http://myappwebsite.com/image.png'
 *		}
 * }, function(err, data) {
 *     console.log(err || data);
 * });
 * ```
 *
 * ##### Callback
 * ```js
 * callback(
 *      error: "Error message",
 *      'https://bnc.lt/l/3HZMytU-BW' // Branch deep linking URL
 *      );
 * ```
 * ___
 *
 * ## Sharing links via SMS
 *
 */
Branch.prototype['link'] = function(obj, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	obj['source'] = 'web-sdk';
	if (obj['data']['$desktop_url'] !== undefined) {
		obj['data']['$desktop_url'] = obj['data']['$desktop_url'].replace(/#r:[a-z0-9-_]+$/i, '');
	}
	obj['data'] = JSON.stringify(obj['data']);
	this._api(resources.link, obj, function(err, data) {
		if (typeof callback == 'function') {
			callback(err, data['url']);
		}
	});
};

/***
 * Is there any reason we need to make this an external function?
 *
 * @param {String} url - **Required** Branch deep linking URL to register link click on
 * @param {function|null} callback - Returns an error if unsuccessful
 */
Branch.prototype['linkClick'] = function(url, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	if (url) {
		this._api(resources.linkClick, {
			"link_url": url.replace('https://bnc.lt/', ''),
			"click": "click"
		}, function(err, data) {
			utils.storeKeyValue("click_id", data["click_id"]);
			if (err || data) { callback(err, data); }
		});
	}
};

/**
 * @function Branch.sendSMS
 * @param {String} phone - **Required** Phone number to txt
 * @param {Object} linkData - **Required** Object of all link data
 * @param {Object|null} options - Options, currently only includes: make_new_link, which forces the creation of a new link even if one already exists
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * **Formerly `SMSLink()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * A robust function to give your users the ability to share links via SMS. If the user navigated to this page via a Branch link, `sendSMS` will send that same link. Otherwise, it will create a new link with the data provided in the `metadata` argument. `sendSMS` also  registers a click event with the `channel` pre-filled with `'sms'` before sending an sms to the provided `phone` parameter. This way the entire link click event is recorded starting with the user sending an sms. **Supports international SMS**.
 *
 * #### Usage
 * ```js
 * Branch.sendSMS(
 *     metadata,            // Metadata must include phone number as `phone`
 *     callback(err, data),
 *     make_new_link    // Default: false
 * )
 * ```
 *
 * ##### Example
 * ```js
 * branch.sendSMS({
 *     phone: '9999999999',
 *     {
 *          tags: ['tag1', 'tag2'],
 *          channel: 'facebook',
 *          feature: 'dashboard',
 *          stage: 'new user',
 *          type: 1,
 *          data: {
 *              mydata: {
 *                  foo: 'bar'
 *              },
 *          '$desktop_url': 'http://myappwebsite.com',
 *          '$ios_url': 'http://myappwebsite.com/ios',
 *          '$ipad_url': 'http://myappwebsite.com/ipad',
 *          '$android_url': 'http://myappwebsite.com/android',
 *          '$og_app_id': '12345',
 *          '$og_title': 'My App',
 *          '$og_description': 'My app\'s description.',
 *          '$og_image_url': 'http://myappwebsite.com/image.png'
 *          }
 *     },
 *     { make_new_link: true}, // Default: false. If set to true, sendSMS will generate a new link even if one already exists
 *     function(err) { console.log(err); }
 * });
 * ```
 *
 * ##### Callback
 * ```js
 * callback( error: "Error message" );
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
	callback = callback || function() {};
	options["make_new_link"] = options["make_new_link"] || false;

	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	if (utils.readKeyValue("click_id") && !options["make_new_link"]) {
		this.sendSMSExisting(phone, callback);
	}
	else {
		this.sendSMSNew(phone, obj, callback);
	}
};

/*** <--- Not in docs
 *
 * Forces the creation of a new link and stores it in `sessionStorage`, then registers a click event with the `channel` pre-filled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.
 *
 * @param {Object} metadata - **Required** Object of all link data, requires phone number as `phone`
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * #### Usage
 * ```js
 * Branch.sendSMSNew(
 *     metadata,    // Metadata must include phone number as `phone`
 *     callback(err, data)
 * )
 * ```
 *
 * ___
 */
Branch.prototype['sendSMSNew'] = function(phone, obj, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	if(obj["channel"] != "app banner") { obj["channel"] = 'sms'; }
	var self = this;
	this.link(obj, function(err, url) {
		if (err) { return callback(err); }
		self.linkClick(url, function(err) {
			if (err) { return callback(err); }
			self.sendSMSExisting(phone, function(err) {
				callback(err);
			});
		});
	});
};

/*** <--- Not in docs
 * Registers a click event on the already created Branch link stored in `sessionStorage` with the `channel` pre-filled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.
 *
 * @param {String} phone - **Required** String of phone number the link should be sent to
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * #### Usage
 * ```js
 * Branch.sendSMSExisting(
 *     metadata,     // Metadata must include phone number as `phone`
 *     callback(err, data)
 * )
 * ```
 * ___
 */
Branch.prototype['sendSMSExisting'] = function(phone, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	this._api(resources.SMSLinkSend, {
		"link_url": utils.readStore()["click_id"],
		"phone": phone
	}, function(err) {
		callback(err);
	});
};

/**
 * @function Branch.referrals
 * @param {function|null} callback - Returns an error or object with referral data on success
 *
 * **Formerly `showReferrals()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * Retrieves a complete summary of the referrals the current user has made.
 *
 * ##### Usage
 * ```js
 * Branch.referrals(
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Callback
 * ```js
 * callback(
 *      error: "Error message",
 *     {
 *          'install': {
 *               total: 5,
 *               unique: 2
 *          },
 *          'open': {
 *               total: 4,
 *               unique: 3
 *          },
 *         'buy': {
 *              total: 7,
 *              unique: 3
 *          }
 *     });
 * ```
 *
 * ## Credit history
 *
 */
Branch.prototype["referrals"] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	this._api(resources.referrals, {}, function(err, data) {
		callback(err, data);
	});
};

/**
 * @function Branch.credits
 * @param {function|null} callback - Returns an error or object with credit data on success
 *
 * **Formerly `showCredits()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * This call will retrieve the entire history of credits and redemptions from the individual user.
 *
 * ##### Usage
 * ```js
 * Branch.credits(
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Callback
 * ```js
 * callback(
 *      error: "Error message",
 *      {
 *           'default': 15,
 *           'other bucket': 9
 *      });
 * ```
 *
 * ## Credit redemption
 *
 */
Branch.prototype["credits"] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	this._api(resources.credits, {}, function(err, data) {
		callback(err, data);
	});
};

/**
 * @function Branch.redeem
 * @param {Int} amount - **Required** An `amount` (int) of number of credits to redeem
 * @param {String} bucket - **Required** A name of the `bucket` (string) of which bucket to redeem the credits from
 * @param {function|null} callback - Returns an error if unsuccessful
 *
 * **Formerly `redeemCredits()` (depreciated).** See [CHANGELOG](CHANGELOG.md)
 *
 * Credits are stored in `buckets`, which you can define as points, currency, whatever makes sense for your app. When you want to redeem credits, call this method with the number of points to be redeemed, and the bucket to redeem them from.
 *
 * ```js
 * Branch.redeem(
 *     amount, // amount of credits to be redeemed
 *     bucket,  // String of bucket name to redeem credits from
 *     callback(err)
 * )
 * ```
 *
 * ##### Example
 *
 * ```js
 * branch.redeem(
 *     5,
 *     "Rubies",
 *     function(data){
 *          console.log(data)
 * });
 * ```
 *
 * ##### Callback
 * ```js
 * callback( error: "Error message" );
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
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	this._api(resources.redeem, { "amount": amount, "bucket": bucket }, function(err, data) {
		callback(err, data);
	});
};

/**
 * @function Branch.banner
 * @param {Object} options - **Required** Object of all the options to setup the banner
 * @param {Object} linkData - **Required** Object of all link data, same as Branch.link()
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
 * Branch.banner(
 *     options, 	// Banner options: icon, title, description, openAppButtonText, downloadAppButtonText, showMobile, showDesktop
 *     linkData     // Data for link, same as Branch.link()
 * )
 * ```
 *
 * ##### Example
 *
 * ```js
 * branch.banner({
 *     icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
 *     title: 'Branch Demo App',
 *     description: 'The Branch demo app!',
 *     openAppButtonText: 'Open',             // Text to show on button if the user has the app installed
 *     downloadAppButtonText: 'Download',     // Text to show on button if the user does not have the app installed
 *     showMobile: true,                      // Should the banner be shown on mobile devices?
 *     showDesktop: true                      // Should the banner be shown on mobile devices?
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
 *     '$desktop_url': 'http://myappwebsite.com',
 *     '$ios_url': 'http://myappwebsite.com/ios',
 *     '$ipad_url': 'http://myappwebsite.com/ipad',
 *     '$android_url': 'http://myappwebsite.com/android',
 *     '$og_app_id': '12345',
 *     '$og_title': 'My App',
 *     '$og_description': 'My app\'s description.',
 *     '$og_image_url': 'http://myappwebsite.com/image.png'
 *     }
 *
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
