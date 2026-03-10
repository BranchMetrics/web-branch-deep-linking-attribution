'use strict';

var path = require('path');
require('google-closure-library');

var repoRoot = path.resolve(__dirname, '..');
var originalImportScript = global.CLOSURE_IMPORT_SCRIPT;

global.CLOSURE_IMPORT_SCRIPT = function(src) {
	if (!src || typeof src !== 'string') {
		return originalImportScript(src);
	}

	// With pnpm, Closure's bootstrap executes from a nested realpath under
	// node_modules/.pnpm. Normalize project-local deps to repo absolute paths.
	if (src.indexOf('../../../../src/') === 0 || src.indexOf('../../../../test/') === 0) {
		var localPath = src.replace('../../../../', '');
		return require(path.resolve(repoRoot, localPath));
	}

	return originalImportScript(src);
};
