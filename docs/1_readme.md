# Branch Metrics Web SDK

## Using the Sample Web App

We provide a sample web app which demonstrates what Branch Metrics Web SDK can do. The online version can be found at <https://cdn.branch.io/example.html>. Alternatively, you can open `example.html` locally to for the same effect.

To modify this local web app, edit `src/web/example.template.html` first, and then run `make`, which will automatically update `example.html`. Refrain from manually editting `example.html`.

## Overview

The Branch Web SDK provides an easy way to interact with the Branch API on your website or web app. It requires no frameworks, is 100% native JavaScript and is only ~9K gzipped.

The Branch Web SDK allows you to create and share links with a banner (web only), over SMS, or your own methods by generating deep links. It also offers event tracking, access to referrals, and management of credits.

### Requirements

This SDK requires only native browser Javascript and has been tested in all modern browsers with sessionStorage capability. No 3rd party libraries are needed to make use of the SDK as it is 100% native Javascript.

### Browser Specific Support

| Chrome | Firefox | Safari | IE |
|:--------:|:-------:|:--------:|:--------:|
| &#10004; |&#10004; | &#10004; | 9, 10, 11 |

#### Specific Browser Support Status

[![Sauce Test Status](https://saucelabs.com/browser-matrix/branchmetrics.svg)](https://saucelabs.com/u/branchmetrics)

#### Common.JS and RequireJS compatibility

In addition to working as a standalone library, the Branch SDK works great in CommonJS environments (browserify, webpack) as well as RequireJS environments (RequireJS/AMD). Just `require('branch')` or `define(['branch'], function(branch) { ... });` to get started!

## Commonly Used Features

### App Smart Banner
While only available for websites and web apps, the app smart banner is one of the most widely used features of the Web SDK. A few short lines of code will produce an automatically
generated, highly customizeable banner at either the top or bottom of the page it is installed on. The banner automatically styles itself for Android, iOS, and desktop, and generates a mobile deep
link if on a mobile deive, or displays a "TXT me the app form" if on desktop. If you are looking for a very simple way of getting deeplinking setup on your website - both desktop and mobile - the
Smart banner is a great start!

Get Started Installing the App Smart Banner for Web [Here](https://dev.branch.io/recipes/app_download_banner/)

| ![iOS Smart Banner](docs/images/ios-web-sdk-banner-1.0.0.png) | ![Android Smart Banner](docs/images/android-web-sdk-banner-1.0.0.png) | ![Desktop Smart Banner](docs/images/desktop-web-sdk-banner-1.0.0.png) |

### Short link generation
Powerful, customizeable, and easy-to-create deeplinks are what Branch does best. The Web SDK delivers on this promise of providing a simple and powerful function for generating short deep links
asynchronously: `link()`. The method has all of the same options and parameters available on the public API `POST /v1/url` endpoint, and is called from a robust queueing mechanism and XHRRequest
implementation with JSONP fallback that is well tested down to IE9, and every major browser.

Get Started Generating Short Deep Links for [Web](https://github.com/BranchMetrics/Web-SDK/blob/master/WEB_GUIDE.md#linkdata-callback)

___

## Contributing
Whether you are an avid engineer, a partner, or a Branch employee, we activley welcome feature ideas and pull requests! Prior to actually writing code for a feature, it is best to reach out to us first, as we may already have something in the pipeline.

To build the Web SDK, you'll need to run `npm install` to grab the necessary packages, be sure you have [make](http://www.gnu.org/software/make/),
[python](https://www.python.org/downloads/) (comes with Mac OSX), [perl](http://learn.perl.org/installing/osx.html),
and the [Google Closure Compiler](https://developers.google.com/closure/compiler/) (Closure compiler is automatically installed when you run `make` the first time.)

For an in-depth guide to working with developing for the Web SDK, refer to the [release documentation](https://github.com/BranchMetrics/Web-SDK/blob/master/RELEASE_DOCUMENTATION.md).

___
