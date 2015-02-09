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
	if (this.initialized) { return callback(utils.message(utils.messages.existingInit)); }
	this.initialized = true;

	callback = callback || function() {};
	this.app_id = app_id;

	var self = this, sessionData = utils.readStore();
	if (sessionData && !sessionData['session_id']) { sessionData = null; }

	if (sessionData) {
		this.session_id = sessionData['session_id'];
		this.identity_id = sessionData['identity_id'];
	}

	if (sessionData && !utils.hashValue('r')) {
		callback(null, sessionData);
	}
	else {
		this.api(resources._r, {}, function(err, browser_fingerprint_id) {
			if (err) { callback(err); }
			else {
				self.api(resources.open, {
					"link_identifier": utils.hashValue('r'),
					"is_referrable": 1,
					"browser_fingerprint_id": browser_fingerprint_id
				}, function(err, data) {
					if (err) { callback(err); }
					else {
						self.session_id = data['session_id'];
						self.identity_id = data['identity_id'];
						utils.store(data);
						callback(null, data);
					}
				});
			}
		});
	}
};

/**
 * @param {function|null} callback
 */
Branch.prototype['logout'] = function(callback) {
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	callback = callback || function() {};
	api(resources.logout, {}, function(data) {
		var sessionData = utils.readStore();
		sessionData.session_id = data.session_id;
		sessionData.identity_id = data.identity_id;
		sessionData.link = data.link;
		sessionStorage.setItem('branch_session', JSON.stringify(session));
		// TODO: gotta change branch_instance.session_id etc
		callback(data);
	});
};

/**
 * @param {string} event 
 * @param {?Object} metadata
 * @param {?function} callback
 */
Branch.prototype['track'] = function(event, metadata, callback) {
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	if (typeof metadata == 'function') {
		callback = metadata;
		metadata = {};
	}
	callback = callback || function() {};
	this.api(resources.track, {
		"event": event,
		"metadata": utils.merge({
			"url": document.URL,
			"user_agent": navigator.userAgent,
			"language": navigator.language
		}, {})
	}, callback);
};

/**
 */
Branch.prototype['identify'] = function(identity, callback) {
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }

	callback = callback || function() {};
	this.api(resources.profile, { identity: identity }, function(data) {
		var session = utils.readSession();
		session.identity_id = data.identity_id;
		session.link = data.link;
		session.referring_data = data.referring_data;
		session.referring_identity = data.referring_identity;
		sessionStorage.setItem('branch_session', JSON.stringify(session));
		// TODO: gotta change branch_instance.session_id etc
		callback(data);
	});
};

Branch.prototype['createLink'] = function(obj, callback) {
	if (!this.initialized) { return utils.console(config.debugMsgs.nonInit); }

	obj['source'] = 'web-sdk';
	if (obj['data']['$desktop_url'] !== undefined) {
		obj['data']['$desktop_url'] = obj['data']['$desktop_url'].replace(/#r:[a-z0-9-_]+$/i, '');
	}

	obj['data'] = JSON.stringify(obj['data']);
	this.api(resources.createLink, obj, function(err, data) {
		if (typeof callback == 'function') {
			if (err) { callback(err); }
			else { callback(null, data['url']); }
		}
	});
};

/**
 * @param {?String} url
 * @param {?function} callback
 */
Branch.prototype['createLinkClick'] = function(url, callback) {
	if (!this.initialized) { return utils.console(config.debugMsgs.nonInit); }
	this.api(resources.createLinkClick, {
		link_url: url.replace('https://bnc.lt/', ''),
		click: "click"
	}, function(err, data) {
		if (err) { callback(err); }
		else { callback(null, data); }
	});
};

/**
 * @param {?Object} metadata
 * @param {?function} callback
 */
Branch.prototype['SMSLink'] = function(obj, callback) {
	if (!this.initialized) { return utils.console(config.debugMsgs.nonInit); }
	obj["channel"] = 'sms';
	var self = this;
	this.createLink(obj, function(err, url) {
		if (err) { callback(err); }
		else {
			self.createLinkClick(url, function(err, data) {
				if (err) { callback(err); }
				else {
					self.sendSMSLink(obj["phone"], data, function(data) {
						if (typeof callback == 'function') { callback({}); } //Fifure this out, {} instead of data
					});
				}
			});
		}
	});
};

/**
 * @param {?String} phone
 * @param {?Object} data
 * @param {?function} callback
 */
Branch.prototype['sendSMSLink'] = function(phone, data, callback) {
	this.api(resources.sendSMSLink, {
		link_url: data.click_id,
		phone: phone
	}, function(err, data) {
		if (err) { callback(err); }
		else { callback(data); }
	});
};

/**
 * @param {?function} callback
 */
Branch.prototype["showReferrals"] = function(callback) {
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	this.api(resources.referrals, {
		identity_id: this.app_id
	}, function(err, data) {
		if (err) { callback(err); }
		else { callback(data); }
	});
};

/**
 * @param {?function} callback
 */
Branch.prototype["showCredits"] = function(callback) {
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	this.api(resources.credits, {
		identity_id: this.app_id
	}, function(err, data) {
		if (err) { callback(err); }
		else { callback(data); }
	});
};


/**
 * @param {?Object} obj
 * @param {?function} callback
 */
Branch.prototype["redeemCredits"] = function(obj, callback) {
	if (!this.initialized) { return callback(utils.message(utils.messages.nonInit)); }
	this.api(resources.redeem, {
		identity_id: this.app_id,
		amount: obj["amount"],
		bucket: obj["bucket"]
	}, function(err, data) {
		if (err) { callback(err); }
		else { callback(data); }
	});
};

/*
===== THESE ARE OLD FUNCTIONS FROM THE WEB SDK THAT NEED TO BE MOVED OVER =====

// End API Requests
// Begin Smart Banners
this.appBanner = function(obj) {
	if (!self.initialized) { return utils.console(config.debugMsgs.nonInit); }
	var data = obj;
	var head = document.head;
	var body = document.body;
	var css = document.createElement("style");
	var banner = document.createElement('div');
	var interior = document.createElement('div');
	if (utils.mobileReady()) {
		self.createLink({
			channel: 'appBanner',
			data: (data.data ? data.data : {})
		}, function(url) {
			css.type = "text/css";
			css.innerHTML =
				'#branch-banner { position: fixed; top: 0px; width: 100%; font-family: Helvetica, Arial, sans-serif; }' +
				'#branch-banner .close-x { float: left; font-weight: 200; color: #aaa; font-size: 14px; padding-right: 4px; margin-top: -5px; margin-left: -2px; cursor: pointer; }' +
				'#branch-banner .content { position: absolute; width: 100%; height: 71px; z-index: 99999; background: white; color: #444; border-bottom: 1px solid #ddd; }' +
				'#branch-banner .content .left { width: 60%; float: left; padding: 5px 0 0 7px; }' +
				'#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }' +
				'#branch-banner .content .left .details { margin: 13px 0; }' +
				'#branch-banner .content .left .details .title { display: block; font-size: 12px; font-weight: 400; }' +
				'#branch-banner .content .left .details .description { display: block; font-size: 10px; font-weight: 200; }' +
				'#branch-banner .content .right { width: 40%; float: left; padding: 23px 6px 0 0; text-align: right; }' +
				'#branch-banner .content .right a { display: block; float: right; margin-right: 5px; background: #6EBADF; color: white; font-size: 10px; font-weight: 400; padding: 5px 5px 4px; border-radius: 2px; letter-spacing: .08rem; text-transform: uppercase; }' +
				'#branch-banner .content .right a:hover { text-decoration: none; }';
			head.appendChild(css);
			body.style.marginTop = '71px';
			interior.innerHTML =
				'<div id="branch-banner">' +
					'<div class="content">' +
						'<div class="left">' +
							'<div class="close-x" onclick="branch.utils.closeBanner();">&times;</div>' +
							'<div class="icon" style="float: left;">' +
								'<img src="' + data.icon + '">' +
							'</div>' +
							'<div class="details">' +
								'<span class="title">' + data.title + '</span>' +
								'<span class="description">' + data.description + '</span>' +
							'</div>' +
						'</div>' +
						'<div class="right">' +
							'<a href="' + url + '">View in App</a>' +
						'</div>' +
					'</div>' +
				'</div>';
			banner.appendChild(interior);
			body.appendChild(banner);
		});
	}
	else {
		css.innerHTML =
			'#branch-banner { position: fixed; top: 0px; width: 100%; font-family: Helvetica, Arial, sans-serif; }' +
			'#branch-banner .close-x { float: left; font-weight: 200; color: #aaa; font-size: 14px; padding-right: 4px; margin-top: -5px; margin-left: -2px; cursor: pointer; }' +
			'#branch-banner .content { position: absolute; width: 100%; height: 71px; z-index: 99999; background: white; color: #444; border-bottom: 1px solid #ddd; }' +
			'#branch-banner .content .left { width: 60%; float: left; padding: 5px 0 0 7px; }' +
			'#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }' +
			'#branch-banner .content .left .details { margin: 10px 0; }' +
			'#branch-banner .content .left .details .title { display: block; font-size: 14px; font-weight: 400; }' +
			'#branch-banner .content .left .details .description { display: block; font-size: 12px; font-weight: 200; }' +
			'#branch-banner .content .right { width: 40%; float: left; padding: 21px 9px 0 0; text-align: right; }'+
			'#branch-banner .content .right input { font-weight: 100; border-radius: 2px; border: 1px solid #bbb; padding: 5px 7px 4px; width: 125px; text-align: center; font-size: 12px; }' +
			'#branch-banner .content .right button { margin-top: 0px; display: inline-block; height: 28px; float: right; margin-left: 5px; font-family: Helvetica, Arial, sans-serif; font-weight: 400; border-radius: 2px; border: 1px solid #6EBADF; background: #6EBADF; color: white; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; padding: 0px 12px; }' +
			'#branch-banner .content .right button:hover { color: #6EBADF; background: white; }' +
			'#branch-banner .content .right input:focus, button:focus { outline: none; }' +
			'#branch-banner .content .right input.error { color: red; border-color: red; }' +
			'#branch-banner .content .right span { display: inline-block; font-weight: 100; margin: 7px 9px; font-size: 12px; }';
		head.appendChild(css);
		body.style.marginTop = '71px';
		interior.innerHTML =
			'<div id="branch-banner">' +
				'<div class="content">' +
					'<div class="left">' +
						'<div class="close-x" onclick="branch.utils.closeBanner();">&times;</div>' +
						'<div class="icon" style="float: left;">' +
							'<img src="' + obj.icon + '">' +
						'</div>' +
						'<div class="details">' +
							'<span class="title">' + obj.title + '</span>' +
							'<span class="description">' + obj.description + '</span>' +
						'</div>' +
					'</div>' +
					'<div class="right">' +
						'<div id="branch-sms-block">' +
							'<input type="phone" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999">' +
							'<button id="branch-sms-send">TXT Me The App!</button>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>';
		banner.appendChild(interior);
		body.appendChild(banner);
		var phone = document.getElementById('branch-sms-phone');
		document.getElementById('branch-sms-send').onclick = function(){
			phone.className = '';
			var phone_val = phone.value.replace(/[^0-9.]/g, '');
			if (phone_val !== '' && phone_val.length >= 5) {
				self.SMSLink({
					phone: phone_val,
					 data: (data.data ? data.data : {})
				 }, function() {
					 document.getElementById('branch-sms-block').innerHTML = '<span class="sms-sent">App link sent to ' + phone_val + '!</span>';
				 });
			} else {
				phone.className = 'error';
			}
		};
	}
};
*/
