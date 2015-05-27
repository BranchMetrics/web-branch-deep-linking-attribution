(function() {

// ===================================================================================================
// For whatever dumb reason, this is only available as a bower component, so I'm just pasting it here.

// Object.create compatible in IE
var create = Object.create || function(p) {
	if (!p) { throw Error('no type'); }
	function F() {};
	F.prototype = p;
	return new F();
};

// UTILITY
var util = {
	isArray: function(ar) { return Array.isArray(ar); },
	isBoolean: function(arg) { return typeof arg === 'boolean'; },
	isNull: function(arg) { return arg === null; },
	isNullOrUndefined: function(arg) { return arg == null; },
	isNumber: function(arg) { return typeof arg === 'number'; },
	isString: function(arg) { return typeof arg === 'string'; },
	isSymbol: function(arg) { return typeof arg === 'symbol'; },
	isUndefined: function(arg) { return arg === void 0; },
	isRegExp: function(re) { return util.isObject(re) && util.objectToString(re) === '[object RegExp]'; },
	isObject: function(arg) { return typeof arg === 'object' && arg !== null; },
	isDate: function(d) { return util.isObject(d) && util.objectToString(d) === '[object Date]'; },
	isError: function(e) { return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error); },
	isFunction: function(arg) { return typeof arg === 'function'; },
	isPrimitive: function(arg) {
		return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'symbol' || typeof arg === 'undefined';
	},
	objectToString: function(o) { return Object.prototype.toString.call(o); }
};

var pSlice = Array.prototype.slice;
var Object_keys = typeof Object.keys === 'function' ? Object.keys : function(obj) { var keys = []; for (var key in obj) { keys.push(key); } return keys; };
var assert = ok;
assert.AssertionError = function AssertionError(options) {
	this.name = 'AssertionError';
	this.actual = options.actual;
	this.expected = options.expected;
	this.operator = options.operator;
	if (options.message) {
		this.message = options.message;
		this.generatedMessage = false;
	}
	else {
		this.message = getMessage(this);
		this.generatedMessage = true;
	}
	var stackStartFunction = options.stackStartFunction || fail;

	if (Error.captureStackTrace) { Error.captureStackTrace(this, stackStartFunction); }
	else {
		try { this.stack = (new Error).stack.toString(); } catch (e) {}
	}
};
assert.AssertionError.prototype = create(Error.prototype, { constructor: { value: assert, enumerable: false, writable: true, configurable: true } });

function replacer(key, value) {
	if (util.isUndefined(value)) { return '' + value; }
	if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) { return value.toString(); }
	if (util.isFunction(value) || util.isRegExp(value)) { return value.toString(); }
	return value;
}

function truncate(s, n) {
	if (util.isString(s)) { return s.length < n ? s : s.slice(0, n); }
	else { return s; }
}

function getMessage(self) {
	return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' + self.operator + ' ' + truncate(JSON.stringify(self.expected, replacer), 128);
}

function fail(actual, expected, message, operator, stackStartFunction) {
	throw new assert.AssertionError({
		message: message,
		actual: actual,
		expected: expected,
		operator: operator,
		stackStartFunction: stackStartFunction
	});
}
assert.fail = fail;
function ok(value, message) { if (!value) { fail(value, true, message, '==', assert.ok); } }
assert.ok = ok;
assert.equal = function equal(actual, expected, message) { if (actual != expected) { fail(actual, expected, message, '==', assert.equal); } };
assert.notEqual = function notEqual(actual, expected, message) {
	if (actual == expected) { fail(actual, expected, message, '!=', assert.notEqual); }
};
assert.deepEqual = function deepEqual(actual, expected, message) {
	if (!_deepEqual(actual, expected)) { fail(actual, expected, message, 'deepEqual', assert.deepEqual); }
};

function _deepEqual(actual, expected) {
	if (actual === expected) { return true; }
	else if (util.isDate(actual) && util.isDate(expected)) {
		return actual.getTime() === expected.getTime();
	}
	else if (util.isRegExp(actual) && util.isRegExp(expected)) {
		return actual.source === expected.source && actual.global === expected.global && actual.multiline === expected.multiline && actual.lastIndex === expected.lastIndex && actual.ignoreCase === expected.ignoreCase;
	}
	else if (!util.isObject(actual) && !util.isObject(expected)) {
		return actual == expected;
	}
	else {
		return objEquiv(actual, expected);
	}
}
function isArguments(object) {
	return Object.prototype.toString.call(object) == '[object Arguments]';
}
function objEquiv(a, b) {
	if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b)) { return false; }
	// an identical 'prototype' property.
	if (a.prototype !== b.prototype) { return false; }
	// ~~~I've managed to break Object.keys through screwy arguments passing.
	// Converting to array solves the problem.
	if (isArguments(a)) {
		if (!isArguments(b)) {
			return false;
		}
		a = pSlice.call(a);
		b = pSlice.call(b);
		return _deepEqual(a, b);
	}
	try {
		var ka = Object_keys(a), kb = Object_keys(b), key, i;
	}
	catch (e) {
		// happens when one is a string literal and the other isn't
		return false;
	}
	// having the same number of owned properties (keys incorporates
	// hasOwnProperty)
	if (ka.length != kb.length) { return false; }
	// the same set of keys (although not necessarily the same order),
	ka.sort();
	kb.sort();
	// ~~~cheap key test
	for (i = ka.length - 1; i >= 0; i--) {
		if (ka[i] != kb[i]) { return false; }
	}
	// equivalent values for every corresponding key, and
	// ~~~possibly expensive deep test
	for (i = ka.length - 1; i >= 0; i--) {
		key = ka[i];
		if (!_deepEqual(a[key], b[key])) { return false; }
	}
	return true;
};
assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
	if (_deepEqual(actual, expected)) { fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual); }
};
assert.strictEqual = function strictEqual(actual, expected, message) {
	if (actual !== expected) { fail(actual, expected, message, '===', assert.strictEqual); }
};
assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
	if (actual === expected) { fail(actual, expected, message, '!==', assert.notStrictEqual); }
};
function expectedException(actual, expected) {
	if (!actual || !expected) { return false; }
	if (Object.prototype.toString.call(expected) == '[object RegExp]') { return expected.test(actual); }
	else if (actual instanceof expected) { return true; }
	else if (expected.call({}, actual) === true) { return true; }
	return false;
}

function _throws(shouldThrow, block, expected, message) {
	var actual;

	if (util.isString(expected)) { message = expected; expected = null; }

	try { block(); }
	catch (e) { actual = e; }

	message = (expected && expected.name ? ' (' + expected.name + ').' : '.') + (message ? ' ' + message : '.');
	if (shouldThrow && !actual) { fail(actual, expected, 'Missing expected exception' + message); }
	if (!shouldThrow && expectedException(actual, expected)) { fail(actual, expected, 'Got unwanted exception' + message); }
	if ((shouldThrow && actual && expected && !expectedException(actual, expected)) || (!shouldThrow && actual)) { throw actual; }
}
assert.throws = function(block, /*optional*/error, /*optional*/message) { _throws.apply(this, [ true ].concat(pSlice.call(arguments))); };
assert.doesNotThrow = function(block, /*optional*/message) { _throws.apply(this, [ false ].concat(pSlice.call(arguments))); };
assert.ifError = function(err) { if (err) { throw err; } };

// ===================================================================================================


window.branch_sample_key = 'key_live_ljmAgMXod0f4V0wNEf4ZubhpphenI4wS',
window.session_id = '98807509250212101',
window.identity_id = '98807509250212101',
window.browser_fingerprint_id = '79336952217731267';

window.console = console || { log: function() {} };

window.testUtils = testUtils = {};

testUtils.params = function(extra, without) {
	// Returns new object every time.
	var p = utils.merge({
		branch_key: branch_sample_key,
		session_id: session_id,
		identity_id: identity_id,
		browser_fingerprint_id: browser_fingerprint_id,
		sdk: 'web0.0.0'
	}, extra || {});
	for (var k = 0; k < (without || []).length; k++) {
		delete p[without[k]];
	}
	return p;
};

testUtils.nulls = function(n) {
	var p = [];
	for (var k = 0; k < n; k++) { p.push(null); }
	return p;
};
testUtils.after = function(n, done) {
	var remaining = n;
	return function() {
		remaining--;
		if (remaining == 0) { done(); }
		if (remaining < 0) { console.log('ERROR!!! More calls than planned'); }
	};
};
var assertions = [ 'fail', 'equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrinctEqual', 'throws', 'doesNotThrow', 'ifError' ];
testUtils.plan = function(n, done) {
	var d = testUtils.after(n, done);
	var ret = function() {
		assert.apply(assert, Array.prototype.slice.call(arguments, 0));
		d();
	};
	function create(name) {
		ret[name] = function() {
			assert[name].apply(assert, Array.prototype.slice.call(arguments, 0));
			d();
		};
	}
	for (var i = 0; i < assertions.length; i++) { create(assertions[i]) }

	ret.done = function(err) {
		return ret(!err);
	};

	return ret;
};

testUtils.unplanned = function() { return assert; };

testUtils.go = function(suffix) {
	var new_location = window.location.toString().split(/[\?#]/)[0] + suffix;
	if (new_location != window.location.toString()) {
		window.history.pushState({}, '', new_location);
	}
};


})();
