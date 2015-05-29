# Branch Metrics Web SDK

This README outlines the functionality of the Branch Metrics Web SDK, and how to easily incorporate it into a Web or PhoneGap/Cordova app.

Live demo of a web based implementation: [https://cdn.branch.io/example.html](https://cdn.branch.io/example.html)

## Overview

The Branch Web SDK provides an easy way to interact with the Branch API on your website, web app, or PhoneGap/Cordova mobile app. It requires no frameworks, is 100% native JavaScript and is only ~9K gzipped.

To use the Web SDK, you'll need to first initialize it with your Branch Key found in your [Branch dashboard](https://dashboard.branch.io/#/settings). You'll also need to register when your users login with `setIdentity`, and when they logout with `logout`.

Once initialized, the Branch Web SDK allows you to create and share links with a banner, over SMS, or your own methods. It also offers event tracking, access to referrals, and management of credits.

## Commonly Used Features

#### App Smart Banner
While only available for websites and web apps (not Cordova), the app smart banner is one of the most widely used features of the Web SDK. A few short lines of code will produce an automatically generated, highly customizeable banner at either the top or bottom of the page it is installed on. The banner automatically styles itself for Android, iOS, and desktop, and generates a mobile deep link if on a mobile deive, or displays a "TXT me the app form" if on desktop. If you are looking for a very simple way of getting deeplinking setup on your website - both desktop and mobile - the Smart banner is a great start!

Get Started Installing the App Smart Banner for Web [Here](WEB_GUIDE.md#smart-app-sharing-banner)

| iOS Smart Banner | Android Smart Banner | Desktop Smart Banner |
|------------------|----------------------|----------------------|
| ![iOS Smart Banner](docs/images/ios-web-sdk-banner-1.0.0.png) | ![Android Smart Banner](docs/images/android-web-sdk-banner-1.0.0.png) | ![Desktop Smart Banner](docs/images/desktop-web-sdk-banner-1.0.0.png) |

#### Short link generation
Powerful, customizeable, and easy-to-create deeplinks are what Branch does best. The Web SDK delivers on this promise of providing a simple and powerful function for generating short deep links asynchronously: `link()`. The method has all of the same options and parameters available on the public API `POST /v1/url` endpoint, and is called from a robust queueing mechanism and XHRRequest implementation with JSONP fallback that is well tested down to IE9, and every major browser.

Get Started Generating Short Deep Links for [Web](WEB_GUIDE.md#linkdata-callback) or [Cordova](CORDOVA_GUIDE.md#linkdata-callback)

* * *

