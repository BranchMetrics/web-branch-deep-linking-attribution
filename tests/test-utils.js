var app_id = '5680621892404085',
	session_id = '98807509250212101',
	identity_id = '98807509250212101',
	browser_fingerprint_id = '79336952217731267';

function params(extra, without) {
	// Returns new object every time.
	var p = utils.merge({
		app_id: app_id,
		session_id: session_id,
		identity_id: identity_id,
		browser_fingerprint_id: browser_fingerprint_id
	}, extra || {});
	for (var k = 0; k < (without || []).length; k++) {
		delete p[without[k]];
	}
	return p;
}

// May not need this because I found assert.deepEqual, but going to leave it here just in case since I wrote it...
function deepCompare(obj1, obj2) {
	for (var key in obj1) {
		try {
			if (typeof obj1[key] == 'object') {
				if (!deepCompare(obj1[key], obj2[key])) {
					return false;
				}
			}
			else {
				if (obj1[key] != obj2[key]) {
					return false;
				}
			}
		}
		catch (e) {
			return false;
		}
		return true;
	}
}


// ===================================================================================================
// For whatever dumb reason, this is only available as a bower component, so I'm just pasting it here.

(function(global) {

// Object.create compatible in IE
var create = Object.create || function(p) {
	if (!p) { throw Error('no type'); }
	function F() {};
	F.prototype = p;
	return new F();
};

// UTILITY
var util = {
	inherits: function(ctor, superCtor) {
		ctor.super_ = superCtor;
		ctor.prototype = create(superCtor.prototype, {
			constructor: {
				value: ctor,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
	},
	isArray: function(ar) {
		return Array.isArray(ar);
	},
	isBoolean: function(arg) {
		return typeof arg === 'boolean';
	},
	isNull: function(arg) {
		return arg === null;
	},
	isNullOrUndefined: function(arg) {
		return arg == null;
	},
	isNumber: function(arg) {
		return typeof arg === 'number';
	},
	isString: function(arg) {
		return typeof arg === 'string';
	},
	isSymbol: function(arg) {
		return typeof arg === 'symbol';
	},
	isUndefined: function(arg) {
		return arg === void 0;
	},
	isRegExp: function(re) {
		return util.isObject(re) && util.objectToString(re) === '[object RegExp]';
	},
	isObject: function(arg) {
		return typeof arg === 'object' && arg !== null;
	},
	isDate: function(d) {
		return util.isObject(d) && util.objectToString(d) === '[object Date]';
	},
	isError: function(e) {
		return isObject(e) &&
			(objectToString(e) === '[object Error]' || e instanceof Error);
	},
	isFunction: function(arg) {
		return typeof arg === 'function';
	},
	isPrimitive: function(arg) {
		return arg === null ||
			typeof arg === 'boolean' ||
			typeof arg === 'number' ||
			typeof arg === 'string' ||
			typeof arg === 'symbol' ||	// ES6 symbol
			typeof arg === 'undefined';
	},
	objectToString: function(o) {
		return Object.prototype.toString.call(o);
	}
};

var pSlice = Array.prototype.slice;

// from https://github.com/substack/node-deep-equal
var Object_keys = typeof Object.keys === 'function'
		? Object.keys
		: function(obj) {
				var keys = [];
				for (var key in obj) { keys.push(key); }
				return keys;
		}
;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = ok;

global['assert'] = assert;

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = assert;
};

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

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

	if (Error.captureStackTrace) {
		Error.captureStackTrace(this, stackStartFunction);
	}
	else {
		// try to throw an error now, and from the stack property
		// work out the line that called in to assert.js.
		try {
			this.stack = (new Error).stack.toString();
		} catch (e) {}
	}
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
	if (util.isUndefined(value)) {
		return '' + value;
	}
	if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
		return value.toString();
	}
	if (util.isFunction(value) || util.isRegExp(value)) {
		return value.toString();
	}
	return value;
}

function truncate(s, n) {
	if (util.isString(s)) {
		return s.length < n ? s : s.slice(0, n);
	}
	else {
		return s;
	}
}

function getMessage(self) {
	return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
				 self.operator + ' ' +
				 truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.	All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
	throw new assert.AssertionError({
		message: message,
		actual: actual,
		expected: expected,
		operator: operator,
		stackStartFunction: stackStartFunction
	});
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
	if (!value) { fail(value, true, message, '==', assert.ok); }
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
	if (actual != expected) { fail(actual, expected, message, '==', assert.equal); }
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
	if (actual == expected) {
		fail(actual, expected, message, '!=', assert.notEqual);
	}
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
	if (!_deepEqual(actual, expected)) {
		fail(actual, expected, message, 'deepEqual', assert.deepEqual);
	}
};

function _deepEqual(actual, expected) {
	// 7.1. All identical values are equivalent, as determined by ===.
	if (actual === expected) {
		return true;

	// } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
	//   if (actual.length != expected.length) return false;
	//
	//   for (var i = 0; i < actual.length; i++) {
	//  	 if (actual[i] !== expected[i]) return false;
	//   }
	//
	//   return true;

	// 7.2. If the expected value is a Date object, the actual value is
	// equivalent if it is also a Date object that refers to the same time.
	}
	else if (util.isDate(actual) && util.isDate(expected)) {
		return actual.getTime() === expected.getTime();

	// 7.3 If the expected value is a RegExp object, the actual value is
	// equivalent if it is also a RegExp object with the same source and
	// properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
	}
	else if (util.isRegExp(actual) && util.isRegExp(expected)) {
		return actual.source === expected.source &&
					 actual.global === expected.global &&
					 actual.multiline === expected.multiline &&
					 actual.lastIndex === expected.lastIndex &&
					 actual.ignoreCase === expected.ignoreCase;

	// 7.4. Other pairs that do not both pass typeof value == 'object',
	// equivalence is determined by ==.
	}
	else if (!util.isObject(actual) && !util.isObject(expected)) {
		return actual == expected;

	// 7.5 For all other Object pairs, including Array objects, equivalence is
	// determined by having the same number of owned properties (as verified
	// with Object.prototype.hasOwnProperty.call), the same set of keys
	// (although not necessarily the same order), equivalent values for every
	// corresponding key, and an identical 'prototype' property. Note: this
	// accounts for both named and indexed properties on Arrays.
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
		var ka = Object_keys(a),
				kb = Object_keys(b),
				key, i;
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
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
	if (_deepEqual(actual, expected)) {
		fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
	}
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
	if (actual !== expected) {
		fail(actual, expected, message, '===', assert.strictEqual);
	}
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.	assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
	if (actual === expected) {
		fail(actual, expected, message, '!==', assert.notStrictEqual);
	}
};

function expectedException(actual, expected) {
	if (!actual || !expected) {
		return false;
	}

	if (Object.prototype.toString.call(expected) == '[object RegExp]') {
		return expected.test(actual);
	}
	else if (actual instanceof expected) {
		return true;
	}
	else if (expected.call({}, actual) === true) {
		return true;
	}

	return false;
}

function _throws(shouldThrow, block, expected, message) {
	var actual;

	if (util.isString(expected)) {
		message = expected;
		expected = null;
	}

	try {
		block();
	} catch (e) {
		actual = e;
	}

	message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
						(message ? ' ' + message : '.');

	if (shouldThrow && !actual) {
		fail(actual, expected, 'Missing expected exception' + message);
	}

	if (!shouldThrow && expectedException(actual, expected)) {
		fail(actual, expected, 'Got unwanted exception' + message);
	}

	if ((shouldThrow && actual && expected &&
			!expectedException(actual, expected)) || (!shouldThrow && actual)) {
		throw actual;
	}
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
	_throws.apply(this, [ true ].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
	_throws.apply(this, [ false ].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

})(this);



