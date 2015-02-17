/***
 * This file provides the main Branch function.
 */

goog.provide('Branch');
goog.require('utils');
goog.require('resources');
goog.require('api');
goog.require('elements');

/***
 *
 * @constructor
 */
Branch = function() {
	this.initialized = false;
};

/*** <--- TIP: 3 stars means JSDoc ignores it
 * @param {resources.resource} resource
 * @param {Object.<string, *>} data
 * @param {function(?new:Error,*)|null} callback
 */
Branch.prototype.api = function(resource, data, callback) {
	if (((resource.params && resource.params['app_id']) || (resource.queryPart && resource.queryPart['app_id'])) && this.app_id) { data['app_id'] = this.app_id; }
	if (((resource.params && resource.params['session_id']) || (resource.queryPart && resource.queryPart['session_id'])) && this.session_id) { data['session_id'] = this.session_id; }
	if (((resource.params && resource.params['identity_id']) || (resource.queryPart && resource.queryPart['identity_id'])) && this.identity_id) { data['identity_id'] = this.identity_id; }
	return api(resource, data, callback);
};

/**
 * Adding the Branch script to your page, automatically creates a window.branch object with all of the external methods described below. All calls made to Branch methods are stored in a queue, so even if the SDK is not fully insantiated, calls made to it will be queed in the order they were originally called. The init function on the Branch object initiates the Branch session and creates a new user session if it doesn't already exist in `sessionStorage`.
 * 
 * ##### Usage
 * 
 * ```
 * Branch.init(
 *     app_di,
 *     callback(err, data)
 * )
 * ```
 *
 *##### Returns
 * 
 * ```js
 * {
 *     session_id:         '12345', // Server-generated ID of the session, stored in `sessionStorage`
 *     identity_id:        '12345', // Server-generated ID of the user identity, stored in `sessionStorage`
 *     device_fingerprint: 'abcde', // Server-generated ID of the device fingerprint, stored in `sessionStorage`
 *     data:               {},      // If the user was referred from a link, and the link has associated data, the data is passed in here.
 *     link:               'url',   // Server-generated link identity, for synchronous link creation.
 *     referring_identity: '12345', // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
 * }
 * ```
 * 
 * @param {number} app_id - **Required** Found in your Branch dashboard
 * @param {function|null} callback - Callback function that returns the data
 *
 * **Note:** `Branch.init` is called every time the constructor is loaded.  This is to properly set the session environment, allowing controlled access to the other SDK methods.
 * ___
 */
Branch.prototype['init'] = function(app_id, callback) {
	callback = callback || function() {};
	if (this.initialized) { return callback(utils.message(utils.messages.existingInit)); }
	this.initialized = true;
	this.app_id = app_id;

	var self = this, sessionData = utils.readStore();
	if (sessionData && !sessionData['session_id']) { sessionData = null; }

	if (sessionData) {
		this.session_id = sessionData['session_id'];
		this.identity_id = sessionData['identity_id'];
		this.sessionLink = sessionData["link"];
	}

	if (sessionData && !utils.hashValue('r')) {
		callback(null, sessionData);
	}
	else {
		this.api(resources._r, {}, function(err, browser_fingerprint_id) {
			self.api(resources.open, {
				"link_identifier": utils.hashValue('r'),
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, function(err, data) {
				self.session_id = data['session_id'];
				self.identity_id = data['identity_id'];
				self.sessionLink = data["link"];
				utils.store(data);
				callback(err, data);
			});
		});
	}
};

/**
 * Sets the profile of a user and returns the data.
 * 
 * **Formerly `identify()` (depreciated).**
 * See [CHANGELOG](CHANGELOG.md)
 *
 * ##### Usage
 * 
 * ```
 * Branch.profile(
 *     identity, 
 *     callback(err, data)
 * )
 * ```
 * 
 *  ##### Returns 
 * 
 * ```js
 * {
 *     identity_id:        '12345', // Server-generated ID of the user identity, stored in `sessionStorage`.
 *     link:               'url',   // New link to use (replaces old stored link), stored in `sessionStorage`.
 *     referring_data:     {},      // Returns the initial referring data for this identity, if exists.
 *     referring_identity: '12345'  // Returns the initial referring identity for this identity, if exists.
 * }
 * ```
 * @param {string} identity - **Required** A string uniquely identifying the user
 * @param {function|null} callback - Callback that returns the user's Branch identity id and unique link
 *
 * ___
 */
Branch.prototype['profile'] = function(identity, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	var self = this;
	
	this.api(resources.profile, {
			identity: identity
		}, function(err, data) {
			callback(err,data);
	});
};

/**
 * Logs out the current session, replaces session IDs and identity IDs.
 *
 * ##### Usage
 * 
 * ```
 * Branch.logout(
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Returns 
 *
 * ```js
 * {
 *     session_id:  '12345', // Server-generated ID of the session, stored in `sessionStorage`
 *     identity_id: '12345', // Server-generated ID of the user identity, stored in `sessionStorage`
 *     link:        'url',   // Server-generated link identity, for synchronous link creation, stored in `sessionStorage`
 * }
 * ```
 * 
 * @param {function|null} callback - Returns id's of the session and user identity, and the link
 *
 * ___
 */
Branch.prototype['logout'] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	var self = this;
	this.api(resources.logout, {}, function(err, data) {
		callback(err, data);
	});
};

/*** NOT USED
 * This closes the active session, removing any relevant session Create your accountrmation stored in `sessionStorage`.
 *
 * ##### Usage
 * 
 * ```
 * Branch.close(
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Returns 
 * 
 * ```
 * {}
 * ```
 *
 * @param {function|null} callback - Returns an empty object or an error
 *
 * ---
 */
 /*
Branch.prototype['close'] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	var self = this;
	this.api(resources.close, {}, function(err, data) {
		sessionStorage.clear();
		self.initialized = false;
		callback(err, data);
	});
};
*/
/**
 *
 * This function allows you to track any event with supporting metadata. Use the events you track to create funnels in the Branch dashboard.
 * The `metadata` parameter is a formatted JSON object that can contain any data, and has limitless hierarchy. 
 *
 * **Formerly `track()` (depreciated).**
 * See [CHANGELOG](CHANGELOG.md)
 *
 * ##### Usage
 * 
 * ```
 * Branch.event(
 *     event,	
 *     metadata, 
 *     callback(err, data)
 * )
 * ```
 * 
 * ##### Returns 
 * 
 * ```js
 * {}
 * ```
 * @param {String} event - **Required** The name of the event to be tracked
 * @param {Object|null} metadata - Object of event metadata
 * @param {function|null} callback - Returns an empty object or an error
 *
 * ___
 *
 */
Branch.prototype['event'] = function(event, metadata, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	if (typeof metadata == 'function') {
		callback = metadata;
		metadata = {};
	}
	
	this.api(resources.event, {
		event: event,
		metadata: utils.merge({
			url: document.URL,
			user_agent: navigator.userAgent,
			language: navigator.language
		}, {})
	}, function(err, data) {
		callback(err, data);
	});
};

/**
 *
 * Creates and returns a deep linking URL.  The `data` parameter can include an object with optional data you would like to store, including Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).
 *
 * **Formerly `createLink()` (depreciated).**
 * See [CHANGELOG](CHANGELOG.md)
 *
 * #### Usage
 *
 * ```
 * Branch.link(
 *     metadata,
 *     callback(err, data)
 * )
 * ```
 *
 * #### Example
 *
 * ````
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
 * ````
 *
 * ##### Returns 
 * 
 * ```js
 * { 
 *     link: 'https://bnc.lt/l/3HZMytU-BW' // Branch deep linking URL
 * }
 * ```
 *
 * ##### Returns 
 * 
 * ```js
 * {}
 * ```
 * @param {Object|null} metadata - Object of link metadata
 * @param {function|null} callback - Returns a string of the Branch deep linking URL
 *
 * ___
 */
Branch.prototype['link'] = function(obj, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	

	obj['source'] = 'web-sdk';
	if (obj['data']['$desktop_url'] !== undefined) {
		obj['data']['$desktop_url'] = obj['data']['$desktop_url'].replace(/#r:[a-z0-9-_]+$/i, '');
	}

	obj['data'] = JSON.stringify(obj['data']);
	this.api(resources.link, obj, function(err, data) {
		if (typeof callback == 'function') {
			callback(err, data['url']);
		}
	});
};

/***
 * Is there any reason we need to make this an external function?
 *
 * @param {String} url - **Required** Branch deep linking URL to register link click on
 * @param {function|null} callback - Returns an empty object or an error
 */
Branch.prototype['linkClick'] = function(url, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	
	this.api(resources.linkClick, {
		link_url: url.replace('https://bnc.lt/', ''),
		click: "click"
	}, function(err, data) {
		utils.storeKeyValue("click_id", data["click_id"]);
		if(err || data) { callback(err, data); }
	});
};

/**
 * Uses the already created link that is stored in `sessionStorage`, or creates a link if one has not been created, then registers a click event with the `channel` prefilled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.
 *
 * #### Usage
 *
 * ```
 * Branch.SMSLink(
 *     metadata,    // Metadata must include phone number as `phone`
 *     callback(err, data)
 * )
 * ```
 *
 * #### Example
 *
 * ```
 * branch.SMSLink(
 *     phone: '9999999999',
 *     tags: ['tag1', 'tag2'],
 *     channel: 'facebook',
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
 * }, function(err, data) {
 *     console.log(err || data);
 * });
 * ```
 *
 * @param {Object} metadata - **Required** Object of all link data, requires phone number as `phone`
 * @param {function|null} callback - Returns an empty object or an error
 *
 * ___
 */
Branch.prototype['SMSLink'] = function(obj, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	if(utils.readKeyValue("click_id")) {
		this.SMSLinkExisting(obj["phone"], callback);
	} else {
		this.SMSLinkNew(obj, callback);
	}
}

/**
 *
 * Forces the creation of a new link and stores it in `sessionStorage`, then registers a click event with the `channel` prefilled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.
 *
 * #### Usage
 *
 * ```
 * Branch.SMSLinkNew(
 *     metadata,    // Metadata must include phone number as `phone`
 *     callback(err, data)
 * )
 * ```
 *
 * @param {Object} metadata - **Required** Object of all link data, requires phone number as `phone`
 * @param {function|null} callback - Returns an error or empyy object on success
 *
 * ___
 */
Branch.prototype['SMSLinkNew'] = function(obj, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	obj["channel"] = 'sms';
	var self = this;
	this.link(obj, function(err, url) {
		self.linkClick(url, function(err, data) {
			self.SMSLinkExisting(obj["phone"], function(err, data) {
				callback(err, data);
			});
		});
	});
};

/**
 * Registers a click event on the already created Branch link stored in `sessionStorage` with the `channel` prefilled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.
 *
 * #### Usage
 *
 * ```
 * Branch.SMSLinkExisting(
 *     metadata,     // Metadata must include phone number as `phone`
 *     callback(err, data)
 * )
 * ```
 *
 * @param {String} phone - **Required** String of phone number the link should be sent to
 * @param {function|null} callback - Returns an error or empty object on success
 *
 * ___
 */
Branch.prototype['SMSLinkExisting'] = function(phone, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	this.api(resources.SMSLinkSend, {
		link_url: utils.readStore()["click_id"],
		phone: phone
	}, function(err, data) {
		callback(err, data);
	});
};

/**
 * Retrieves list of referrals for the current user.
 *
 * **Formerly `showReferrals()` (depreciated).**
 * See [CHANGELOG](CHANGELOG.md)
 *
 * ##### Usage
 * ```
 * Branch.referrals(
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Returns
 * 
 * ```js
 * {
 *     'install': { 
 *         total: 5, 
 *         unique: 2
 *     },
 *     'open': {
 *         total: 4, 
 *         unique: 3
 *     },
 *    'buy': {
 *         total: 7,
 *         unique: 3
 *     }
 * }
 * 
 * ```
 * @param {function|null} callback - Returns an error or object with referral data on success
 *
 * ___
 */
Branch.prototype["referrals"] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	
	this.api(resources.referrals, {}, function(err, data) {
		callback(err, data);
	});
};

/**
 * Retrieves a list of credits for the current user.
 *
 * **Formerly `showCredits()` (depreciated).**
 * See [CHANGELOG](CHANGELOG.md)
 *
 * ##### Usage
 * ```
 * Branch.credits(
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Returns 
 * 
 * ```js
 * {
 *     'default': 15,
 *     'other bucket': 9
 * }
 * ```
 *
 * @param {function|null} callback - Returns an error or object with credit data on success
 *
 * ___
 */
Branch.prototype["credits"] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	
	this.api(resources.credits, {
		identity_id: this.identity_id
	}, function(err, data) {
		callback(err, data);
	});
};

/**
 * Redeem credits from a credit bucket.
 *
 * **Formerly `redeemCredits()` (depreciated).**
 * See [CHANGELOG](CHANGELOG.md)
 *
 * ```
 * Branch.redeem(
 * {
 *     amount, // amount of credits to be redeemed
 *     bucket  // String of bucket name to redeem credits from
 * },
 *     callback(err, data)
 * )
 * ```
 *
 * ##### Example
 * 
 * ```
 * branch.redeem({
 *     5,
 *     'bucket'
 * }, function(data){
 *     console.log(data)
 * });
 * ```
 *
 * ##### Returns 
 * 
 * ```js
 * {}
 * ```
 *
 * @param {Object} obj - **Required** Object with an `amount` (int) param of number of credits to redeem, and `bucket` (string) param of which bucket to redeem the credits from
 * @param {function|null} callback - Returns an error or empty object on success
 *
 * ___
 */
Branch.prototype["redeem"] = function(obj, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	
	this.api(resources.redeem, {
		amount: obj["amount"],
		bucket: obj["bucket"]
	}, function(err, data) {
		callback(err, data);
	});
};

/**
 * Display a smart banner directing the user to your app through a Branch referral link.  The `data` param is the exact same as in `branch.link()`.
 *
 * **Formerly `appBanner()` (depreciated).**
 * See [CHANGELOG](CHANGELOG.md)
 *
 * #### Usage
 *
 * ```
 * Branch.banner(
 *     metadata, 	// Metadata, same as Branch.link(), plus 5 extra parameters as shown below in the example
 * )
 * ```
 *
 *  ##### Example
 * 
 * ```
 * branch.banner({
 *     icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
 *     title: 'Branch Demo App',
 *     description: 'The Branch demo app!',
 *     openAppButtonText: 'Open',
 *     downloadAppButtonText: 'Download',
 *     data: {
 *         foo: 'bar'
 *     }
 * }, function(data){
 *     console.log(data)
 * });
 * ```
 *
 * @param {Object} data - **Required** Object of all link data
 */
Branch.prototype["banner"] = function(data) {
	if (!document.getElementById('branch-banner') && !utils.readKeyValue("bannerShown")) {
		document.head.appendChild(elements.smartBannerStyles());
		document.body.appendChild(elements.smartBannerMarkup(data));
		document.getElementById('branch-banner').style.top = '-76px';
		elements.appendSmartBannerActions(data);
		elements.triggerBannerAnimation();
	}
};