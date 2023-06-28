'use strict';

// This is a JavaScript-based config file containing every Mocha option plus others.
// If you need conditional logic, you might want to use this type of config,
// e.g. set options via environment variables 'process.env'.
// Otherwise, JSON or YAML is recommended.

module.exports = {
  require: ['./node_modules/google-closure-library', './test/branch-deps.js', './node_modules/jsdom-global/register.js', './test/test-utils.js', './node_modules/sinon/lib/sinon.js'],
  spec: ['./test/0_config.js','./test/1_utils.js','./test/6_branch_new.js', './test/journeys_utils.js']
};
