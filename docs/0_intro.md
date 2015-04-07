# Branch Metrics Web SDK

This README outlines the functionality of the Branch Metrics Web SDK, and how to easily incorporate it into a web app.

Live demo: [https://cdn.branch.io/example.html](https://cdn.branch.io/example.html)

## Overview

The Branch Web SDK provides an easy way to interact with the Branch API on your website or web app. It requires no frameworks, and is only ~7K gzipped.

To use the Web SDK, you'll need to first initialize it with your API key found in your [Branch dashboard](https://dashboard.branch.io/#/settings). You'll also need to register when your users login with `setIdentity`, and when they logout with `logout`.

Once initialized, the Branch Web SDK allows you to create and share links with a banner, over SMS, or your own methods. It also offers event tracking, access to referrals, and management of credits.

## Installation

### Requirements

This SDK requires native browser Javascript and has been tested in all modern browsers with sessionStorage capability. No 3rd party libraries are needed to make use of the SDK as is it 100% native Javascript.

### Browser Specific Support
| Chrome | Firefox | Safari |     IE     |
| ------ | ------- | ------ | ---------- |
|    &#10004;   |    &#10004;    |   &#10004;    |  9, 10, 11 |

### API Key

You will need to create a [Branch Metrics app](http://branch.io) to obtain your app_key.

### Cordova/Phonegap Use

This SDK can be used in Cordova application.  Clone the repository and copy the build.js from the dist folder to your js folder in your project (generally www/js).

The code needs a plugin to access some of the device specific information.  You will see a plugin folder in the root of the reposititory.  Add the plugin to your project.

```sh
cordova plugin add <PATH TO REPO>/plugin
```

Add the following javascript code to the ‘deviceready’ event handler.

```js
        (function(b,r,a,n,c,h,_,s,d,k){if(!b[n]||!b[n]._q){for(;s<_.length;)c(h,_[s++]);d=r.createElement(a);d.async=1;d.src="js/build.js";k=r.getElementsByTagName(a)[0];k.parentNode.insertBefore(d,k);b[n]=h}})(window,document,"script","branch",function(b,r){b[r]=function(){b._q.push([r,arguments])}},{_q:[],_v:1},"setDebug init close data first setIdentity logout track link sendSMS referrals credits redeem banner".split(" "),0);
```
This will setup the branch object.

You then need to add a call to init in both the ‘deviceready’ and ‘resume’ event handlers.

```js
branch.init(‘YOUR APP ID’, function(err, data) {
	// handle errors and data here.
});
```

Finally, add a close session call to the ‘pause’ event handler.
```js
branch.close(function(err) {
// optionally handle any error
});
```

### Quick Install

#### Manual installation

_Be sure to replace `APP-KEY` with your actual app key found in your [account dashboard](https://dashboard.branch.io/#/settings)._

```html
<script type="text/javascript">
