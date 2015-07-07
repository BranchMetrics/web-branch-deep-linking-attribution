/**
 * This is the actual embed script that people put on their page. I use the
 * technique of passing in variables as function parameters, even if not
 * defined, to remove the need for a `var` statement.
 *
 * This script creates a window.branch object with a number of calls. When you
 * call them, it saves your call for later.
 */

(function(root, doc, scriptStr, branchStr, createCallback, branchSdk, funcs, i, scriptTag, firstScript) {
	if (!root[branchStr]) {
		root[branchStr] = branchSdk;
		while (i < funcs.length) {
			createCallback(root[branchStr], funcs[i++]);
		}

		scriptTag = doc.createElement(scriptStr);
		scriptTag.async = 1;
		scriptTag.src = 'SCRIPT_URL_HERE';
		firstScript = doc.getElementsByTagName(scriptStr)[0];
		firstScript.parentNode.insertBefore(scriptTag, firstScript);
	}
	else { console.log("Branch is already embedded" ); }
})(window, document, 'script', 'branch', function(branch, name) {
	branch[name] = function() {
		branch._q.push([ name, arguments ]);
	};
}, { _q: [], _v: 1 }, // _q: the "queue" of calls, _v: the "version" of the embed script
'init;data;addListener;removeListener;setIdentity;logout;track;link;sendSMS;referrals;credits;creditHistory;applyCode;validateCode;getCode;redeem;banner;closeBanner'.split(';'), 0);
