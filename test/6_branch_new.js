'use strict';
/* jshint -W079 */
const sinon = require('sinon');

goog.require('Branch');

describe('Branch - new', function() {
	let branch;
	beforeEach(function() {
		branch = sinon.createStubInstance(Branch);
	});
	afterEach(function() {
		sinon.restore();
	});
	describe('referringLink', function() {
		it('test method exists', function() {
			sinon.assert.match(typeof branch.referringLink, 'function');
		});
	});
});
