'use strict';
/*jshint -W079 */
/*jshint esversion: 6 */
var sinon = require('sinon');

goog.require('Branch');
goog.require('utils');
goog.require('task_queue');
goog.require('Logger');

describe('Branch - new', function() {
	const sandbox = sinon.createSandbox();
	const branch_instance = new Branch();
	const assert = testUtils.unplanned();
	afterEach(function() {
		sandbox.restore();
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
		it('test method exists', function() {
			sinon.assert.match(typeof branch_instance.setDMAParamsForEEA, "function");
		});
		it('should store dma params inside branch_dma_data of storage', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				},
				_queue: task_queue(),
				_logger: new Logger()
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
		it('should not store dma params inside branch_dma_data of storage if eeaRegion is not set', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				},
				_queue: task_queue(),
				_logger: new Logger()
			};
			const storageSetStub = sandbox.stub(thisObj._storage, 'set');
			branch_instance.setDMAParamsForEEA.call(thisObj);
			sinon.assert.notCalled(storageSetStub);
		});
		it('should not store dma params inside branch_dma_data of storage if eeaRegion is null', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				},
				_queue: task_queue(),
				_logger: new Logger()
			};
			const storageSetStub = sandbox.stub(thisObj._storage, 'set');
			const dmaObj = {};
			dmaObj.eeaRegion = null;
			dmaObj.adPersonalizationConsent = true;
			dmaObj.adUserDataUsageConsent = true;
			branch_instance.setDMAParamsForEEA.call(thisObj, dmaObj.eeaRegion, dmaObj.adPersonalizationConsent, dmaObj.adUserDataUsageConsent);
			sinon.assert.notCalled(storageSetStub);
		});
		it('should log warning if eeaRegion is not boolean', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				},
				_queue: task_queue(),
				_logger: new Logger()
			};
			const consoleErrorStub = sandbox.stub(console, 'error');
			try {
				const dmaObj = {};
				dmaObj.eeaRegion = null;
				dmaObj.adPersonalizationConsent = true;
				dmaObj.adUserDataUsageConsent = true;
				branch_instance.setDMAParamsForEEA.call(thisObj, dmaObj.eeaRegion, dmaObj.adPersonalizationConsent, dmaObj.adUserDataUsageConsent);

			} catch (e) {

			}
			sinon.assert.calledWith(consoleErrorStub, 'setDMAParamsForEEA: eeaRegion must be boolean, but got null');
		});
		it('should log warning if adPersonalizationConsent is not boolean', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				},
				_queue: task_queue(),
				_logger: new Logger()
			};
			const consoleErrorStub = sandbox.stub(console, 'error');
			try {
				const dmaObj = {};
				dmaObj.eeaRegion = true;
				dmaObj.adPersonalizationConsent = null;
				dmaObj.adUserDataUsageConsent = true;
				branch_instance.setDMAParamsForEEA.call(thisObj, dmaObj.eeaRegion, dmaObj.adPersonalizationConsent, dmaObj.adUserDataUsageConsent);

			} catch (e) {

			}
			sinon.assert.calledWith(consoleErrorStub, 'setDMAParamsForEEA: adPersonalizationConsent must be boolean, but got null');
		});
		it('should log warning if eeaRegion is not boolean', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				},
				_queue: task_queue(),
				_logger: new Logger()
			};
			const consoleErrorStub = sandbox.stub(console, 'error');
			try {
				const dmaObj = {};
				dmaObj.eeaRegion = true;
				dmaObj.adPersonalizationConsent = true;
				dmaObj.adUserDataUsageConsent = null;
				branch_instance.setDMAParamsForEEA.call(thisObj, dmaObj.eeaRegion, dmaObj.adPersonalizationConsent, dmaObj.adUserDataUsageConsent);

			} catch (e) {

			}
			sinon.assert.calledWith(consoleErrorStub, 'setDMAParamsForEEA: adUserDataUsageConsent must be boolean, but got null');
		});
		it('should catch and log exception', function() {
			const thisObj = {
				_storage: {
					set: () => {}
				},
				_queue: task_queue(),
				_logger: new Logger()
			};
			sandbox.stub(thisObj._storage, 'set').throws(new Error('Mock error'));
			const consoleErrorStub = sandbox.stub(console, 'error');
			try {
				const dmaObj = {};
				dmaObj.eeaRegion = false;
				dmaObj.adPersonalizationConsent = false;
				dmaObj.adUserDataUsageConsent = false;
				branch_instance.setDMAParamsForEEA.call(thisObj, dmaObj.eeaRegion, dmaObj.adPersonalizationConsent, dmaObj.adUserDataUsageConsent);

			} catch (e) {

			}
			sinon.assert.calledWith(consoleErrorStub, 'setDMAParamsForEEA::An error occurred while setting DMA parameters for EEA', sinon.match.instanceOf(Error));
		});
	});
	describe('setAPIUrl', function() {
		it('test method exists', function() {
			sinon.assert.match(typeof branch_instance.setAPIUrl, "function");
		});
	});
	describe('getAPIUrl', function() {
		it('test method exists', function() {
			sinon.assert.match(typeof branch_instance.getAPIUrl, "function");
		});
		it('test url', function() {
			var branch_url = 'https://api16.branch.io';
			branch_instance.setAPIUrl(branch_url);
			assert.equal(branch_instance.getAPIUrl(), branch_url);
		});
	});
});
