'use strict';

// This is a JavaScript-based config file containing every Mocha option plus others.
// If you need conditional logic, you might want to use this type of config,
// e.g. set options via environment variables 'process.env'.
// Otherwise, JSON or YAML is recommended.

module.exports = {
  require: ['./test/setup.js', './test/branch-deps.js', 'global-jsdom/register', './test/test-utils.js', './node_modules/sinon/lib/sinon.js'],
  spec: ['./test/0_config.js','./test/0_queue.js','./test/1_utils.js','./test/6_branch_new.js', './test/journeys_utils.js', './test/branch_view.js', './test/journeys/events.js', './test/journeys/analytics.js', './test/journeys/template.js', './test/journeys/dismissals.js', './test/journeys/link_overrides.js', './test/journeys/a11y.js', './test/journeys/v2/context.js', './test/journeys/v2/frame.js', './test/journeys/v2/animation.js', './test/journeys/v2/interactions.js', './test/journeys/v2/index.js']
};
