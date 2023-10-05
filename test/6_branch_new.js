'use strict';
/*jshint -W079 */
var sinon = require('sinon');

goog.require('Branch');
goog.require('utils');

describe('Branch - new', function() {
	var branch_instance = new Branch();
	var assert = testUtils.unplanned();
	afterEach(function() {
		sinon.restore();
	});
	describe('referringLink', function() {
		it('test method exists', function() {
			sinon.assert.match(typeof branch_instance.referringLink, "function");
		});
	});
	describe('setRequestMetaData', function() {
		var addPropertyIfNotNullSpy;
		beforeEach(function() {
			addPropertyIfNotNullSpy = sinon.spy(utils, 'addPropertyIfNotNull');
		});
		it('test method exists', function() {
			sinon.assert.match(typeof branch_instance.setRequestMetaData, "function");
		});
		it('should set metadata for a valid key and value', function() {
			var key = 'validKey';
			var value = 'validValue';
			var requestMetadata = {
			};
			var result = branch_instance.setRequestMetaData.call({ requestMetadata: requestMetadata }, key, value);
			assert.strictEqual(result, undefined);
			sinon.assert.calledOnce(addPropertyIfNotNullSpy);
			assert.deepEqual(requestMetadata, { "validKey": "validValue" });
		});

		it('should delete metadata for a key when value is null', function() {
			var requestMetadata = { "keyToDelete": "value" };
			branch_instance.setRequestMetaData.call({ requestMetadata: requestMetadata }, "keyToDelete", null);
			assert.deepEqual(requestMetadata, {});
		});

		it('should not modify metadata for an invalid key or undefined value', function() {
			var invalidKey = null;
			var undefinedValue;
			var requestMetadata = { "key": "value" };

			var result1 = branch_instance.setRequestMetaData.call({ requestMetadata: requestMetadata }, invalidKey, 'validValue');
			var result2 = branch_instance.setRequestMetaData.call({ requestMetadata: requestMetadata }, 'validKey', undefinedValue);
			assert.strictEqual(result1, undefined);
			assert.strictEqual(result2, undefined);
			sinon.assert.notCalled(addPropertyIfNotNullSpy);
			assert.deepEqual(requestMetadata, { "key": "value" });
		});
	});
	/*
	describe('setRequestMetaData - exceptions', function() {
		it('should throw exception', function() {
			var logSpy = sinon.spy(console, 'log');
			sinon.stub(utils, 'addPropertyIfNotNull').throws(new Error("fake error"));
			branch_instance.setRequestMetaData.call({ requestMetadata: {} }, "validKey", 'validValue');
			assert(logSpy.calledWith("An error occured while setting request metadata"));
		});

	});
	*/
});
