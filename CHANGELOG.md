# Change Log
All notable changes to the Branch Web SDK will be documented here.
The Branch Web SDK adheres to [Semantic Versioning](http://semver.org/).

## [VERSION] - unreleased

## [1.8.3] - 2015-12-08
- Fixes banner call to use deepview logic even if there is a referring link
- Updated banner layout, including themes
- Added additional fields for banner
- Use Branch Keys instead of API Key for example
- Updated license

## [v1.8.2] - 2015-11-30
- Fixed gracefully handle local and session storage unavailability

## [v1.8.1] - 2015-11-19
- Fixed bug with banner on mobile

## [v1.8.0] - 2015-11-17
- Added deepview functionality!
- Fixed an edge case where the queue was throwing errors.

## [v1.7.1] - 2015-10-23
- Fixed error in `branch.banner()` that caused the option `make_new_link` to be ignored.

## [v1.7.0] - 2015-09-25
- Fixed error in network failure handling that caused subsequent calls to fail once an early network connection failure has occurred.

## [v1.6.11] - 2015-09-17
- Fixed error in `branch.init()` that failed to send `browser_fingerprint_id` to API when checking for `has_app`

## [v1.6.10] - 2015-09-04
- Fixed error that prevented branch.setIdentity() to function after branch.logout() had been called

## [v1.6.9] - 2015-08-26
- Fixed error that prevented metadata from being passed to the server correctly in branch.track() for the min.js version
## [v1.6.8] - 2015-08-25
- Fixed error that prevented referring_link from persisting through sessions
- Fixed error that prevented metadata from being passed to the server correctly in branch.track()

## [v1.6.7] - 2015-08-14
### New Functionality
- The `has_app` property in the session, and the mobile device action text automatically updates when a user installs the app - without reloading the page!

## [v1.6.6] - 2015-08-02
- Fixed bower path

## [v1.6.5] - 2015-07-28
- Fix error that prevented subsequent APi calls after logging out on Cordova and Titanium
- Remove Cordova SDK from the Web SDK repo, and move to it's own repo

## [v1.6.4] - 2015-07-21
- Adds Code creating, applying, validating to web testbed
- Fixes undefined function `a.L()` with minified build in `addListener()` method
- Fixes setIdentity() and logout() functions failing to manage Cordova sessions properly

## [v1.6.3] - 2015-07-20
- Fixed an issue that only loaded the first link click data the user ever clicked on
- Adds the `.first()` method to the Web SDK, from Titanium and Cordova
- Fixes the Titanium and Cordova `.first()` methods

## [v1.6.2] - 2015-07-17
- Fixes an issue that failed to logout sessions

## [v1.6.1] - 2015-07-07
- Fixed an issue with certain requests not working in IE10 and IE11

## [v1.6.0] - 2015-07-06
- Fixes mobile saucelab tests and issue with silent failures
- Fixes issue with Cordova SDK not loading previous session if present
- Fixes issue with Cordova SDK which caused the close method to fail

## [v1.5.8] - 2015-06-25
- Fixes bug with JSON parsing from stored session

## [v1.5.7] - 2015-06-24
### New Functionality
- Adds Appcelerator Titanium Module
- Adds a simple event listener, with events for `branch.banner()`
### Improvements
- Refactors session storage to make use of sessionStorage, localStorage, cookies, JavaScript objects, and Titanium properties

## [v1.5.6] - 2015-06-01
### New Functionality
- Adds Smart Banner Option to specifiy if the banner will show on an iPad

## [v1.5.5] - 2015-05-26
### New Functionality
- Adds previously Cordova only functions to Web: `creditHistory()`, `getCode()`, `validateCode()`, and `applyCode()`

## [v1.5.4] - 2015-05-21
- Fixes bug with iOS and Android app banner not opening
### Improvements
- Behind the scenes improvement to retry all XHR and JSONP requests 3 times if they fail or timeout

## [v1.5.3] - 2015-05-21
### New Functionality
- Adds `referring_link` property to both `init()` and `data()` methods that returns the referring link, if available.

## [v1.5.2] - 2015-05-18
### New Functionality
- Specify whether the app banner is "sticky" (position: fixed) on desktop and mobile
- Set the app banner to either never show a second time, or wait a specified number of days before showing again
- Adds `customCSS` property to banner to allow custom styles
### Fixed
- Fixes body element position when banner is shown with `body { position: relative; }` or `body { position: absolute; }`
- Fixes body background image position when banner is shown

## [v1.5.1] - 2015-05-13
- Fixes IE11 bug with XHRRequests that caused an InvalidState error

## [v1.5.0] - 2015-05-11
### New Functionality
- Integration tests
- Adds smart banner position option, with possible values: 'top', or 'bottom'
- Adds data_parsed to branch.init() and referring_data_parsed to branch.setIdentity()
- Adds a `branch-banner-is-active` class to the body element when the smart banner is open, and removes it when the banner is closed
- Fixes issue with Cordova open method

## [1.4.2] - 2015-05-06
- Fixes bug in link creation without data
- Adds option to customize "Send Link" text in banner

## [1.4.1] - 2015-04-29
- Fixes bug with dead-code elimination

## [1.4.0] - 2015-04-25
- Add Cordova version of SDK! Add Cordova guide and add upgrade guide
- Fixes bug with app banner that caused the SMS waiting indicator to be misplaced
- Correctly implement queue
- Switches Web SDK to using Branch Key rather than App ID
- Adds `closeBanner()` method

## [v1.3.4] - 2015-04-10
- Fixes bug that caused errors to not be thrown
- Adds PhantomJS tests on CircleCI

## [v1.3.3] - 2015-03-31
### Fixed
- Add app id to sms sending

## [v1.3.2] - 2015-03-30
### Fixed
- Fixes and adds tests link_identifier not passing through to session

## [v1.3.1] - 2015-03-24
### Fixed
- Line break and wrap long app titles and descriptions in app banner

## [v1.3.0] - 2015-03-23
### New Functionality
- Much more consistent error handling - we always pass errors to callbacks, unless there is no callback specified, in which case we always throw them.
- Added a ton of tests!

### Fixed
- Preserve existing body classes - thanks @IsaiahJTurner!

## [v1.2.1] - 2015-03-19
### Fixed
- An issue with the app banner when `iframe: false`

## [v1.2.0] - 2015-03-06
### New Functionality
- Added **disableHide** option to banner, allows you to control if the banner lets the user disable (close) the banner.
- Added **showiOS** option to banner, replaces **showMobile**, allows you to control if the banner shows on iOS devices.
- Added **showAndroid** option to banner, replaces **showMobile**, allows you to control if the banner shows on Android devices.
- Added **makeNewLink** option to banner. If set to true, forces the creation of a new link, even if one already exists.

### Fixed
- JSONP requests on white-labelled domain links (fixes app banner for apps with white-labelled domains in IE9/10).

## [v1.1.1] - 2015-03-05
### New Functionality
- Added **forgetHide** option to banner, allowing you to show the banner even if the user has disabled it.

## [v1.1.0] - 2015-03-05
### New Functionality
- **bower** and **npm**: you can now `bower install branch-web-sdk` or `npm install branch-sdk` to get the Branch SDK!
- **RequireJS** and **CommonJS**: you can now use the Branch library in both RequireJS and CommonJS contexts; just `require('branch')` or `define(['branch'], function(branch) { ... });`!

### Fixed
- **sendSMS()** Incorrect URL path for link clicks when using whitelabeled domains

## [v1.0.1] - 2015-03-03
### Fixed
- **sendSMS()** Undefined method when sending SMS with minified Web SDK
- **banner()** Uncaught TypeError on iOS and Android app banner
- **banner()** Width of banner slightly more than 100% width on iOS Safari
- Fallback when sessionStorage is not available, i.e. on Mobile Safari Private mode.

## [v1.0.0] - 2015-03-02
### Changed
- **identify()** changed to **setIdentity()**. **setIdentity()** now accepts a single string `identity` and callback, rather than an object `{ identity: "string" }` and a callback.
- **appBanner()** changed to **banner()**. The banner still accepts a link data parameter, but now includes an options parameter. This allows custom Download and Open text: `openAppButtonText` or `downloadAppButtonText`, and the banner can be selectively disabled on either mobile or desktop. The banner will display the relevant text, dependent on whether the user has the app installed. The banner is now also embeded, by default, in an iFrame in order to isolate the CSS. This can optionally be turned off by setting `iframe: true` in the options parameters.
- **createLink()** changed to **link()**.
- **createLinkClick()** removed.
- **showReferrals()** changed to **referrals()**.
- **showCredits()** changed to **credits()**.
- **redeemCredits()** changed to **redeem()**.
- **SMSLink()** changed to **sendSMS()**. Additional parameter added: Now accepts, `metadata`, `callback`, and a third boolean value `make_new_link` which forces the creation of a new link, even if one already exists.

### Fixed
- Error with IE10 when hosting on http
- Numerous bugs, errors, and typos

### Added
- **Smart app sharing banner improvements**: The app banner has been significantly improved both stylistically, and functionally. The banner now mimics the style and animations of the native iOS 8 Smart App Banner on iOS devices, and has a beautiful material design look and feel on Android devices. Additionally, the banner has several contextual awareness features: 1. The banner stores in the session if the user has closed it, and it will stay closed on future page reloads. 2. The banner will show Download text if they user does not have the app installed, or if Branch has a record of the user installing the mobile app, it will instead show Open text.
- gzip compression
- Closure compiler Unit tests

## [0.1.1] - 2014-11-19

### Fixed
- Numerous bugs
- https
- Overall code cleanup and reorganization
