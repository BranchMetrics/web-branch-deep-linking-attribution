(function(root, doc, script, branchStr, createCallback, branch, funcs, i, scriptTag, firstScript) {
  if (!root[branchStr] || !root[branchStr]._q) {
    while (i < funcs.length) {
      createCallback(branch, funcs[i++]);
    }

    scriptTag = doc.createElement(script);
    scriptTag.async = 1;
    // scriptTag.src = "https://s3-us-west-1.amazonaws.com/branch-web-sdk/branch-0.x.min.js";
    firstScript = doc.getElementsByTagName(script)[0];
    firstScript.parentNode.insertBefore(scriptTag, firstScript);

    root[branchStr] = branch;
  }
})(window, document, "script", 'branch', function(branch, name) {
  branch[name] = function() {
    branch._q.push([ name, arguments ]);
  };
}, { _q: [], _v: 1 }, 'init;close;logout;track;identify;createLink;showReferrals;showCredits;redeemCredits;appBanner'.split(';'), 0)

/*

!function(e,n,t,s,r,a,i,c,o,m){if(!e[s]||!e[s]._q){for(;c<i.length;)r(a,i[c++]);o=n.createElement(t),o.async=1,o.src=
"http://localhost:8000/build.js",m=n.getElementsByTagName(t)[0],m.parentNode.insertBefore(o,m),
e[s]=a}}(window,document,"script","branch",function(e,n){e[n]=function(){e._q.push([n,arguments])}},{_q:[],_v:1},
"init;close;logout;track;identify;createLink;showReferrals;showCredits;redeemCredits;appBanner".split(";"),0)

*/