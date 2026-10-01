import { config } from '../src/0_config.js';
import { safejson } from '../src/0_jsonparse.js';
import { task_queue } from '../src/0_queue.js';
import { utils } from '../src/1_utils.js';
import { Server } from '../src/3_api.js';
import { Branch } from '../src/6_branch.js';

describe('Branch - new', function () {
  const branch_instance = new Branch();
  const assert = testUtils.unplanned();
  afterEach(function () {
    vi.restoreAllMocks();
  });
  describe('referringLink', function () {
    it('test method exists', function () {
      expect(typeof branch_instance.referringLink).toBe('function');
    });
  });
  describe('setRequestMetaData', function () {
    var addPropertyIfNotNullSpy;
    beforeEach(function () {
      addPropertyIfNotNullSpy = vi.spyOn(utils, 'addPropertyIfNotNull');
    });
    it('test method exists', function () {
      expect(typeof branch_instance.setRequestMetaData).toBe('function');
    });
    it('should set metadata for a valid key and value', function () {
      var key = 'validKey';
      var value = 'validValue';
      var requestMetadata = {};
      var result = branch_instance.setRequestMetaData.call(
        { requestMetadata: requestMetadata },
        key,
        value,
      );
      assert.strictEqual(result, undefined);
      expect(addPropertyIfNotNullSpy).toHaveBeenCalledOnce();
      assert.deepEqual(requestMetadata, { 'validKey': 'validValue' });
    });

    it('should delete metadata for a key when value is null', function () {
      var requestMetadata = { 'keyToDelete': 'value' };
      branch_instance.setRequestMetaData.call(
        { requestMetadata: requestMetadata },
        'keyToDelete',
        null,
      );
      assert.deepEqual(requestMetadata, {});
    });

    it('should not modify metadata for an invalid key or undefined value', function () {
      var invalidKey = null;
      var undefinedValue;
      var requestMetadata = { 'key': 'value' };

      var result1 = branch_instance.setRequestMetaData.call(
        { requestMetadata: requestMetadata },
        invalidKey,
        'validValue',
      );
      var result2 = branch_instance.setRequestMetaData.call(
        { requestMetadata: requestMetadata },
        'validKey',
        undefinedValue,
      );
      assert.strictEqual(result1, undefined);
      assert.strictEqual(result2, undefined);
      expect(addPropertyIfNotNullSpy).not.toHaveBeenCalled();
      assert.deepEqual(requestMetadata, { 'key': 'value' });
    });
  });
  describe('pageview/dismiss request metadata', function () {
    var pageviewResource = {
      destination: config.api_endpoint,
      endpoint: '/v1/pageview',
      method: utils.httpMethod.POST,
    };
    var dismissResource = {
      destination: config.api_endpoint,
      endpoint: '/v1/dismiss',
      method: utils.httpMethod.POST,
    };

    it('should merge branch_requestMetadata directly into metadata for v1/pageview instead of dropping it', function () {
      var server = new Server();
      var result = server.getUrl(pageviewResource, {
        branch_key: window.branch_sample_key,
        event: 'pageview',
        metadata: { url: 'http://example.com' },
        branch_requestMetadata: { '$marketing_cloud_visitor_id': '12345' },
      });
      assert.strictEqual(typeof result.error, 'undefined');
      var metadataMatch = decodeURIComponent(result.data).match(
        /metadata=(.+?)(&|$)/,
      );
      var metadata = safejson.parse(metadataMatch[1]);
      assert.strictEqual(metadata['$marketing_cloud_visitor_id'], '12345');
      assert.strictEqual(metadata.url, 'http://example.com');
      assert.strictEqual(
        result.data.indexOf('branch_requestMetadata='),
        -1,
        'not sent as a top-level field',
      );
      assert.strictEqual(
        typeof metadata.branch_requestMetadata,
        'undefined',
        'not nested under its own key',
      );
    });

    it('should merge branch_requestMetadata directly into metadata for v1/dismiss instead of dropping it', function () {
      var server = new Server();
      var result = server.getUrl(dismissResource, {
        branch_key: window.branch_sample_key,
        event: 'dismiss',
        metadata: {},
        branch_requestMetadata: { '$marketing_cloud_visitor_id': '12345' },
      });
      assert.strictEqual(typeof result.error, 'undefined');
      var metadataMatch = decodeURIComponent(result.data).match(
        /metadata=(.+?)(&|$)/,
      );
      var metadata = safejson.parse(metadataMatch[1]);
      assert.strictEqual(metadata['$marketing_cloud_visitor_id'], '12345');
    });
  });
  describe('setDMAParamsForEEA', function () {
    it('test method exists', function () {
      expect(typeof branch_instance.setDMAParamsForEEA).toBe('function');
    });
    it('should store dma params inside branch_dma_data of storage', function () {
      const thisObj = {
        _storage: {
          set: () => {},
        },
        _queue: task_queue(),
      };
      const storageSetStub = vi
        .spyOn(thisObj._storage, 'set')
        .mockImplementation(function () {});
      const dmaObj = {};
      dmaObj.eeaRegion = true;
      dmaObj.adPersonalizationConsent = true;
      dmaObj.adUserDataUsageConsent = true;
      const stringifieddmaObj = JSON.stringify(dmaObj);
      branch_instance.setDMAParamsForEEA.call(
        thisObj,
        dmaObj.eeaRegion,
        dmaObj.adPersonalizationConsent,
        dmaObj.adUserDataUsageConsent,
      );
      expect(storageSetStub).toHaveBeenCalledWith(
        'branch_dma_data',
        stringifieddmaObj,
        true,
      );
    });
    it('should not store dma params inside branch_dma_data of storage if eeaRegion is not set', function () {
      const thisObj = {
        _storage: {
          set: () => {},
        },
        _queue: task_queue(),
      };
      const storageSetStub = vi
        .spyOn(thisObj._storage, 'set')
        .mockImplementation(function () {});
      branch_instance.setDMAParamsForEEA.call(thisObj);
      expect(storageSetStub).not.toHaveBeenCalled();
    });
    it('should not store dma params inside branch_dma_data of storage if eeaRegion is null', function () {
      const thisObj = {
        _storage: {
          set: () => {},
        },
        _queue: task_queue(),
      };
      const storageSetStub = vi
        .spyOn(thisObj._storage, 'set')
        .mockImplementation(function () {});
      const dmaObj = {};
      dmaObj.eeaRegion = null;
      dmaObj.adPersonalizationConsent = true;
      dmaObj.adUserDataUsageConsent = true;
      branch_instance.setDMAParamsForEEA.call(
        thisObj,
        dmaObj.eeaRegion,
        dmaObj.adPersonalizationConsent,
        dmaObj.adUserDataUsageConsent,
      );
      expect(storageSetStub).not.toHaveBeenCalled();
    });
    it('should log warning if eeaRegion is not boolean', function () {
      const thisObj = {
        _storage: {
          set: () => {},
        },
        _queue: task_queue(),
      };
      const consoleErrorStub = vi
        .spyOn(console, 'warn')
        .mockImplementation(function () {});
      try {
        const dmaObj = {};
        dmaObj.eeaRegion = null;
        dmaObj.adPersonalizationConsent = true;
        dmaObj.adUserDataUsageConsent = true;
        branch_instance.setDMAParamsForEEA.call(
          thisObj,
          dmaObj.eeaRegion,
          dmaObj.adPersonalizationConsent,
          dmaObj.adUserDataUsageConsent,
        );
      } catch (e) {}
      expect(consoleErrorStub).toHaveBeenCalledWith(
        'setDMAParamsForEEA: eeaRegion must be boolean, but got null',
      );
    });
    it('should log warning if adPersonalizationConsent is not boolean', function () {
      const thisObj = {
        _storage: {
          set: () => {},
        },
        _queue: task_queue(),
      };
      const consoleErrorStub = vi
        .spyOn(console, 'warn')
        .mockImplementation(function () {});
      try {
        const dmaObj = {};
        dmaObj.eeaRegion = true;
        dmaObj.adPersonalizationConsent = null;
        dmaObj.adUserDataUsageConsent = true;
        branch_instance.setDMAParamsForEEA.call(
          thisObj,
          dmaObj.eeaRegion,
          dmaObj.adPersonalizationConsent,
          dmaObj.adUserDataUsageConsent,
        );
      } catch (e) {}
      expect(consoleErrorStub).toHaveBeenCalledWith(
        'setDMAParamsForEEA: adPersonalizationConsent must be boolean, but got null',
      );
    });
    it('should log warning if eeaRegion is not boolean', function () {
      const thisObj = {
        _storage: {
          set: () => {},
        },
        _queue: task_queue(),
      };
      const consoleErrorStub = vi
        .spyOn(console, 'warn')
        .mockImplementation(function () {});
      try {
        const dmaObj = {};
        dmaObj.eeaRegion = true;
        dmaObj.adPersonalizationConsent = true;
        dmaObj.adUserDataUsageConsent = null;
        branch_instance.setDMAParamsForEEA.call(
          thisObj,
          dmaObj.eeaRegion,
          dmaObj.adPersonalizationConsent,
          dmaObj.adUserDataUsageConsent,
        );
      } catch (e) {}
      expect(consoleErrorStub).toHaveBeenCalledWith(
        'setDMAParamsForEEA: adUserDataUsageConsent must be boolean, but got null',
      );
    });
    it('should catch and log exception', function () {
      const thisObj = {
        _storage: {
          set: () => {},
        },
        _queue: task_queue(),
      };
      vi.spyOn(thisObj._storage, 'set').mockImplementation(function () {
        throw new Error('Mock error');
      });
      const consoleErrorStub = vi
        .spyOn(console, 'error')
        .mockImplementation(function () {});
      try {
        const dmaObj = {};
        dmaObj.eeaRegion = false;
        dmaObj.adPersonalizationConsent = false;
        dmaObj.adUserDataUsageConsent = false;
        branch_instance.setDMAParamsForEEA.call(
          thisObj,
          dmaObj.eeaRegion,
          dmaObj.adPersonalizationConsent,
          dmaObj.adUserDataUsageConsent,
        );
      } catch (e) {}
      expect(consoleErrorStub).toHaveBeenCalledWith(
        'setDMAParamsForEEA::An error occurred while setting DMA parameters for EEA',
        expect.any(Error),
      );
    });
  });
  describe('setAPIUrl', function () {
    it('test method exists', function () {
      expect(typeof branch_instance.setAPIUrl).toBe('function');
    });
  });
  describe('getAPIUrl', function () {
    it('test method exists', function () {
      expect(typeof branch_instance.getAPIUrl).toBe('function');
    });
    it('test url', function () {
      var branch_url = 'https://api16.branch.io';
      branch_instance.setAPIUrl(branch_url);
      assert.equal(branch_instance.getAPIUrl(), branch_url);
    });
  });
  describe('addListener', function () {
    it('should fire listener added using addListener for an event', function () {
      let listenerFired = 0;
      const listener = function () {
        listenerFired++;
      };
      branch_instance.addListener('willShowJourney', listener);
      branch_instance._publishEvent('willShowJourney');
      assert.equal(listenerFired, 1);
    });
  });
});
