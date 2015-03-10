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
var validationTypes = { obj: 0, str: 1, num: 2, arr: 3 };

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
		if (!data) {
			if (required) { return utils.message(utils.messages.missingParam, [ endpoint, param ]); }
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
		// String or regex validator
		else if (typeof data != 'string') {
			return utils.message(utils.messages.invalidType, [ endpoint, param, 'a string' ]);
		}
		else if (type != validationTypes.str && !type.test(data)) {
			return utils.message(utils.messages.invalidType, [ endpoint, param, 'in the proper format' ]);
		}

		return false;
	};
}

var branch_id = /^[0-9]{15,20}$/;

resources.open = {
	destination: config.api_endpoint,
	endpoint: "/v1/open",
	method:	 utils.httpMethod.POST,
	params: {
		"app_id": validator(true, branch_id),
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
		"app_id": validator(true, branch_id),
		"identity_id": validator(true, branch_id),
		"identity": validator(true, validationTypes.str)
	}
};

resources.close = {
	destination: config.api_endpoint,
	endpoint: "/v1/close",
	method: utils.httpMethod.POST,
	params: {
		"app_id": validator(true, branch_id),
		"session_id": validator(true, branch_id)
	}
};

resources.logout = {
	destination: config.api_endpoint,
	endpoint: "/v1/logout",
	method: utils.httpMethod.POST,
	params: {
		"app_id": validator(true, branch_id),
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
		"app_id": validator(true, branch_id),
		"v": validator(true, validationTypes.str)
	}
};

resources.redeem =  {
	destination: config.api_endpoint,
	endpoint: "/v1/redeem",
	method: utils.httpMethod.POST,
	params: {
		"app_id": validator(true, branch_id),
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
		"app_id": validator(true, branch_id),
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
		"phone": validator(true, validationTypes.str)
	}

};

resources.event = {
	destination: config.api_endpoint,
	endpoint: "/v1/event",
	method: utils.httpMethod.POST,
	params: {
		"app_id": validator(true, branch_id),
		"session_id": validator(true, branch_id),
		"event": validator(true, validationTypes.str),
		"metadata": validator(true, validationTypes.obj)
	}
};
