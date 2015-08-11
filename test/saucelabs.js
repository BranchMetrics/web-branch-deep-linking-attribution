// Sauce labs magic, don't worry about it
var onload = function() {
	var runner = mocha.run();

	var failedTests = [];
	runner.on('end', function() {
		window.mochaResults = runner.stats;
		window.mochaResults.reports = failedTests;
	});

	var logFailure = function(test, err) {

		var flattenTitles = function(test) {
			var titles = [];
			while (test.parent.title) {
				titles.push(test.parent.title);
				test = test.parent;
			}
			return titles.reverse();
		};

		failedTests.push({ name: test.title,
			result: false,
			message: err.message,
			stack: err.stack,
			titles: flattenTitles(test) });
	};
	runner.on('fail', logFailure);
};
