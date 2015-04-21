/**
 * This provides a list of endpoints and client-side validation for any calls
 * to those endpoints.
 */

goog.provide('resources');

goog.require('utils');
goog.require('config');

/**
 * @const
 * @type {Object<*,utils.resource>}
 */
var resources = { };

/** @enum {number} */
var validationTypes = { obj: 0, str: 1, num: 2, arr: 3, bool: 4 };  // now includes bool

/* jshint ignore:start */

/** @typedef {function(string, string, *)} */
var _validator;

/* jshint ignore:end */

/**
 * @param {boolean} required
 * @param {validationTypes|RegExp} type
 * @param {string} optional fallback
 * @param {validationTypes|RegExp} fallback type
 * @throws {Error}
 * @return {_validator}
 */
function validator(required, type, fallback, fallbackType) {
	return function(endpoint, param, data, allData) {
		// Must ensure data is not a number before doing a !data otherwise the number can't be 0.
		if ((typeof data != 'number') && !data) {
			if (required && ((fallback && (typeof allData[fallback] != 'number') && !allData[fallback]) || !fallback)) {
				return utils.message(utils.messages.missingParam, [ endpoint, param ]);
			}
		}
		else if (type == validationTypes.obj) {
			if (typeof data != 'object') { return utils.message(utils.messages.invalidType, [ endpoint, param, 'an object' ]); }
		}
		else if (type == validationTypes.arr) {
			if (!(data instanceof Array)) { return utils.message(utils.messages.invalidType, [ endpoint, param, 'an array' ]); }
		}
		else if (type == validationTypes.num) {
			if (typeof data != 'number') { return utils.message(utils.messages.invalidType, [ endpoint, param, 'a number' ]); }
		}
		else if (type == validationTypes.bool) {
			if (typeof data != 'boolean') { return utils.message(utils.messages.invalidType, [ endpoint, param, 'a boolean' ]); }
		}
		// String or regex validator
		else if (typeof data != 'string') {
			return utils.message(utils.messages.invalidType, [ endpoint, param, 'a string' ]);
		}
		else if (type != validationTypes.str && !type.test(data)) {
			if ((fallback && fallbackType != validationTypes.str && !fallbackType.test(data)) || !fallback) {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'in the proper format' ]);
			}
		}

		return false;
	};
}

var branch_id = /^[0-9]{15,20}$/;
var branch_key = /((?:[a-z][a-z]*[0-9]+[a-z0-9]*))/;

if (config.WEB_BUILD) {
	resources.open = {
			destination: config.api_endpoint,
			endpoint: "/v1/open",
			method:	 utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(false, branch_id),
				"link_identifier": validator(false, validationTypes.str),
				"is_referrable": validator(true, validationTypes.num),
				"browser_fingerprint_id": validator(true, branch_id)
			}
		};

		resources.profile = {
			destination: config.api_endpoint,
			endpoint: "/v1/profile",
			method:	 utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"identity": validator(true, validationTypes.str)
			}
		};

		resources.close = {
			destination: config.api_endpoint,
			endpoint: "/v1/close",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"session_id": validator(true, branch_id)
			}
		};

		resources.logout = {
			destination: config.api_endpoint,
			endpoint: "/v1/logout",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"session_id": validator(true, branch_id)
			}
		};

		resources.referrals = {
			destination: config.api_endpoint,
			endpoint: "/v1/referrals",
			method: utils.httpMethod.GET,
			queryPart: { "identity_id": validator(true, branch_id) }
		};

		resources.credits = {
			destination: config.api_endpoint,
			endpoint: "/v1/credits",
			method: utils.httpMethod.GET,
			queryPart: { "identity_id": validator(true, branch_id) }
		};

		resources._r = {
			destination: config.link_service_endpoint,
			endpoint: "/_r",
			method: utils.httpMethod.GET,
			jsonp: true,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"v": validator(true, validationTypes.str)
			}
		};

		resources.redeem =  {
			destination: config.api_endpoint,
			endpoint: "/v1/redeem",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"amount": validator(true, validationTypes.num),
				"bucket": validator(true, validationTypes.str)
			}
		};

		resources.link = {
			destination: config.api_endpoint,
			endpoint: "/v1/url",
			method: utils.httpMethod.POST,
			ref: "obj",
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"data": validator(false, validationTypes.str),
				"tags": validator(false, validationTypes.arr),
				"feature": validator(false, validationTypes.str),
				"channel": validator(false, validationTypes.str),
				"stage": validator(false, validationTypes.str),
				"type": validator(false, validationTypes.num)
			}
		};

		resources.linkClick = {
			destination: config.link_service_endpoint,
			endpoint: "",
			method: utils.httpMethod.GET,
			queryPart: { "link_url": validator(true, validationTypes.str) },
			params: { "click": validator(true, validationTypes.str) }
		};

		resources.SMSLinkSend = {
			destination: config.link_service_endpoint,
			endpoint: "/c",
			method: utils.httpMethod.POST,
			queryPart: {
				"link_url": validator(true, validationTypes.str)
			},
			params: {
				"phone": validator(true, validationTypes.str),
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id)
			}
		};

		resources.event = {
			destination: config.api_endpoint,
			endpoint: "/v1/event",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"session_id": validator(true, branch_id),
				"event": validator(true, validationTypes.str),
				"metadata": validator(true, validationTypes.obj)
			}
		};
}

if (config.CORDOVA_BUILD) {
	resources.install = {
			destination: config.api_endpoint,
			endpoint: "/v1/install",
			method:	 utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"link_identifier": validator(false, validationTypes.str),
				"sdk": validator(false, validationTypes.str),
				"hardware_id": validator(false, validationTypes.str),
				"is_hardware_id_real": validator(false, validationTypes.bool),
				"app_version": validator(false, validationTypes.str),
				"carrier": validator(false, validationTypes.str),
				"bluetooth": validator(false, validationTypes.bool),
				"bluetooth_version": validator(false, validationTypes.str),
				"has_nfc": validator(false, validationTypes.bool),
				"has_telephone": validator(false, validationTypes.bool),
				"brand": validator(false, validationTypes.str),
				"model": validator(false, validationTypes.str),
				"os": validator(false, validationTypes.str),
				"uri_scheme": validator(false, validationTypes.str),
				"os_version": validator(false, validationTypes.str),
				"screen_dpi": validator(false, validationTypes.num),
				"screen_width": validator(false, validationTypes.num),
				"screen_height": validator(false, validationTypes.num),
				"is_referrable": validator(false, validationTypes.num),
				"update": validator(false, validationTypes.num),
				"add_tracking_enabled": validator(false, validationTypes.bool)
			}
		};

		resources.open = {
			destination: config.api_endpoint,
			endpoint: "/v1/open",
			method:	 utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"link_identifier": validator(false, validationTypes.str),
				"device_fingerprint_id": validator(true, branch_id),
				"sdk": validator(false, validationTypes.str),
				"hardware_id": validator(false, validationTypes.str),
				"is_hardware_id_real": validator(false, validationTypes.bool),
				"app_version": validator(false, validationTypes.str),
				"os": validator(false, validationTypes.str),
				"uri_scheme": validator(false, validationTypes.str),
				"os_version": validator(false, validationTypes.str),
				"is_referrable": validator(false, validationTypes.num)
			}
		};

		resources.profile = {
			destination: config.api_endpoint,
			endpoint: "/v1/profile",
			method:	 utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"session_id": validator(true, branch_id),
				"link_click_id": validator(false, branch_id),
				"device_fingerprint_id": validator(true, branch_id),
				"sdk": validator(false, validationTypes.str),
				"identity": validator(true, validationTypes.str)
			}
		};

		resources.close = {
			destination: config.api_endpoint,
			endpoint: "/v1/close",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"session_id": validator(true, branch_id),
				"link_click_id": validator(false, branch_id),
				"device_fingerprint_id": validator(true, branch_id),
				"sdk": validator(false, validationTypes.str)
			}
		};

		resources.logout = {
			destination: config.api_endpoint,
			endpoint: "/v1/logout",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"session_id": validator(true, branch_id),
				"link_click_id": validator(false, branch_id),
				"sdk": validator(false, validationTypes.str),
				"device_fingerprint_id": validator(true, branch_id)
			}
		};

		resources.referrals = {
			destination: config.api_endpoint,
			endpoint: "/v1/referrals",
			method: utils.httpMethod.GET,
			queryPart: { "identity_id": validator(true, branch_id) },
			params: { "sdk": validator(false, validationTypes.str) }
		};

		resources.credits = {
			destination: config.api_endpoint,
			endpoint: "/v1/credits",
			method: utils.httpMethod.GET,
			queryPart: { "identity_id": validator(true, branch_id) },
			params: { "sdk": validator(false, validationTypes.str) }
		};

		resources.creditHistory = {
			destination: config.api_endpoint,
			endpoint: "/v1/credithistory",
			method: utils.httpMethod.GET,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"session_id": validator(true, branch_id),
				"link_click_id": validator(false, branch_id),
				"sdk": validator(false, validationTypes.str),
				"device_fingerprint_id": validator(true, branch_id),
				"length": validator(false, validationTypes.num),
				"direction": validator(false, validationTypes.num),
				"begin_after_id": validator(false, branch_id),
				"bucket": validator(false, validationTypes.str)
			}
		};

		resources.getCode = {
			destination: config.api_endpoint,
			endpoint: "/v1/referralcode",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"session_id": validator(true, branch_id),
				"identity_id": validator(true, branch_id),
				"device_fingerprint_id": validator(true, branch_id),
				"sdk": validator(false, validationTypes.str),
				"prefix": validator(false, validationTypes.str),
				"amount": validator(true, validationTypes.num),
				"expiration": validator(false, validationTypes.str),
				"calculation_type": validator(true, validationTypes.num),
				"location": validator(true, validationTypes.num),
				"creation_type": validator(true, validationTypes.num),
				"type": validator(true, validationTypes.str),
				"bucket": validator(false, validationTypes.str)
			}
		};

		resources.validateCode = {
				destination: config.api_endpoint,
				endpoint: "/v1/referralcode",
				method: utils.httpMethod.POST,
				queryPart: { "code": validator(true, validationTypes.str) },
				params: {
					"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
					"session_id": validator(true, branch_id),
					"identity_id": validator(true, branch_id),
					"device_fingerprint_id": validator(true, branch_id),
					"sdk": validator(false, validationTypes.str)
				}
		};

		resources.applyCode = {
				destination: config.api_endpoint,
				endpoint: "/v1/applycode",
				method: utils.httpMethod.POST,
				queryPart: { "code": validator(true, validationTypes.str) },
				params: {
					"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
					"session_id": validator(true, branch_id),
					"identity_id": validator(true, branch_id),
					"device_fingerprint_id": validator(true, branch_id),
					"sdk": validator(false, validationTypes.str)
				}
		};

		resources.redeem =  {
			destination: config.api_endpoint,
			endpoint: "/v1/redeem",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"session_id": validator(true, branch_id),
				"identity_id": validator(true, branch_id),
				"device_fingerprint_id": validator(true, branch_id),
				"sdk": validator(false, validationTypes.str),
				"amount": validator(true, validationTypes.num),
				"bucket": validator(false, validationTypes.str)
			}
		};

		resources.link = {
			destination: config.api_endpoint,
			endpoint: "/v1/url",
			method: utils.httpMethod.POST,
			ref: "obj",
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"identity_id": validator(true, branch_id),
				"sdk": validator(false, validationTypes.str),
				"data": validator(false, validationTypes.str),
				"alias": validator(false, validationTypes.str),
				"tags": validator(false, validationTypes.arr),
				"feature": validator(false, validationTypes.str),
				"channel": validator(false, validationTypes.str),
				"stage": validator(false, validationTypes.str),
				"type": validator(false, validationTypes.num)
			}
		};

		resources.event = {
			destination: config.api_endpoint,
			endpoint: "/v1/event",
			method: utils.httpMethod.POST,
			params: {
				"branch_key": validator(true, branch_key, "app_id", branch_id),
				"app_id": validator(true, branch_key, "branch_key", branch_id),
				"session_id": validator(true, branch_id),
				"identity_id": validator(true, branch_id),
				"device_fingerprint_id": validator(true, branch_id),
				"sdk": validator(false, validationTypes.str),
				"event": validator(true, validationTypes.str),
				"metadata": validator(true, validationTypes.obj)
			}
		};
}
