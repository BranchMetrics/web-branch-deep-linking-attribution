/***
 * This file provides the main Branch function.
 */

goog.provide('Branch');
goog.require('utils');
goog.require('resources');
goog.require('BranchAPI');
goog.require('banner');
goog.require('Queue');
goog.require('storage');
goog.require('config');
/*jshint unused:false*/
goog.require('goog.json');

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
	this._queue = Queue();
	this._storage = storage();
	this._branchAPI = new BranchAPI();
	this.initialized = false;
};

/***
 * @param {utils.resource} resource
 * @param {Object.<string, *>} obj
 * @param {function(?Error,?)=} callback
 */
Branch.prototype._api = function(resource, obj, callback) {
	var self = this;
	this._queue(function(next) {
		if (((resource.params && resource.params['app_id']) || (resource.queryPart && resource.queryPart['app_id'])) && self.app_id) { obj['app_id'] = self.app_id; }
		if (((resource.params && resource.params['session_id']) || (resource.queryPart && resource.queryPart['session_id'])) && self.session_id) { obj['session_id'] = self.session_id; }
		if (((resource.params && resource.params['identity_id']) || (resource.queryPart && resource.queryPart['identity_id'])) && self.identity_id) { obj['identity_id'] = self.identity_id; }
		return self._branchAPI.request(resource, obj, self._storage, function(err, data) {
			next();
			callback(err, data);
		});
	});
};

/**
 * @function Branch.init
 * @param {string} app_id - _required_ - Your Branch [app key](http://dashboard.branch.io/settings).
 * @param {function(?Error, utils.sessionData=)=} callback - _optional_ - callback to read the session data.
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
 *           data:               { },      // If the user was referred from a link, and the link has associated data, the data is passed in here.
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
	if (this.initialized) { return callback(new Error(utils.message(utils.messages.existingInit))); }
	this.app_id = app_id;
	var self = this, sessionData = utils.readStore(this._storage);

	var setBranchValues = function(data) {
		self.session_id = data['session_id'];
		self.identity_id = data['identity_id'];
		self.sessionLink = data['link'];
		self.initialized = true;
	};

	if (sessionData  && sessionData['session_id']) {
		setBranchValues(sessionData);
		callback(null, utils.whiteListSessionData(sessionData));
	}
	else {
		this._api(resources._r, { "v": config.version }, function(err, browser_fingerprint_id) {
			self._api(resources.open, {
				"link_identifier": utils.urlValue('_branch_match_id'),
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, function(err, data) {
				setBranchValues(data);
				utils.store(data, self._storage);
				callback(err, utils.whiteListSessionData(data));
			});
		});
	}
};

/**
 * @function Branch.data
 * @param {function(?Error, utils.sessionData=)=} callback - _optional_ - callback to read the session data.
 *
 * Returns the same session information and any referring data, as
 * `Branch.init`, but does not require the `app_id`. This is meant to be called
 * after `Branch.init` has been called if you need the session information at a
 * later point.
 * If the Branch session has already been initialized, the callback will return
 * immediately, otherwise, it will return once Branch has been initialized.
 * ___
 */
Branch.prototype['data'] = function(callback) {
	callback = callback || function() { };
	var self = this;
	this._queue(function(next) {
		callback(null, utils.whiteListSessionData(utils.readStore(self._storage)));
		next();
	});
};

/**
 * @function Branch.setIdentity
 * @param {string} identity - _required_ - a string uniquely identifying the user – often a user ID or email address.
 * @param {function(?Error, Object=)=} callback - _optional_ - callback that returns the user's Branch identity id and unique link.
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
 *           identity_id:        '12345', // Server-generated ID of the user identity, stored in `sessionStorage`.
 *           link:               'url',   // New link to use (replaces old stored link), stored in `sessionStorage`.
 *           referring_data:     { },      // Returns the initial referring data for this identity, if exists.
 *           referring_identity: '12345'  // Returns the initial referring identity for this identity, if exists.
 *      }
 * );
 * ```
 * ___
 */
Branch.prototype['setIdentity'] = function(identity, callback) {
	callback = callback || function() { };
	if (!this.initialized) { return callback(new Error(utils.message(utils.messages.nonInit))); }
	this._api(resources.profile, { "identity": identity }, function(err, data) {
		callback(err, data);
	});
};

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
 * ## Tracking events
 */
Branch.prototype['logout'] = function(callback) {
	callback = callback || function() { };
	if (!this.initialized) { return callback(new Error(utils.message(utils.messages.nonInit))); }
	this._api(resources.logout, { }, function(err) {
		callback(err);
	});
};

/**
 * @function Branch.track
 * @param {string} event - _required_ - name of the event to be tracked.
 * @param {Object=} metadata - _optional_ - object of event metadata.
 * @param {function(?Error)=} callback - _optional_
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
	if (!this.initialized) { return callback(new Error(utils.message(utils.messages.nonInit))); }
	if (typeof metadata == 'function') {
		callback = metadata;
		metadata = { };
	}
	this._api(resources.event, {
		"event": event,
		"metadata": utils.merge({
			"url": document.URL,
			"user_agent": navigator.userAgent,
			"language": navigator.language
		}, { })
	}, function(err) {
		callback(err);
	});
};

/**
 * @function Branch.link
 * @param {Object} linkData - _required_ - link data and metadata.
 * @param {function(?Error,String=)=} callback - _optional_ - returns a string of the Branch deep linking URL.
 *
 * **[Formerly `createLink()`](CHANGELOG.md)**
 *
 * Creates and returns a deep linking URL.  The `data` parameter can include an
 * object with optional data you would like to store, including Facebook
 * [Open Graph data](https://developers.facebook.com/docs/opengraph).
 *
 * #### Usage
 * ```
 * branch.link(
 *     linkData,
 *     options,
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
 *     type: 1,
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
 * ___
 *
 * ## Sharing links via SMS
 *
 */
Branch.prototype['link'] = function(linkData, callback) {
	if (!this.initialized) { return callback(new Error(utils.message(utils.messages.nonInit))); }

	callback = callback || function() { };

	var self = this;
	linkData['source'] = 'web-sdk';
	if (linkData['data']['$desktop_url'] !== undefined) {
		linkData['data']['$desktop_url'] = linkData['data']['$desktop_url'].replace(/#r:[a-z0-9-_]+$/i, '');
	}

	linkData['data'] = goog.json.serialize(linkData['data']);
	this._api(resources.link, linkData, function(err, data) {
		callback(err, data && data['url']);
	});
};

/**
 * @function Branch.sendSMS
 * @param {string} phone - _required_ - phone number to send SMS to
 * @param {Object} linkData - _required_ - object of link data
 * @param {Object=} options - _optional_ - options: make_new_link, which forces the creation of a new link even if one already exists
 * @param {function(?Error)=} callback - _optional_ - Returns an error if unsuccessful
 *
 * **[Formerly `SMSLink()`](CHANGELOG.md)**
 *
 * A robust function to give your users the ability to share links via SMS. If
 * the user navigated to this page via a Branch link, `sendSMS` will send that
 * same link. Otherwise, it will create a new link with the data provided in
 * the `metadata` argument. `sendSMS` also  registers a click event with the
 * `channel` pre-filled with `'sms'` before sending an sms to the provided
 * `phone` parameter. This way the entire link click event is recorded starting
 * with the user sending an sms. **Supports international SMS**.
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
 *     phone: '9999999999',
 *     {
 *         tags: ['tag1', 'tag2'],
 *         channel: 'facebook',
 *         feature: 'dashboard',
 *         stage: 'new user',
 *         type: 1,
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
Branch.prototype['sendSMS'] = function(phone, linkData, options, callback) {
	if (typeof options == 'function') {
		callback = options;
		options = {};
	}
	else if (typeof options == 'undefined') {
		options = {};
	}
	callback = callback || function() {};
	options["make_new_link"] = options["make_new_link"] || false;

	if (!this.initialized) { return callback(new Error(utils.message(utils.messages.nonInit))); }
	var self = this;

	if (!linkData['channel'] || linkData['channel'] == 'app banner') { linkData['channel'] = 'sms'; }

	function sendSMS(click_id) {
		self._api(resources.SMSLinkSend, {
			"link_url": click_id,
			"phone": phone
		}, function(err) { callback(err); });
	}

	if (utils.readKeyValue('click_id', this._storage) && !options['make_new_link']) {
		sendSMS(utils.readKeyValue('click_id', this._storage));
	}
	else {
		this["link"](linkData, function(err, url) {
			if (err) { return callback(err); }

			self._api(resources.linkClick, {
				"link_url": 'l/' + url.split('/').pop(),
				"click": "click"
			}, function(err, data) {
				if (err) { return callback(err); }

				utils.storeKeyValue('click_id', data['click_id'], self._storage);
				sendSMS(data['click_id']);
			});
		});
	}
};

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
 * ## Credit history
 *
 */
Branch.prototype['referrals'] = function(callback) {
	if (!this.initialized) {
		return callback(new Error(utils.message(utils.messages.nonInit)));
	}
	this._api(resources.referrals, { }, function(err, data) {
		callback(err, data);
	});
};

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
 * ## Credit redemption
 *
 */
Branch.prototype['credits'] = function(callback) {
	if (!this.initialized) { return callback(new Error(utils.message(utils.messages.nonInit))); }
	this._api(resources.credits, { }, function(err, data) {
		callback(err, data);
	});
};

/**
 * @function Branch.redeem
 * @param {number} amount - _required_ - an `amount` (int) of number of credits to redeem
 * @param {string} bucket - _required_ - the name of the `bucket` (string) of which bucket to redeem the credits from
 * @param {function(?Error)=} callback - _optional_ - returns an error if unsuccessful
 *
 * **[Formerly `redeemCredits()`](CHANGELOG.md)**
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
 *
 * # Smart App Sharing Banner
 *
 * The Branch Web SDK has a built in sharing banner, that automatically displays a device specific banner for desktop, iOS, and Android. If the banner is shown on a desktop, a form for sending yourself the download link via SMS is shown.
 * Otherwise, a button is shown that either says an "open" app phrase, or a "download" app phrase, based on whether or not the user has the app installed. Both of these phrases can be specified in the parameters when calling the banner function.
 * **Styling**: The banner automatically styles itself based on if it is being shown on the desktop, iOS, or Android.
 *
 */
Branch.prototype['redeem'] = function(amount, bucket, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(new Error(utils.message(utils.messages.nonInit))); }
	this._api(resources.redeem, { "amount": amount, "bucket": bucket }, function(err) {
		callback(err);
	});
};

/**
 * @function Branch.banner
 * @param {Object} options - _required_ - object of all the options to setup the banner
 * @param {Object} linkData - _required_ - object of all link data, same as Branch.link()
 *
 * **[Formerly `appBanner()`](CHANGELOG.md)**
 *
 * Display a smart banner directing the user to your app through a Branch referral link.  The `linkData` param is the exact same as in `branch.link()`.
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
 *     iframe: true,                      // Show banner in an iframe, recomended to isolate Branch banner CSS
 *     showiOS: true,                     // Should the banner be shown on iOS devices?
 *     showAndroid: true,                 // Should the banner be shown on Android devices?
 *     showDesktop: true,                 // Should the banner be shown on desktop devices?
 *     disableHide: false,                // Should the user have the ability to hide the banner? (show's X on left side)
 *     forgetHide: false,                 // Should we remember or forget whether the user hid the banner?
 *     make_new_link: false               // Should the banner create a new link, even if a link already exists?
 * }, {
 *     phone: '9999999999',
 *     tags: ['tag1', 'tag2'],
 *     feature: 'dashboard',
 *     stage: 'new user',
 *     type: 1,
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
 */
Branch.prototype['banner'] = function(options, linkData) {
	var bannerOptions = {
		icon: options['icon'] || '',
		title: options['title'] || '',
		description: options['description'] || '',
		openAppButtonText: options['openAppButtonText'] || 'View in app',
		downloadAppButtonText: options['downloadAppButtonText'] || 'Download App',
		iframe: typeof options['iframe'] == 'undefined' ? true : options['iframe'],
		showiOS: typeof options['showiOS'] == 'undefined' ? true : options['showiOS'],
		showAndroid: typeof options['showAndroid'] == 'undefined' ? true : options['showAndroid'],
		showDesktop: typeof options['showDesktop'] == 'undefined' ? true : options['showDesktop'],
		disableHide: !!options['disableHide'],
		forgetHide: !!options['forgetHide'],
		make_new_link: !!options['make_new_link']
	};

	if (typeof options['showMobile'] != 'undefined') {
		bannerOptions.showiOS = bannerOptions.showAndroid = options['showMobile'];
	}

	banner(this, bannerOptions, linkData, this._storage);
};

