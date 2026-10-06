/**
 * This file initialzes the main branch instance, and re-runs any tasks that
 * were any tasks that were executed on the dummy branch object before real
 * branch was loaded.
 */

import './core/polyfills.js';
import { Branch, initBranch } from './branch/branch.js';

// Backward compatibility for window.branch.constructor. Branch is now a class,
// so calling it without `new` would throw. The old constructor function
// instead returned a shared default instance when called without `new`, and
// otherwise re-initialized `this` in place (`new`, method calls such as
// window.branch.constructor(), and ES5 subclasses calling it on their own
// `this`). Customers can reach the constructor through
// window.branch.constructor, so keep that behavior here at the public boundary
// instead of giving up the class internally.
let default_branch;
function LegacyBranch() {
  if (!(this instanceof LegacyBranch)) {
    if (!default_branch) {
      default_branch = new Branch();
    }
    return default_branch;
  }
  initBranch(this);
}
LegacyBranch.prototype = Branch.prototype;
// Non-enumerable, like the built-in prototype.constructor it replaces.
Object.defineProperty(Branch.prototype, 'constructor', {
  value: LegacyBranch,
  writable: true,
  configurable: true,
});

export const branch_instance = new Branch();

if (window.branch?._q) {
  const queue = window.branch._q;
  for (let i = 0; i < queue.length; i++) {
    const task = queue[i];
    branch_instance[task[0]].apply(branch_instance, task[1]);
  }
}

// Provides a UMD-style module wrapper for the branch instance, meaning
// that the SDK can be used in any CommonJS, RequireJS, and vanilla JS environment.

// AMD
if (typeof define === 'function' && define.amd) {
  define('branch', function () {
    return branch_instance;
  });
}
// CommonJS-like environments that support module.exports
else if (typeof exports === 'object') {
  module.exports = branch_instance;
}

// Always make a global.
if (window) {
  window.branch = branch_instance;
}
