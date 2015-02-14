# Branch Metrics Web SDK
---
This README outlines the functionality of the Branch Metrics Web SDK, and how to easily incorporate it into a web app.

Live demo: http://s3-us-west-1.amazonaws.com/branch-web-sdk/example.html

## Installation

### Requriements

This SDK requires native browser Javascript and has been tested in all modern browsers with sessionStorage capability. No 3rd party libraries are needed to make use of the SDK as is it 100% native Javascript.

### Browser Specific Support
| Chrome | Firefox | Safari |     IE     |
| ------ | ------- | ------ | ---------- |
|    X   |    X    |   X    |  9, 10, 11 |

### API Key

You will need to create a [Branch Metrics app](http://branch.io) to obtain your app_id.

### Quick Install

```javascript
<script type="text/javascript">
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
'init;close;logout;track;identify;createLink;showReferrals;showCredits;redeemCredits;appBanner'.split(';'), 0)
</script>
```