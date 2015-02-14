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

/***
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
 *   callback (function, optional)
 * )
 * ```
 * 
 * @param {number} app_id - **Required** Found in your Branch dashboard
 * @param {function|null} callback - Callback function that reeturns as callback(err, data)
 * 
 * ---
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
 * 
 * @param {function|null} callback
 */
Branch.prototype['logout'] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	var self = this;
	this.api(resources.logout, {}, function(err, data) {
		callback(err, data);
	});
};

/**
 *
 * @param {function|null} callback
 */
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

/**
 *
 * @param {String} event 
 * @param {?Object} metadata
 * @param {?function} callback
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
 * Sets the profile of a user and returns the data.
 * @param {string} identity 
 * @param {?function} callback
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
 * Createa and returns a deep linking URL.  The `data` parameter can include Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).
 * @param {?Object} metadata
 * @param {?function} callback
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
 *
 * @param {?String} url
 * @param {?function} callback
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
 *
 * @param {?Object} metadata
 * @param {?function} callback
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
 * @param {?Object} metadata
 * @param {?function} callback
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
 *
 * @param {?String} phone
 * @param {?function} callback
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
 *
 * @param {?function} callback
 */
Branch.prototype["referrals"] = function(callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	
	this.api(resources.referrals, {}, function(err, data) {
		callback(err, data);
	});
};

/**
 *
 * @param {?function} callback
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
 *
 * @param {?Object} obj
 * @param {?function} callback
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
 *
 * @param {?Object} obj
 */
Branch.prototype["banner"] = function(obj) {
	if (!document.getElementById('branch-banner') && !utils.readKeyValue("bannerShown")) {
		document.head.appendChild(elements.smartBannerStyles());
		document.body.appendChild(elements.smartBannerMarkup(obj));
		document.getElementById('branch-banner').style.top = '-76px';
		elements.appendSmartBannerActions(obj);
		elements.triggerBannerAnimation();
	}
};