/**
 * This file provides the main Branch function.
 */

goog.provide('Branch');
goog.require('utils');
goog.require('resources');
goog.require('api');

/**
 * @constructor
 */
Branch = function() {
	this.initialized = false;
};

/**
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
 * @param {number} app_id
 * @param {function|null} callback
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

/**
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
		utils.storeLinkClickId(data["click_id"]);
		if(err || data) { callback(err, data); }
	});
};

/**
 * @param {?Object} metadata
 * @param {?function} callback
 */
Branch.prototype['SMSLink'] = function(obj, callback) {
	callback = callback || function() {};
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	if(utils.readStore()["click_id"]) {
		this.SMSLinkExisting(obj["phone"], callback);
	} else {
		this.SMSLinkNew(obj, callback);
	}
}

/**
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
 * @param {?Object} obj
 */
Branch.prototype["banner"] = function(obj) {
	// Elements
	var head = document.head;
	var body = document.body;
	var css = document.createElement("style");
	var banner = document.createElement('div');
	var interior = document.createElement('div');
	var action = document.createElement('div');

	// Styles
	body.style.marginTop = '71px';
	css.type = "text/css";
	css.innerHTML = 
		'#branch-banner { position: absolute; top: 0px; width: 100%; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; -webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all 0.3s ease; transition: all 0.3s ease; }' +
		'#branch-banner .close-x { float: left; font-weight: 400; color: #aaa; font-size: 20px; margin-top: 13px; margin-right: 6px; margin-left: 0; cursor: pointer; }' +
		'#branch-banner .content { position: absolute; width: 100%; height: 76px; z-index: 99999; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; }' +
		'#branch-banner .content .left { width: 70%; float: left; padding: 8px 8px 8px 8px; }' +
		'#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }' +
		'#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }' +
		'#branch-banner .content .left .details { margin-top: 3px; padding-left: 4px; overflow:hidden; }' +
		'#branch-banner .content .left .details .title { font: 14px/1.5em HelveticaNeue-Medium, Helvetica Neue Medium, Helvetica Neue, Sans-serif; color: rgba(0, 0, 0, 0.9); display: inline-block; }' +
		'#branch-banner .content .left .details .description { font-size: 12px; font-weight: normal; line-height: 1.5em; color: rgba(0, 0, 0, 0.5); display: inline-block; }' +
		'#branch-banner .content .right { width: 30%; display:inline-block; margin-top: 25px; }';
	var mobileCSS =
		'#branch-banner .content .right a { font-size: 16px; font-weight: 500; color: #007aff; }' +
		'#branch-banner-action div { float: right; margin-right: 8px; }';
	var desktopCSS = 
		'#branch-banner .content .right input { font-weight: 100; border-radius: 2px; border: 1px solid #bbb; padding: 5px 7px 4px; width: 125px; text-align: center; font-size: 12px; }' +
		'#branch-banner .content .right button { margin-top: 0px; display: inline-block; height: 28px; float: right; margin-left: 5px; font-family: Helvetica, Arial, sans-serif; font-weight: 400; border-radius: 2px; border: 1px solid #6EBADF; background: #6EBADF; color: white; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; padding: 0px 12px; }' +
		'#branch-banner .content .right button:hover { color: #6EBADF; background: white; }' +
		'#branch-banner .content .right input:focus, button:focus { outline: none; }' +
		//'#branch-banner .content .right input.error { color: red; border-color: red; }' +
		'#branch-banner .content .right span { display: inline-block; font-weight: 100; margin: 7px 9px; font-size: 12px; }';

	// Banner HTML
	interior.innerHTML = 
		'<div id="branch-banner">' +
			'<div class="content">' +
				'<div class="left">' +
					'<div class="close-x" id="branch-banner-close">&times;</div>' +
					'<div class="icon" style="float: left;">' +
						'<img src="' + obj.icon + '">' +
					'</div>' +
					'<div class="details">' +
						'<span class="title">' + obj.title + '</span>' +
						'<span class="description">' + obj.description + '</span>' +
					'</div>' +
				'</div>' +
				'<div class="right" id="branch-banner-action">' +
				'</div>' +
			'</div>' +
		'</div>';

	// Desktop send link to SMS
	var sendBannerSMS =
		function(){
			var phone = document.getElementById('branch-sms-phone');
			var phone_val = phone.value;
			if ((/^\d{7,}$/).test(phone_val.replace(/[\s()+\-\.]|ext/gi, ''))) {
				branch.SMSLink({
					phone: phone_val,
					 data: obj.data || {}
				 }, function() {
					 document.getElementById('branch-sms-block').innerHTML = '<span class="sms-sent">App link sent to ' + phone_val + '!</span>';
				 });
			} else {
				phone.className = 'error';
			}
		};

	// Close banner
	var closeBranchBanner = function() {
			var d = document.getElementById('branch-banner');
			if (d) {
				d.parentNode.removeChild(d);
				document.body.style.marginTop = '0px';
			}
		};

	// Append the elements to the DOM
	head.appendChild(css);
	banner.appendChild(interior);
	body.appendChild(banner);
	document.getElementById('branch-banner-action').appendChild(action);
	document.getElementById('branch-banner-close').onclick = closeBranchBanner;

	// Append open app action to DOM (Device specific)
	if (navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i)) {
		this.link({
			channel: 'appBanner',
			data: obj.data || {}
		}, function(url) {
			css.innerHTML += mobileCSS;
			action.innerHTML = '<a href="' + url + '">View in App</a>';
		});
	}
	else {
		css.innerHTML += desktopCSS;
		action.innerHTML =
			'<div id="branch-sms-block">' +
				'<input type="phone" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999">' +
				'<button id="branch-sms-send">TXT Me The App!</button>' +
			'</div>';
		document.getElementById('branch-sms-send').onclick = sendBannerSMS;
	}
};