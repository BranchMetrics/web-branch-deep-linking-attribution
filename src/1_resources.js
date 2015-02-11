/**
 * This provides a list of endpoints and client-side validation for any calls
 * to those endpoints.
 */

goog.provide('resources');
goog.require('utils')
goog.require('config');

/** @enum {string} */
var methods = { POST: 'POST', GET: 'GET' };

/** @enum {string} */
var validationTypes = { obj: 0, str: 1, num: 2, arr: 3 };

/** @typedef {function(string, string, *)} */
resources.validator;
/** @typedef {{destination: string, endpoint: string, method: {methods}, params: Object.<string, resources.validator>, queryPart: Object.<string, resources.validator>, jsonp: boolean }} */
resources.resource;

/**
 * @param {boolean} required
 * @param {validationTypes|RegExp} type
 * @throws {Error}
 * @returns {resources.validator}
 */
function validator(required, type) {
	return function(endpoint, param, data) {
		if (!data) {
			if (required) { utils.error(utils.messages.missingParam, [ endpoint, param ]); }
		}
		else {
			if (type == validationTypes.obj) {
				if (typeof data != 'object') { utils.error(utils.messages.invalidType, [ endpoint, param, 'an object' ]); }
			}
			else if (type == validationTypes.arr) {
				if (!(data instanceof Array)) { utils.error(utils.messages.invalidType, [ endpoint, param, 'an array' ]); }
			}
			else if (type == validationTypes.str) {
				if (typeof data != 'string') { utils.error(utils.messages.invalidType, [ endpoint, param, 'a string' ]); }
			}
			else if (type == validationTypes.num) {
				if (typeof data != 'number') { utils.error(utils.messages.invalidType, [ endpoint, param, 'a number' ]); }
			}
			else if (type) {
				if (!type.test(data)) { utils.error(utils.messages.invalidType, [ endpoint, param, 'in the proper format' ]); }
			}
		}
		return data;
	}
}

var branch_id = /^[0-9]{15,20}$/;

/** @type {resources.resource} */
resources.open = {
	destination: config.api_endpoint,
	endpoint: '/v1/open',
	method:	 'POST',
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
	endpoint: '/v1/profile',
	method:	 'POST',
	params: {
		"app_id": validator(true, branch_id),
		"identity_id": validator(true, branch_id),
		"identity": validator(true, validationTypes.str)
	}
};
/** @type {resources.resource} */
resources.close = {
	destination: config.api_endpoint,
	endpoint: '/v1/close',
	method: 'POST',
	params: {
		"app_id": validator(true, branch_id),
		"session_id": validator(true, branch_id)
	}
};
/** @type {resources.resource} */
resources.logout = {
	destination: config.api_endpoint,
	endpoint: '/v1/logout',
	method: 'POST',
	params: {
		"app_id": validator(true, branch_id),
		"session_id": validator(true, branch_id)
	}
};
/** @type {resources.resource} */
resources.referrals = {
	destination: config.api_endpoint,
	endpoint: '/v1/referrals',
	method: 'GET',
	queryPart: { "identity_id": validator(true, branch_id) }
};
/** @type {resources.resource} */
resources.credits = {
	destination: config.api_endpoint,
	endpoint: '/v1/credits',
	method: 'GET',
	queryPart: { "identity_id": validator(true, branch_id) }
};
/** @type {resources.resource} */
resources._r = {
	destination: config.link_service_endpoint,
	endpoint: '/_r',
	method: 'GET',
	jsonp: true,
	params: {
		"app_id": validator(true, branch_id)
	}
};
/** @type {resources.resource} */
resources.redeem =  {
	destination: config.api_endpoint,
	endpoint: '/v1/redeem',
	method: 'POST',
	params: {
		"app_id": validator(true, branch_id),
		"identity_id": validator(true, branch_id),
		"amount": validator(true, validationTypes.num),
		"bucket": validator(false, validationTypes.str)
	}
};
/** @type {resources.resource} */
resources.link = {
	destination: config.api_endpoint,
	endpoint: '/v1/url',
	method: 'POST',
	ref: 'obj',
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
/** @type {resources.resource} */
resources.linkClick = {
	destination: config.link_service_endpoint,
	endpoint: '',
	method: 'GET',
	queryPart: { "link_url": validator(true, validationTypes.str) },
	params: { "click": validator(true, validationTypes.str) }
};
/** @type {resources.resource} */
resources.sendSMSLink = {
	destination: config.link_service_endpoint,
	endpoint: '/c',
	method: 'POST',
	queryPart: {
		"link_url": validator(true, validationTypes.str)
	},
	params: {
		"phone": validator(true, validationTypes.str)
	}
	
};
/** @type {resources.resource} */
resources.event = {
	destination: config.api_endpoint,
	endpoint: '/v1/event',
	method: 'POST',
	params: {
		"app_id": validator(true, branch_id),
		"session_id": validator(true, branch_id),
		"event": validator(true, validationTypes.str),
		"metadata": validator(true, validationTypes.obj)
	}
};
