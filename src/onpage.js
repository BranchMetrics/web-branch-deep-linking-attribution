/**
 * This is the actual embed script that people put on their page. I use the
 * technique of passing in variables as function parameters, even if not
 * defined, to remove the need for a `var` statement.
 *
 * This script creates a window.branch object with a number of calls. When you
 * call them, it saves your call for later.
 */

(function(root, doc, script, branchStr, createCallback, branch, funcs, i, scriptTag, firstScript) {
  if (!root[branchStr] || !root[branchStr]._q) {
    while (i < funcs.length) {
      createCallback(branch, funcs[i++]);
    }

    scriptTag = doc.createElement(script);
    scriptTag.async = 1;
    scriptTag.src = "https://s3-us-west-1.amazonaws.com/branch-web-sdk/branch-0.x.min.js";
    firstScript = doc.getElementsByTagName(script)[0];
    firstScript.parentNode.insertBefore(scriptTag, firstScript);

    root[branchStr] = branch;
  }
})(window, document, "script", 'branch', function(branch, name) {
  branch[name] = function() {
    branch._q.push([ name, arguments ]);
  };
}, { _q: [], _v: 1 }, // _q: the "queue" of calls, _v: the "version" of the embed script
'init;close;logout;track;identify;createLink;showReferrals;showCredits;redeemCredits;appBanner'.split(';'), 0);
