// test-utils.js is a UMD script that installs the `testUtils` global and the
// fixture globals (branch_sample_key, session_id, ...) on window as a side
// effect; load it through CommonJS so its wrapper takes the `exports` branch.
import { createRequire } from 'node:module';

createRequire(import.meta.url)('./test-utils.js');
