'use strict';

goog.require('config');


describe('utils', function() {
	var assert = testUtils.unplanned();
	describe('app_service_endpoint', function() {
		it('app_service_endpoint should be defined', function() {
			assert.isDefined(config.app_service_endpoint, 'app_service_endpoint is un-defined');
		});
        it('app_service_endpoint value is correct', function() {
			assert.isDefined(config.app_service_endpoint, 'https://app.link', 'app_service_endpoint is incorrect');
		});
	});

    describe('link_service_endpoint', function() {
		it('link_service_endpoint should be defined', function() {
			assert.isDefined(config.link_service_endpoint, 'link_service_endpoint is un-defined');
		});
        it('link_service_endpoint value is correct', function() {
			assert.isDefined(config.link_service_endpoint, 'https://bnc.lt', 'link_service_endpoint is incorrect');
		});
	});

    describe('api_endpoint', function() {
		it('api_endpoint should be defined', function() {
			assert.isDefined(config.api_endpoint, 'api_endpoint is un-defined');
		});
        it('api_endpoint value is correct', function() {
			assert.isDefined(config.api_endpoint, 'https://api2.branch.io', 'api_endpoint is incorrect');
		});
	});

    describe('version', function() {
		it('version should be defined', function() {
			assert.isDefined(config.version, 'version is un-defined');
		});
	});
});