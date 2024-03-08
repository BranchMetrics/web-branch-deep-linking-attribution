'use strict';
/*jshint -W079 */
/*jshint esversion: 6 */
// jscs:disable validateIndentation
var sinon = require('sinon');
goog.require('Logger');

describe('Logger', function() {
	const assert = testUtils.unplanned();
    const logger_instance = new Logger();
    const sandbox = sinon.createSandbox();
	afterEach(function() {
		sandbox.restore();
		sinon.restore();
	});
	describe('setLevel', function() {
		it('test method exists', function() {
			sinon.assert.match(typeof logger_instance.setLevel, "function");
		});
		it('should set the logging level to the specified value', function() {
			logger_instance.setLevel('info');
			assert.equal(logger_instance.level_, 'info');
		});
		it('should not set the logging level to an invalid value', function() {
			logger_instance.setLevel('invalid');
			assert.equal(logger_instance.level_, 'info');
		});
		it('should console an error when the logging level is set to an invalid value', function() {
			const consoleErrorStub = sandbox.stub(console, 'error');
			logger_instance.setLevel('misc');
			sinon.assert.calledWith(consoleErrorStub, 'Invalid log level: misc');
		});
	});
	describe('shouldLog', function() {
		it('test method exists', function() {
			sinon.assert.match(typeof logger_instance.shouldLog, "function");
		});
		it('should return true if the logging level allows logging the message', function() {
			logger_instance.setLevel('info');
			assert.equal(logger_instance.shouldLog('info'), true);
		});
		it('should return false if the logging level prevents logging the message', function() {
			logger_instance.setLevel('none');
			assert.equal(logger_instance.shouldLog('info'), false);
		});
	});
	describe('log', function() {
		it('test method exists', function() {
			sinon.assert.match(typeof logger_instance.log, "function");
		});
		it('should log an error message to the console', function() {
			const consoleErrorStub = sandbox.stub(console, 'error');
			logger_instance.setLevel('error');
			logger_instance.log('error', 'This is an error message');
			sinon.assert.calledWith(consoleErrorStub, 'This is an error message');
		});
		it('should log an warn message to the console', function() {
			const consoleErrorStub = sandbox.stub(console, 'warn');
			logger_instance.setLevel('warn');
			logger_instance.log('warn', 'This is a warning message');
			sinon.assert.calledWith(consoleErrorStub, 'This is a warning message');
		});
		it('should log an info message to the console', function() {
			const consoleInfoStub = sandbox.stub(console, 'info');
			logger_instance.setLevel('info');
			logger_instance.log('info', 'This is a info message');
			sinon.assert.calledWith(consoleInfoStub, 'This is a info message');
		});
		it('should log an info message to the console when level is verbose', function() {
			const consoleInfoStub = sandbox.stub(console, 'info');
			logger_instance.setLevel('verbose');
			logger_instance.log('info', 'This is a info message');
			sinon.assert.calledWith(consoleInfoStub, 'This is a info message');
		});
		it('should log an warn message to the console when level is verbose', function() {
			const consoleWarnStub = sandbox.stub(console, 'warn');
			logger_instance.setLevel('verbose');
			logger_instance.log('warn', 'This is a warning message');
			sinon.assert.calledWith(consoleWarnStub, 'This is a warning message');
		});
		it('should log an error message to the console when level is verbose', function() {
			const consoleErrorStub = sandbox.stub(console, 'error');
			logger_instance.setLevel('verbose');
			logger_instance.log('error', 'This is an error message');
			sinon.assert.calledWith(consoleErrorStub, 'This is an error message');
		});
		it('should not log an info message when level is none', function() {
			const consoleInfoStub = sandbox.stub(console, 'info');
			logger_instance.setLevel('none');
			logger_instance.log('info', 'This is a info message');
			sinon.assert.notCalled(consoleInfoStub);
		});
		it('should not log an warn message when level is none', function() {
			const consoleWarnStub = sandbox.stub(console, 'warn');
			logger_instance.setLevel('none');
			logger_instance.log('warn', 'This is a warn message');
			sinon.assert.notCalled(consoleWarnStub);
		});
		it('should not log an error message when level is none', function() {
			const consoleErrorStub = sandbox.stub(console, 'error');
			logger_instance.setLevel('none');
			logger_instance.log('error', 'This is a error message');
			sinon.assert.notCalled(consoleErrorStub);
		});
		it('should not log an info message when level is error', function() {
			const consoleInfoStub = sandbox.stub(console, 'info');
			logger_instance.setLevel('error');
			logger_instance.log('info', 'This is a info message');
			sinon.assert.notCalled(consoleInfoStub);
		});
	});
});
// jscs:enable validateIndentation
