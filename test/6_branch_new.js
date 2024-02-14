'use strict';
/*jshint -W079 */
/*jshint esversion: 6 */
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
	describe('setDMAParamsForEEA', function() {
		let sandbox;
		beforeEach(() => {
			sandbox = sinon.createSandbox();
		});
		afterEach(() => {
			sandbox.restore();
		});
		it('test method exists', function() {
			sinon.assert.match(typeof branch_instance.setDMAParamsForEEA, "function");
		});
		it('should store dma params inside branch_dma_data of storage', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				}
			};
			const storageSetStub = sandbox.stub(thisObj._storage, 'set');
			const dmaObj = {};
			dmaObj.eeaRegion = true;
			dmaObj.adPersonalizationConsent = true;
			dmaObj.adUserDataUsageConsent = true;
			const stringifieddmaObj = JSON.stringify(dmaObj);
			branch_instance.setDMAParamsForEEA.call(thisObj, dmaObj.eeaRegion, dmaObj.adPersonalizationConsent, dmaObj.adUserDataUsageConsent);
			sinon.assert.calledWith(storageSetStub, 'branch_dma_data', stringifieddmaObj, true);
		});
		it('should store default dma params inside branch_dma_data of storage', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				}
			};
			const storageSetStub = sandbox.stub(thisObj._storage, 'set');
			const dmaObj = {};
			dmaObj.eeaRegion = false;
			dmaObj.adPersonalizationConsent = false;
			dmaObj.adUserDataUsageConsent = false;
			const stringifieddmaObj = JSON.stringify(dmaObj);
			branch_instance.setDMAParamsForEEA.call(thisObj);
			sinon.assert.calledWith(storageSetStub, 'branch_dma_data', stringifieddmaObj, true);
		});
		it('should catch and log exception', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				}
			};
			sandbox.stub(thisObj._storage, 'set').throws(new Error('Mock error'));
			const consoleErrorStub = sandbox.stub(console, 'error');
			try {
				const dmaObj = {};
				dmaObj.eeaRegion = false;
				dmaObj.adPersonalizationConsent = false;
				dmaObj.adUserDataUsageConsent = false;
				branch_instance.setDMAParamsForEEA.call(thisObj);

			} catch (e) {

			}
			sinon.assert.calledWith(consoleErrorStub, 'setDMAParamsForEEA::An error occured while setting DMA parameters for EEA', sinon.match.instanceOf(Error));
		});
	});
});
