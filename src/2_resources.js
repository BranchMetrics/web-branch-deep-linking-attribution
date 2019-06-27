/**
 * This provides a list of endpoints and client-side validation for any calls
 * to those endpoints.
 */
'use strict';

goog.provide('resources');

goog.require('utils');
goog.require('config');

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
		// Ignores request validation when tracking is disabled because information will be intentionally missing from requests
		if (utils.userPreferences.trackingDisabled) {
			return false;
		}
		// Ensure data is not a number before doing a !data otherwise the number can't be 0.
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
	var def = {
		"browser_fingerprint_id": validator(true, branch_id),
		"identity_id": validator(true, branch_id),
		"sdk": validator(true, validationTypes.STRING),
		"session_id": validator(true, branch_id)
	};
	return utils.merge(obj, def);
}

resources.open = {
	destination: config.api_endpoint,
	endpoint: "/v1/open",
	method: utils.httpMethod.POST,
	params: {
		"browser_fingerprint_id": validator(false, branch_id),
		"alternative_browser_fingerprint_id": validator(false, branch_id),
		"identity_id": validator(false, branch_id),
		"link_identifier": validator(false, validationTypes.STRING),
		"sdk": validator(false, validationTypes.STRING),
		"options": validator(false, validationTypes.OBJECT),
		"initial_referrer": validator(false, validationTypes.STRING),
		"tracking_disabled": validator(false, validationTypes.BOOLEAN)
	}
};

resources._r = {
	destination: config.app_service_endpoint,
	endpoint: "/_r",
	method: utils.httpMethod.GET,
	jsonp: true,
	params: {
		"sdk": validator(true, validationTypes.STRING),
		"_t": validator(false, branch_id),
		"branch_key": validator(true, validationTypes.STRING)
	}
};

resources.linkClick = {
	destination: "",
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
	params: defaults({
		"branch_key": validator(true, validationTypes.STRING),
		"identity": validator(true, validationTypes.STRING)
	})
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
		"type": validator(false, validationTypes.NUMBER),
		"source": validator(false, validationTypes.STRING),
		"instrumentation": validator(false, validationTypes.STRING)
	})
};

resources.deepview = {
	destination: config.api_endpoint,
	endpoint: "/v1/deepview",
	jsonp: true,
	method: utils.httpMethod.POST,
	params: defaults({
		"campaign": validator(false, validationTypes.STRING),
		"_t": validator(false, branch_id),
		"channel": validator(false, validationTypes.STRING),
		"data": validator(true, validationTypes.STRING),
		"feature": validator(false, validationTypes.STRING),
		"link_click_id": validator(false, validationTypes.STRING),
		"open_app": validator(false, validationTypes.BOOLEAN),
		"append_deeplink_path": validator(false, validationTypes.BOOLEAN),
		"stage": validator(false, validationTypes.STRING),
		"tags": validator(false, validationTypes.ARRAY),
		"deepview_type": validator(true, validationTypes.STRING),
		"source": validator(true, validationTypes.STRING)
	})
};

resources.hasApp = {
	destination: config.api_endpoint,
	endpoint: "/v1/has-app",
	method: utils.httpMethod.GET,
	params: {
		"browser_fingerprint_id": validator(true, branch_id),
		"instrumentation": validator(false, validationTypes.STRING)
	}
};

resources.event = {
	destination: config.api_endpoint,
	endpoint: "/v1/event",
	method: utils.httpMethod.POST,
	params: defaults({
		"event": validator(true, validationTypes.STRING),
		"metadata": validator(true, validationTypes.OBJECT),
		"initial_referrer": validator(false, validationTypes.STRING),
		"tracking_disabled": validator(false, validationTypes.BOOLEAN)
	})
};

resources.commerceEvent = {
	destination: config.api_endpoint,
	endpoint: "/v1/event",
	method: utils.httpMethod.POST,
	params: defaults({
		"event": validator(true, validationTypes.STRING),
		"metadata": validator(false, validationTypes.OBJECT),
		"initial_referrer": validator(false, validationTypes.STRING),
		"commerce_data": validator(true, validationTypes.OBJECT)
	})
};

// v2/event endpoints

resources.logStandardEvent = {
	destination: config.api_endpoint,
	endpoint: "/v2/event/standard",
	method: utils.httpMethod.POST,
	params: {
		"name": validator(true, validationTypes.STRING),
		"user_data": validator(true, validationTypes.STRING),
		"custom_data": validator(false, validationTypes.STRING),
		"event_data": validator(false, validationTypes.STRING),
		"content_items": validator(false, validationTypes.STRING)
	}
};

resources.logCustomEvent = {
	destination: config.api_endpoint,
	endpoint: "/v2/event/custom",
	method: utils.httpMethod.POST,
	params: {
		"name": validator(true, validationTypes.STRING),
		"user_data": validator(true, validationTypes.STRING),
		"custom_data": validator(false, validationTypes.STRING)
	}
};

resources.pageview = {
	destination: config.api_endpoint,
	endpoint: "/v1/pageview",
	method: utils.httpMethod.POST,
	params: defaults({
		"event": validator(true, validationTypes.STRING),
		"metadata": validator(false, validationTypes.OBJECT),
		"initial_referrer": validator(false, validationTypes.STRING),
		"tracking_disabled": validator(false, validationTypes.BOOLEAN),
		"branch_view_id": validator(false, validationTypes.STRING),
		"no_journeys": validator(false, validationTypes.BOOLEAN),
		"user_language": validator(false, validationTypes.STRING),
		"open_app": validator(false, validationTypes.BOOLEAN),
		"has_app_websdk": validator(false, validationTypes.BOOLEAN),
		"source": validator(false, validationTypes.STRING),
		"feature": validator(false, validationTypes.STRING),
		"is_iframe": validator(false, validationTypes.BOOLEAN),
		"data": validator(false, validationTypes.OBJECT),
		"callback_string": validator(false, validationTypes.STRING),
		"journey_displayed": validator(false, validationTypes.BOOLEAN),
		"audience_rule_id": validator(false, validationTypes.STRING),
		"journey_dismissals": validator(false, validationTypes.OBJECT)
	})
};

resources.dismiss = {
	destination: config.api_endpoint,
	endpoint: "/v1/dismiss",
	method: utils.httpMethod.POST,
	params: defaults({
		"event": validator(true, validationTypes.STRING),
		"metadata": validator(false, validationTypes.OBJECT),
		"initial_referrer": validator(false, validationTypes.STRING),
		"tracking_disabled": validator(false, validationTypes.BOOLEAN),
		"branch_view_id": validator(false, validationTypes.STRING),
		"no_journeys": validator(false, validationTypes.BOOLEAN),
		"user_language": validator(false, validationTypes.STRING),
		"open_app": validator(false, validationTypes.BOOLEAN),
		"has_app_websdk": validator(false, validationTypes.BOOLEAN),
		"source": validator(false, validationTypes.STRING),
		"feature": validator(false, validationTypes.STRING),
		"is_iframe": validator(false, validationTypes.BOOLEAN),
		"data": validator(false, validationTypes.OBJECT),
		"callback_string": validator(false, validationTypes.STRING),
		"journey_displayed": validator(false, validationTypes.BOOLEAN),
		"audience_rule_id": validator(false, validationTypes.STRING),
		"journey_dismissals": validator(false, validationTypes.OBJECT)
	})
};

