/**
 * This provides a list of endpoints and client-side validation for any calls
 * to those endpoints.
 */
'use strict';

goog.provide('resources');

goog.require('utils');
goog.require('config');

/**
 * @const
 * @type {Object<*,utils.resource>}
 */
var resources = { };

/** @enum {number} */
var validationTypes = {
	OBJECT: 0,
	STRING: 1,
	NUMBER: 2,
	ARRAY: 3,
	BOOLEAN: 4
};

/* jshint ignore:start */

/** @typedef {function(string, string, *)} */
var _validator;

/* jshint ignore:end */

/**
 * @param {boolean} required
 * @param {validationTypes|RegExp} type
 * @throws {Error}
 * @return {_validator}
 */
function validator(required, type) {
	return function(endpoint, param, data) {
		// Must ensure data is not a number before doing a !data otherwise the number can't be 0.
		if ((typeof data !== 'number') && !data) {
			if (required) {
				return utils.message(utils.messages.missingParam, [ endpoint, param ]);
			}
		}
		else if (type === validationTypes.OBJECT) {
			if (typeof data !== 'object') {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'an object' ]);
			}
		}
		else if (type === validationTypes.ARRAY) {
			if (!(data instanceof Array)) {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'an array' ]);
			}
		}
		else if (type === validationTypes.NUMBER) {
			if (typeof data !== 'number') {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'a number' ]);
			}
		}
		else if (type === validationTypes.BOOLEAN) {
			if (typeof data !== 'boolean') {
				return utils.message(utils.messages.invalidType, [ endpoint, param, 'a boolean' ]);
			}
		}
		// String or regex validator
		else if (typeof data !== 'string') {
			return utils.message(utils.messages.invalidType, [ endpoint, param, 'a string' ]);
		}
		else if (type !== validationTypes.STRING && !type.test(data)) {
			return utils.message(
				utils.messages.invalidType,
				[ endpoint, param, 'in the proper format' ]
			);
		}

		return false;
	};
}

var branch_id = /^[0-9]{15,20}$/;

function defaults(obj) {
	var def = {};
	if (WEB_BUILD) {
		def = {
			"browser_fingerprint_id": validator(true, branch_id),
			"identity_id": validator(true, branch_id),
			"sdk": validator(true, validationTypes.STRING),
			"session_id": validator(true, branch_id)
		};
	}
	if (CORDOVA_BUILD || TITANIUM_BUILD) {
		def = {
			"device_fingerprint_id": validator(true, branch_id),
			"identity_id": validator(true, branch_id),
			"sdk": validator(true, validationTypes.STRING),
			"session_id": validator(true, branch_id)
		};
	}
	return utils.merge(obj, def);
}

if (WEB_BUILD) {
	resources.open = {
		destination: config.api_endpoint,
		endpoint: "/v1/open",
		method: utils.httpMethod.POST,
		params: {
			"browser_fingerprint_id": validator(true, branch_id),
			"identity_id": validator(false, branch_id),
			"is_referrable": validator(true, validationTypes.NUMBER),
			"link_identifier": validator(false, validationTypes.STRING),
			"sdk": validator(false, validationTypes.STRING)
		}
	};

	resources._r = {
		destination: config.link_service_endpoint,
		endpoint: "/_r",
		method: utils.httpMethod.GET,
		jsonp: true,
		params: {
			"sdk": validator(true, validationTypes.STRING)
		}
	};

	resources.linkClick = {
		destination: config.link_service_endpoint,
		endpoint: "",
		method: utils.httpMethod.GET,
		queryPart: {
			"link_url": validator(true, validationTypes.STRING)
		},
		params: {
			"click": validator(true, validationTypes.STRING)
		}
	};

	resources.SMSLinkSend = {
		destination: config.link_service_endpoint,
		endpoint: "/c",
		method: utils.httpMethod.POST,
		queryPart: {
			"link_url": validator(true, validationTypes.STRING)
		},
		params: {
			"sdk": validator(false, validationTypes.STRING),
			"phone": validator(true, validationTypes.STRING)
		}
	};
}

if (CORDOVA_BUILD || TITANIUM_BUILD) { // jshint undef:false
	resources.install = {
		destination: config.api_endpoint,
		endpoint: "/v1/install",
		method: utils.httpMethod.POST,
		params: {
			"add_tracking_enabled": validator(false, validationTypes.BOOLEAN),
			"app_version": validator(false, validationTypes.STRING),
			"bluetooth": validator(false, validationTypes.BOOLEAN),
			"bluetooth_version": validator(false, validationTypes.STRING),
			"brand": validator(false, validationTypes.STRING),
			"carrier": validator(false, validationTypes.STRING),
			"hardware_id": validator(false, validationTypes.STRING),
			"has_nfc": validator(false, validationTypes.BOOLEAN),
			"has_telephone": validator(false, validationTypes.BOOLEAN),
			"is_hardware_id_real": validator(false, validationTypes.BOOLEAN),
			"is_referrable": validator(false, validationTypes.NUMBER),
			"link_identifier": validator(false, validationTypes.STRING),
			"push_identifier": validator(false, validationTypes.STRING),
			"android_app_link_url": validator(false, validationTypes.STRING),
			"external_intent_uri": validator(false, validationTypes.STRING),
			"external_intent_extra": validator(false, validationTypes.STRING),
			"model": validator(false, validationTypes.STRING),
			"os": validator(false, validationTypes.STRING),
			"os_version": validator(false, validationTypes.STRING),
			"screen_dpi": validator(false, validationTypes.NUMBER),
			"screen_height": validator(false, validationTypes.NUMBER),
			"screen_width": validator(false, validationTypes.NUMBER),
			"sdk": validator(false, validationTypes.STRING),
			"universal_link_url": validator(false, validationTypes.STRING),
			"update": validator(false, validationTypes.NUMBER),
			"uri_scheme": validator(false, validationTypes.STRING)
		}
	};

	resources.open = {
		destination: config.api_endpoint,
		endpoint: "/v1/open",
		method: utils.httpMethod.POST,
		params: {
			"app_version": validator(false, validationTypes.STRING),
			"device_fingerprint_id": validator(true, branch_id),
			"hardware_id": validator(false, validationTypes.STRING),
			"identity_id": validator(true, branch_id),
			"is_hardware_id_real": validator(false, validationTypes.BOOLEAN),
			"is_referrable": validator(false, validationTypes.NUMBER),
			"link_identifier": validator(false, validationTypes.STRING),
			"push_identifier": validator(false, validationTypes.STRING),
			"android_app_link_url": validator(false, validationTypes.STRING),
			"external_intent_uri": validator(false, validationTypes.STRING),
			"external_intent_extra": validator(false, validationTypes.STRING),
			"os": validator(false, validationTypes.STRING),
			"os_version": validator(false, validationTypes.STRING),
			"sdk": validator(false, validationTypes.STRING),
			"universal_link_url": validator(false, validationTypes.STRING),
			"uri_scheme": validator(false, validationTypes.STRING)
		}
	};

	resources.close = {
		destination: config.api_endpoint,
		endpoint: "/v1/close",
		method: utils.httpMethod.POST,
		params: {
			"device_fingerprint_id": validator(true, branch_id),
			"identity_id": validator(true, branch_id),
			"link_click_id": validator(false, branch_id),
			"sdk": validator(true, validationTypes.STRING),
			"session_id": validator(true, branch_id)
		}
	};
}

resources.getCode = {
	destination: config.api_endpoint,
	endpoint: "/v1/referralcode",
	method: utils.httpMethod.POST,
	params: defaults({
		"amount": validator(true, validationTypes.NUMBER),
		"bucket": validator(false, validationTypes.STRING),
		"calculation_type": validator(true, validationTypes.NUMBER),
		"creation_source": validator(true, validationTypes.NUMBER),
		"expiration": validator(false, validationTypes.STRING),
		"location": validator(true, validationTypes.NUMBER),
		"prefix": validator(false, validationTypes.STRING),
		"type": validator(true, validationTypes.STRING)
	})
};

resources.validateCode = {
	destination: config.api_endpoint,
	endpoint: "/v1/referralcode",
	method: utils.httpMethod.POST,
	queryPart: {
		"code": validator(true, validationTypes.STRING)
	},
	params: defaults({ })
};

resources.applyCode = {
	destination: config.api_endpoint,
	endpoint: "/v1/applycode",
	method: utils.httpMethod.POST,
	queryPart: {
		"code": validator(true, validationTypes.STRING)
	},
	params: defaults({ })
};

resources.logout = {
	destination: config.api_endpoint,
	endpoint: "/v1/logout",
	method: utils.httpMethod.POST,
	params: defaults({
		"session_id": validator(true, branch_id)
	})
};

resources.profile = {
	destination: config.api_endpoint,
	endpoint: "/v1/profile",
	method: utils.httpMethod.POST,
	params: defaults({
		"identity_id": validator(true, branch_id),
		"identity": validator(true, validationTypes.STRING)
	})
};

resources.referrals = {
	destination: config.api_endpoint,
	endpoint: "/v1/referrals",
	method: utils.httpMethod.GET,
	queryPart: {
		"identity_id": validator(true, branch_id)
	},
	params: defaults({ })
};

resources.creditHistory = {
	destination: config.api_endpoint,
	endpoint: "/v1/credithistory",
	method: utils.httpMethod.GET,
	params: defaults({
		"begin_after_id": validator(false, branch_id),
		"bucket": validator(false, validationTypes.STRING),
		"direction": validator(false, validationTypes.NUMBER),
		"length": validator(false, validationTypes.NUMBER),
		"link_click_id": validator(false, branch_id)
	})
};

resources.credits = {
	destination: config.api_endpoint,
	endpoint: "/v1/credits",
	method: utils.httpMethod.GET,
	queryPart: {
		"identity_id": validator(true, branch_id)
	},
	params: defaults({ })
};

resources.redeem = {
	destination: config.api_endpoint,
	endpoint: "/v1/redeem",
	method: utils.httpMethod.POST,
	params: defaults({
		"amount": validator(true, validationTypes.NUMBER),
		"bucket": validator(true, validationTypes.STRING),
		"identity_id": validator(true, branch_id)
	})
};

resources.link = {
	destination: config.api_endpoint,
	endpoint: "/v1/url",
	method: utils.httpMethod.POST,
	ref: "obj",
	params: defaults({
		"alias": validator(false, validationTypes.STRING),
		"campaign": validator(false, validationTypes.STRING),
		"channel": validator(false, validationTypes.STRING),
		"data": validator(false, validationTypes.STRING),
		"feature": validator(false, validationTypes.STRING),
		"identity_id": validator(true, branch_id),
		"stage": validator(false, validationTypes.STRING),
		"tags": validator(false, validationTypes.ARRAY),
		"type": validator(false, validationTypes.NUMBER)
	})
};

resources.deepview = {
	destination: config.api_endpoint,
	endpoint: "/v1/deepview",
	jsonp: true,
	method: utils.httpMethod.POST,
	params: defaults({
		"campaign": validator(false, validationTypes.STRING),
		"channel": validator(false, validationTypes.STRING),
		"data": validator(true, validationTypes.STRING),
		"feature": validator(false, validationTypes.STRING),
		"link_click_id": validator(false, validationTypes.STRING),
		"open_app": validator(false, validationTypes.BOOLEAN),
		"stage": validator(false, validationTypes.STRING),
		"tags": validator(false, validationTypes.ARRAY)
	})
};

resources.hasApp = {
	destination: config.api_endpoint,
	endpoint: "/v1/has-app",
	method: utils.httpMethod.GET,
	params: {
		"browser_fingerprint_id": validator(true, branch_id)
	}
};

resources.event = {
	destination: config.api_endpoint,
	endpoint: "/v1/event",
	method: utils.httpMethod.POST,
	params: defaults({
		"event": validator(true, validationTypes.STRING),
		"metadata": validator(true, validationTypes.OBJECT)
	})
};
