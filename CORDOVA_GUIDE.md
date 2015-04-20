## Installation - Branch PhoneGap or Cordova SDK

### Available in Cordova

Branch is available through [Cordova](http://plugins.cordova.io/#/package/io.branchmetrics.branchreferral), to install it simply execute the following line in terminal, while in your project directory:

    cordova plugin add io.branchmetrics.branchreferral

### Register you app

You can sign up for your own app id at [https://dashboard.branch.io](https://dashboard.branch.io)

## Configuration (for tracking)

Ideally, you want to use our links any time you have an external link pointing to your app (share, invite, referral, etc) because:

1. Our dashboard can tell you where your installs are coming from
1. Our links are the highest possible converting channel to new downloads and users
1. You can pass that shared data across install to give new users a custom welcome or show them the content they expect to see

Our linking infrastructure will support anything you want to build. If it doesn't, we'll fix it so that it does: just reach out to alex@branch.io with requests.

### Initialize SDK And Register Deep Link Routing Function

Called when an app first initializes a session, ideally in the app delegate. If you created a custom link with your own custom dictionary data, you probably want to know when the user session init finishes, so you can check that data. Think of this callback as your "deep link router." If your app opens with some data, you want to route the user depending on the data you passed in. Otherwise, send them to a generic install flow.

This deep link routing callback is called 100% of the time on init, with your link params or an empty dictionary if none present.

**[Formerly `getInstance() and initSession()`](CORDOVA_UPGRADE_GUIDE.md)**


```js
// adds an instance of branch to the window object
(function(b,r,a,n,c,h,_,s,d,k){if(!b[n]||!b[n]._q){for(;s<_.length;)c(h,_[s++]);d=r.createElement(a);d.async=1;d.src="https://cdn.branch.io/branch-v1.3.4.min.js";k=r.getElementsByTagName(a)[0];k.parentNode.insertBefore(d,k);b[n]=h}})(window,document,"script","branch",function(b,r){b[r]=function(){b._q.push([r,arguments])}},{_q:[],_v:1},"init data setIdentity logout track link sendSMS referrals credits redeem banner closeBanner".split(" "),0);

// Arguments
// arg1: Your app id can be retrieved on the [Settings](https://dashboard.branch.io/#/settings) page of the dashboard
// arg2: the callback to notify you that the instance has instantiated
branch.init("APP-ID", function(err, data) {
  if (err) { return console.log(err); } // Error message if init is not successful
  console.log(JSON.stringify(data)); // object containing: data from referring link, referring identity, identity of user, and boolean indicating if user has the app installed on any device
});

```

Here is the location of the app id that you will need for the `branch.init` call above (_soon to be deprecated but will always be supported_):

![app id](resources/app_id.png)


### Close the session

Close sesion must be called whenever the app goes into the background, as it tells the native library that on the next app open, it should check if a new link had been clicked. If you don't call it, you'll notice that the deep link parameters will not be delivered reliably.

**[Formerly `closeSession()`](CORDOVA_UPGRADE_GUIDE.md)**

```js
// Arguments
// arg1: the callback to notify you if there was an error

branch.close(function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

#### Retrieve session data (install or open) parameters

This method returns the same data object as branch.init, and can be called at any point after branch is instantiated. These session parameters will be available at any point later on with this command. If no params, the dictionary will be empty. This refreshes with every new session (app installs AND app opens)

**[Formerly `getLatestReferringParams()`](CORDOVA_UPGRADE_GUIDE.md)**

```js
branch.data(function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(JSON.stringify(data)); // the same data object returned by branch.init
});
```

#### Retrieve install (install only) parameters

If you ever want to access the original session params (the parameters passed in for the first install event only), you can use this line. This is useful if you only want to reward users who newly installed the app from a referral link or something.

**[Formerly `getFirstReferringParams()`](CORDOVA_UPGRADE_GUIDE.md)**

```js
branch.first(function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(JSON.stringify(data)); // the same data object returned by branch.init
});
```

### Persistent identities

Often, you might have your own user IDs, or want referral and event data to persist across platforms or uninstall/reinstall. It's helpful if you know your users access your service from different devices. This where we introduce the concept of an 'identity'.

To identify a user, just call:
```js
branch.setIdentity("user_id_14512", function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(JSON.stringify(data)); // An object containing:
    // identity_id, Server-generated ID of the user identity
    // link, New link to use (replaces old stored link)
    // referring_data, Initial referring data for this identity
    // referring_identity, Initial referring identity for this identity
});
```

#### Logout

If you provide a logout function in your app, be sure to clear the user when the logout completes. This will ensure that all the stored parameters get cleared and all events are properly attributed to the right identity.

**Warning** this call will clear the referral credits and attribution on the device.

```js
branch.logout(function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

### Register custom events

**[Formerly `userCompletedAction()`](CORDOVA_UPGRADE_GUIDE.md)**

```js
branch.track("your_custom_event", function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

OR if you want to store some state with the event

```js
var branch = window.Branch;
branch.track("your_custom_event", { "time":135512331, "sessions":12 }, function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

Some example events you might want to track:
```js
"complete_purchase"
"wrote_message"
"finished_level_ten"
```

## Generate Tracked, Deep Linking URLs (pass data across install and open)

### Shortened links

There are a bunch of options for creating these links. You can tag them for analytics in the dashboard, or you can even pass data to the new installs or opens that come from the link click. How awesome is that? You need to pass a callback for when you link is prepared (which should return very quickly, ~ 50 ms to process).

For more details on how to create links, see the [Branch link creation guide](https://github.com/BranchMetrics/Branch-Integration-Guides/blob/master/url-creation-guide.md)

**[Formerly `getShortUrl()`](CORDOVA_UPGRADE_GUIDE.md)**

```js
// Associate data with a link
// you can access this data from any instance that installs or opens the app from this link (amazing...)
// associate a url with a set of tags, channel, feature, and stage for better analytics.
// channel: null or examples: "facebook", "twitter", "text_message", etc
// feature: null or examples: "sharing", "referral", "unlock", etc

var params = {
  tags: [ 'tag1', 'tag2' ],
  channel: 'sample app',
  feature: 'create link',
  stage: 'created link',
  type: 1,
  data: {
    mydata: 'bar',
    '$desktop_url': 'https://cdn.branch.io/example.html',
    '$og_title': 'Branch Metrics',
    '$og_description': 'Branch Metrics',
    '$og_image_url': 'http://branch.io/img/logo_icon_white.png'
  }
};

// Arguments
// arg1: The params object above, which specifies the link data
// arg2: A callback to catch any error returned, or if no error, to accept the URL generated.

branch.link(params, function(err, url) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(url); // URL for the user to share
});
```

There are other methods which exclude tag and data if you don't want to pass those. Explore Xcode's autocomplete functionality.

**Note**
You can customize the Facebook OG tags of each URL if you want to dynamically share content by using the following _optional keys in the data dictionary_:

| Key | Value
| --- | ---
| "$og_title" | The title you'd like to appear for the link in social media
| "$og_description" | The description you'd like to appear for the link in social media
| "$og_image_url" | The URL for the image you'd like to appear for the link in social media
| "$og_video" | The URL for the video
| "$og_url" | The URL you'd like to appear
| "$og_app_id" | Your OG app ID. Optional and rarely used.

Also, you can do custom redirection by inserting the following _optional keys in the dictionary_:

| Key | Value
| --- | ---
| "$desktop_url" | Where to send the user on a desktop or laptop. By default it is the Branch-hosted text-me service
| "$android_url" | The replacement URL for the Play Store to send the user if they don't have the app. _Only necessary if you want a mobile web splash_
| "$ios_url" | The replacement URL for the App Store to send the user if they don't have the app. _Only necessary if you want a mobile web splash_
| "$ipad_url" | Same as above but for iPad Store
| "$fire_url" | Same as above but for Amazon Fire Store
| "$blackberry_url" | Same as above but for Blackberry Store
| "$windows_phone_url" | Same as above but for Windows Store

You have the ability to control the direct deep linking of each link by inserting the following _optional keys in the dictionary_:

| Key | Value
| --- | ---
| "$deeplink_path" | The value of the deep link path that you'd like us to append to your URI. For example, you could specify "$deeplink_path": "radio/station/456" and we'll open the app with the URI "yourapp://radio/station/456?link_click_id=branch-identifier". This is primarily for supporting legacy deep linking infrastructure.
| "$always_deeplink" | true or false. (default is not to deep link first) This key can be specified to have our linking service force try to open the app, even if we're not sure the user has the app installed. If the app is not installed, we fall back to the respective app store or $platform_url key. By default, we only open the app if we've seen a user initiate a session in your app from a Branch link (has been cookied and deep linked by Branch)

## Referral system rewarding functionality

In a standard referral system, you have 2 parties: the original user and the invitee. Our system is flexible enough to handle rewards for all users. Here are a couple example scenarios:

1) Reward the original user for taking action (eg. inviting, purchasing, etc)

2) Reward the invitee for installing the app from the original user's referral link

3) Reward the original user when the invitee takes action (eg. give the original user credit when their the invitee buys something)

These reward definitions are created on the dashboard, under the 'Reward Rules' section in the 'Referrals' tab on the dashboard.

Warning: For a referral program, you should not use unique awards for custom events and redeem pre-identify call. This can allow users to cheat the system.


### Send a link via SMS

A robust function to give your users the ability to share links via SMS. If the user navigated to this page via a Branch link, `sendSMS` will send that same link. Otherwise, it will create a new link with the data provided in the `params` argument. `sendSMS` also  registers a click event with the `channel` pre-filled with `'sms'` before sending an sms to the provided `phone` parameter. This way the entire link click event is recorded starting with the user sending an sms.

**Note**: `sendSMS` will *automatically* send a previously generated link click, along with the `data` object in the original link. Therefore, it is unneccessary for the `data()` method to be called to check for an already existing link. If a link already exists, `sendSMS` will simply ignore the `data` object passed to it, and send the existing link. If this behaivior is not desired, set `make_new_link: true` in the `options` object argument of `sendSMS`, and `sendSMS` will always make a new link.

```js
// Note this is the same as the params object used for branch.link, above, minus the channel parameter. The channel is automatically set as 'sms'.

var params = {
  tags: [ 'tag1', 'tag2' ],
  feature: 'create link',
  stage: 'created link',
  type: 1,
  data: {
    mydata: 'bar',
    '$desktop_url': 'https://cdn.branch.io/example.html',
    '$og_title': 'Branch Metrics',
    '$og_description': 'Branch Metrics',
    '$og_image_url': 'http://branch.io/img/logo_icon_white.png'
  }
};

var smsOptions = { make_new_link: true };

// Arguments
// arg1: The phone number to txt the link
// arg2: The params object above, which specifies the link data
// arg3: An options object, currently only support the property "make_new_link" - which forces the creation of a new link to send via SMS, even if a link has already been created in the session
// arg4: A callback to catch any error returned

branch.sendSMS("9999999999", params, smsOptions, function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

### Get reward balance

Retrieves a complete summary of the referrals the current user has made.

**[Formerly `loadRewards()`](CORDOVA_UPGRADE_GUIDE.md)**

```js
branch.referrals(function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(JSON.stringify(data)); // Object containing a summary of all the referrals a user has made.
});
```

The response will return an object in the following format:
```json
{
  "install": {
    "total": 5,
    "unique": 2
  },
  "open": {
    "total": 4,
    "unique": 3
  },
  "buy": {
    "total": 7,
    "unique": 3
  }
}
```

### Redeem all or some of the reward balance (store state)

We will store how many of the rewards have been deployed so that you don't have to track it on your end. In order to save that you gave the credits to the user, you can call redeem. Redemptions will reduce the balance of outstanding credits permanently.

**[Formerly `redeemRewards()`](CORDOVA_UPGRADE_GUIDE.md)**

```js
// Arguments
// arg1: Amount of credits to be redeemed
// arg2: String of bucket name to redeem credits from
// arg3: (optional) Callback to catch error
branch.redeem(5, "default", function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

### Get credit history

This call will retrieve the entire history of credits and redemptions from the individual user.
The entire credit history of a user could return a *lot* of results, so an optional data object can be provided as the first argument.

**[Formerly `getCreditHistory()`](CORDOVA_UPGRADE_GUIDE.md)**

```js
var data = {
  "length": 50,
  "direction": 0,
  "begin_after_id": "123456789012345",
  "bucket": "default"
};

branch.creditHistory(data, function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(JSON.stringify(data));
  // retrieve and display the credit history
  // example transaction opbject below
});
```

The response will return an array that has been parsed from the following JSON:
```json
[
  {
    "transaction": {
      "date": "2014-10-14T01:54:40.425Z",
      "id": "50388077461373184",
      "bucket": "default",
      "type": 0,
      "amount": 5
    },
    "referrer": "12345678",
    "referree": null
  },
  {
    "transaction": {
      "date": "2014-10-14T01:55:09.474Z",
      "id": "50388199301710081",
      "bucket": "default",
      "type": 2,
      "amount": -3
    },
    "referrer": null,
    "referree": "12345678"
  }
]
```
**referrer**
: The id of the referring user for this credit transaction. Returns null if no referrer is involved. Note this id is the user id in developer's own system that's previously passed to Branch's identify user API call.

**referree**
: The id of the user who was referred for this credit transaction. Returns null if no referree is involved. Note this id is the user id in developer's own system that's previously passed to Branch's identify user API call.

**type**
: This is the type of credit transaction

1. _0_ - A reward that was added automatically by the user completing an action or referral
1. _1_ - A reward that was added manually
2. _2_ - A redemption of credits that occurred through our API or SDKs
3. _3_ - This is a very unique case where we will subtract credits automatically when we detect fraud


### Create a referral code

Create a referral code using the supplied parameters.  The code can be given to other users to enter.  Applying the code will add credits to the referrer, referree or both.

The data can containt the following fields:
"amount" - A required integer specifying the number of credits added when the code is applied.
"bucket" - The optional bucket to apply the credits to.  Defaults to "default".
"calculation_type" - A required integer.  1 for unlimited uses, 0 for one use.
"location" - A required integer. Determines who get's the credits.  0 for the referree, 2 for the referring user or 3 for both.
"prefix" - An optional string to be prepended to the code.
"expiration" - An optional date string.  If present, determines the date on which the code expires.

```js
var data = {
  "amount": 10,
  "bucket": "party",
  "calculation_type": 1,
  "location": 2
};

branch.getCode(data, function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(data) // Referral code, returned as an object in the format of: { "referral_code": "AB12CD" }
});
```

### Validate a referral code

This method simply validates a referral code prior to using it.

```js
branch.validateCode("code_t0_validate", function(err, data) {
  if (err) { console.log(err); } // Error message if code not valid
  else { console.log("Code is valid"); }
});
```

### Apply a referral code

This method simply applies a referral code.

```js
branch.applyCode("code_to_apply", function(err, data) {
  if (err) { console.log(err); } // Error message if code not applied
  else { console.log("Code applied"); }
});
```
