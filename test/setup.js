// test-utils.js is a UMD script that installs the `testUtils` global and the
// fixture globals (branch_sample_key, session_id, ...) on window as a side
// effect; load it through CommonJS so its wrapper takes the `exports` branch.
import { createRequire } from 'node:module';
import { config } from '../src/core/config.js';
import { utils } from '../src/core/utils.js';

// testUtils.params() reads these as globals.
window.utils = utils;
window.sdk_version = 'web' + config.version;

createRequire(import.meta.url)('./test-utils.js');
