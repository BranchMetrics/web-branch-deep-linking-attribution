goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');

var server;

describe('Branch', function() {
	var branch = new Branch(), request, requests;
	before(function() {
		branch.initialized = true;
	});

	beforeEach(function() {
		request = request || sinon.stub(branch._branchAPI, "request", function(resource, obj, storage, callback) {
			request.resource = resource;
			request.obj = obj;
			requests.push(request);
			callback();
		});
		requests = [];
	});

	afterEach(function() {
		// nothing for this yet...
	});

	describe('data', function() {
		it('should return session storage contents', function(done) {
			branch.data(function(err, data) {
				assert.equal(data.identity, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'identity matches');
				assert.equal(data.has_app, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'has_app matches');
				assert.equal(data.referring_identity, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'referring_identity matches');
				assert.equal(data.data, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'data matches');
				done();
			});
		});
	});

	describe('track', function() {
		var expectedRequest = {
			"event": "test_event",
			"metadata": utils.merge({
				"url": document.URL,
				"user_agent": navigator.userAgent,
				"language": navigator.language
			}, { }),
			"app_id": app_id,
			"session_id": branch.session_id
		};

		it('should return session storage contents', function(done) {
			branch.track(expectedRequest["event"], expectedRequest["metadata"], done);
			assert.equal(requests.length, 1, 'Request made');
		});
	});
});

