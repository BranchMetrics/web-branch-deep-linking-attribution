# Change Log
All notable changes to the Branch Web SDK will be documented here.
The Branch Web SDK adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased] - unreleased
### Changed
- **identify()** changed to **setIdentity()**. **setIdentity()** now accepts a single string `identity` and callback, rather than an object `{ identity: "" }` and a callback.
- **appBanner()** changed to **banner()**. Two new metadata parameters have been added to allow custom Download and Open text: `openAppButtonText`, and `downloadAppButtonText`. The banner will display the relevant text, dependant on wether the user has the app installed.
- **track()** changed to **event()**.
- **createLink()** changed to **link()**.
- **createLinkClick()** changed to **linkClick()**.
- **showReferrals()** changed to **referrals()**.
- **showCredits()** changed to **credits()**.
- **redeemCredits()** changed to **redeem()**.

### Fixed
- Error with IE10 when hosting on http
- Numerous bugs, errors, and typos

### Added
- **App download banner imrpovements**: The app banner has been signifigantly improved both stylistically, and functionally. The banner now mimics the style and animations of the native iOS 8 Smart App Banner on iOS devices, and has a beautiful material design look and feel on Android devices. Additionally, the banner has several contextual awareness features: 1. The banner stores in the session if the user has closed it, and it will stay closed on future page reloads. 2. The banner will show Download text if they user does not have the app installed, or if Branch has a record of the user installing the mobile app, it will instead show Open text.
- gzip compression
- **SMSLinkNew()**, same as **SMSLink()**, but forces creation of a new link, replacing the link stored in `sessionStorage`.
- **SMSLinkExisting()**, same as **SMSLink()**, but only uses the link stored in `sessionStorage`, and will not create a new link.
- Closure compiler Unit tests

## [0.1.1] - 2014-11-19

### Fixed
- Numerous bugs
- https
- Overall code cleanup and reorginization