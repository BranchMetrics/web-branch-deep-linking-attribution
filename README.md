# Branch Metrics Web SDK

This README outlines the functionality of the Branch Metrics Web SDK, and how to easily incorporate it into a web app.

Live demo: [http://s3-us-west-1.amazonaws.com/branch-web-sdk/example.html](http://s3-us-west-1.amazonaws.com/branch-web-sdk/example.html)

## Overview

The Branch Web SDK provides an easy way to interact with the Branch API on your website or web app. It requires no frameworks, and is only ~4kB gzipped.

To use the Web SDK, you'll need to first initialize it with your API key found in your [Branch dashboard](https://dashboard.branch.io/#/settings). You'll also need to register when your users login with `setIdentity`, and when they logout with `logout`.

Once initialized, the Branch Web SDK allows you to create and share links with a banner, over SMS, or your own methods. It also offers event tracking, access to referrals, and management of credits.

## Installation

### Requriements

This SDK requires native browser Javascript and has been tested in all modern browsers with sessionStorage capability. No 3rd party libraries are needed to make use of the SDK as is it 100% native Javascript.

### Browser Specific Support
| Chrome | Firefox | Safari |     IE     |
| ------ | ------- | ------ | ---------- |
|    &#10004;   |    &#10004;    |   &#10004;    |  9, 10, 11 |

### API Key

You will need to create a [Branch Metrics app](http://branch.io) to obtain your app_key.

### Quick Install
*Be sure to replace APP-KEY with your actual app key found in your [account dashboard](https://dashboard.branch.io/#/settings).

# TODO: Update src of actual gziped js file

```html
<script type="text/javascript">
!function(e,n,t,s,r,a,i,c,o,m){if(!e[s]||!e[s]._q){for(;c<i.length;)r(a,i[c++]);o=n.createElement(t),o.async=1,o.src=
"https://s3-us-west-1.amazonaws.com/branch-web-sdk/branch-0.3.x.min.js.gzip",m=n.getElementsByTagName(t)[0],m.parentNode.insertBefore(o,m),
e[s]=a}}(window,document,"script","branch",function(e,n){e[n]=function(){e._q.push([n,arguments])}},{_q:[],_v:1},
"init;close;logout;event;profile;link;referrals;credits;redeem;banner".split(";"),0);

branch.init('APP-KEY', function(err, data) {
  // callback to handle err or data
});
</script>
```
## API Reference

1. Branch Session
  + [.init()](#initapp_id-callback)
  + [.setIdentity()](#setidentityidentity-callback)
  + [.logout()](#logoutcallback)

1. Event Tracking Methods
  + [.track()](#trackevent-metadata-callback)

1. Deeplinking Methods
   + [.link()](#linkmetadata-callback)
   + [.sendSMS()](#sendsmsphone-linkdata-options-callback)

1. Referral Methods
   + [.referrals()](#referralscallback)
   + [.credits()](#creditscallback)
   + [.redeem()](#redeemamount-bucket-callback)

1. Smart Banner
   + [.banner()](#banneroptions-linkdata)

___

# Global





* * *

### init(app_id, callback) 

**Parameters**

**app_id**: `number`, **Required** Found in your Branch dashboard

**callback**: `function | null`, Callback function that returns the session data

Adding the Branch script to your page automatically creates a window.branch object with all the external methods described below. All calls made to Branch methods are stored in a queue, so even if the SDK is not fully instantiated, calls made to it will be queued in the order they were originally called.
The init function on the Branch object initiates the Branch session and creates a new user session, if it doesn't already exist, in `sessionStorage`. 
**Useful Tip**: The init function returns a data object where you can read the link the user was referred by.

##### Usage
```js
Branch.init(
    app_id,
    callback(err, data)
)
```

##### Callback
```js
callback(
     error: "Error message",
     {
          data:               {},      // If the user was referred from a link, and the link has associated data, the data is passed in here.
          referring_identity: '12345', // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
          has_app: true,               // Does the user have the app installed already?
          identity: 'BranchUser'       // Unique string that identifies the user
     });
```

**Note:** `Branch.init` must be called prior to calling any other Branch functions.
___



### readSession(callback) 

**Parameters**

**callback**: `string`, Callback function that returns the session data

Returns the same session information and any referring data, as `Branch.init`, but does not require the `app_id`. This is meant to be called after `Branch.init` has been called if you need the session information at a later point. If the Branch session has already been initialized, the callback will return immediately, otherwise, it will return once Branch has been initialized.



### setIdentity(identity, callback) 

**Parameters**

**identity**: `string`, **Required** A string uniquely identifying the user

**callback**: `function | null`, Callback that returns the user's Branch identity id and unique link

**Formerly `identify()` (depreciated).** See [CHANGELOG](CHANGELOG.md)

Sets the identity of a user and returns the data. To use this function, pas a unique string that identifies the user - this could be an email address, UUID, Facebook ID, etc.

##### Usage
```js
Branch.setIdentity(
    identity,
    callback(err, data)
)
```

##### Callback 
```js
callback(
     error: "Error message",
     {
          identity_id:        '12345', // Server-generated ID of the user identity, stored in `sessionStorage`.
          link:               'url',   // New link to use (replaces old stored link), stored in `sessionStorage`.
          referring_data:     {},      // Returns the initial referring data for this identity, if exists.
          referring_identity: '12345'  // Returns the initial referring identity for this identity, if exists.
     });
```
___



### logout(callback) 

**Parameters**

**callback**: `function | null`, Returns id's of the session and user identity, and the link

Logs out the current session, replaces session IDs and identity IDs.

##### Usage
```js
Branch.logout(
    callback(err, data)
)
```

##### Callback
```js
callback(
     error: "Error message",
     {
          session_id:  '12345', // Server-generated ID of the session, stored in `sessionStorage`
          identity_id: '12345', // Server-generated ID of the user identity, stored in `sessionStorage`
          link:        'url',   // Server-generated link identity, for synchronous link creation, stored in `sessionStorage`
     });
```
___

## Tracking events



### track(event, metadata, callback) 

**Parameters**

**event**: `String`, **Required** The name of the event to be tracked

**metadata**: `Object | null`, Object of event metadata

**callback**: `function | null`, Returns an error if unsuccessful

This function allows you to track any event with supporting metadata. Use the events you track to create funnels in the Branch dashboard.
The `metadata` parameter is a formatted JSON object that can contain any data and has limitless hierarchy.

##### Usage
```js
Branch.event(
    event,
    metadata,
    callback(err)
)
```

##### Callback
```js
callback( error: "Error message" );
```
___

# Deeplinking Methods

## Creating a deep linking link



### link(metadata, callback) 

**Parameters**

**metadata**: `Object | null`, Object of link metadata

**callback**: `function | null`, Returns a string of the Branch deep linking URL

**Formerly `createLink()` (depreciated).** See [CHANGELOG](CHANGELOG.md)

Creates and returns a deep linking URL.  The `data` parameter can include an object with optional data you would like to store, including Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).

#### Usage
```
Branch.link(
    metadata,
    callback(err, data)
)
```

#### Example
```js
branch.link({
    tags: ['tag1', 'tag2'],
    channel: 'facebook',
    feature: 'dashboard',
    stage: 'new user',
    type: 1,
    data: {
        mydata: {
	           foo: 'bar'
        },
    '$desktop_url': 'http://myappwebsite.com',
    '$ios_url': 'http://myappwebsite.com/ios',
    '$ipad_url': 'http://myappwebsite.com/ipad',
    '$android_url': 'http://myappwebsite.com/android',
    '$og_app_id': '12345',
    '$og_title': 'My App',
    '$og_description': 'My app\'s description.',
    '$og_image_url': 'http://myappwebsite.com/image.png'
		}
}, function(err, data) {
    console.log(err || data);
});
```

##### Callback
```js
callback(
     error: "Error message",
     'https://bnc.lt/l/3HZMytU-BW' // Branch deep linking URL
     );
```
___

## Sharing links via SMS



### sendSMS(phone, linkData, options, callback) 

**Parameters**

**phone**: `String`, **Required** Phone number to txt

**linkData**: `Object`, **Required** Object of all link data

**options**: `Object | null`, Options, currently only includes: make_new_link, which forces the creation of a new link even if one already exists

**callback**: `function | null`, Returns an error if unsuccessful

**Formerly `SMSLink()` (depreciated).** See [CHANGELOG](CHANGELOG.md)

A robust function to give your users the ability to share links via SMS. If the user navigated to this page via a Branch link, `sendSMS` will send that same link. Otherwise, it will create a new link with the data provided in the `metadata` argument. `sendSMS` also  registers a click event with the `channel` pre-filled with `'sms'` before sending an sms to the provided `phone` parameter. This way the entire link click event is recorded starting with the user sending an sms. **Supports international SMS**.

#### Usage
```js
Branch.sendSMS(
    metadata,            // Metadata must include phone number as `phone`
    callback(err, data),
    make_new_link    // Default: false
)
```

##### Example
```js
branch.sendSMS({
    phone: '9999999999',
    {
         tags: ['tag1', 'tag2'],
         channel: 'facebook',
         feature: 'dashboard',
         stage: 'new user',
         type: 1,
         data: {
             mydata: {
                 foo: 'bar'
             },
         '$desktop_url': 'http://myappwebsite.com',
         '$ios_url': 'http://myappwebsite.com/ios',
         '$ipad_url': 'http://myappwebsite.com/ipad',
         '$android_url': 'http://myappwebsite.com/android',
         '$og_app_id': '12345',
         '$og_title': 'My App',
         '$og_description': 'My app\'s description.',
         '$og_image_url': 'http://myappwebsite.com/image.png'
         }
    },
    { make_new_link: true}, // Default: false. If set to true, sendSMS will generate a new link even if one already exists
    function(err) { console.log(err); }
});
```

##### Callback
```js
callback( error: "Error message" );
```
___

# Referral system rewarding functionality
In a standard referral system, you have 2 parties: the original user and the invitee. Our system is flexible enough to handle rewards for all users for any actions. Here are a couple example scenarios:
1. Reward the original user for taking action (eg. inviting, purchasing, etc)
2. Reward the invitee for installing the app from the original user's referral link
3. Reward the original user when the invitee takes action (eg. give the original user credit when their the invitee buys something)

These reward definitions are created on the dashboard, under the 'Reward Rules' section in the 'Referrals' tab on the dashboard.

Warning: For a referral program, you should not use unique awards for custom events and redeem pre-identify call. This can allow users to cheat the system.

## Retrieve referrals list



### referrals(callback) 

**Parameters**

**callback**: `function | null`, Returns an error or object with referral data on success

**Formerly `showReferrals()` (depreciated).** See [CHANGELOG](CHANGELOG.md)

Retrieves a complete summary of the referrals the current user has made.

##### Usage
```js
Branch.referrals(
    callback(err, data)
)
```

##### Callback
```js
callback(
     error: "Error message",
    {
         'install': {
              total: 5,
              unique: 2
         },
         'open': {
              total: 4,
              unique: 3
         },
        'buy': {
             total: 7,
             unique: 3
         }
    });
```

## Credit history



### credits(callback) 

**Parameters**

**callback**: `function | null`, Returns an error or object with credit data on success

**Formerly `showCredits()` (depreciated).** See [CHANGELOG](CHANGELOG.md)

This call will retrieve the entire history of credits and redemptions from the individual user.

##### Usage
```js
Branch.credits(
    callback(err, data)
)
```

##### Callback
```js
callback(
     error: "Error message",
     {
          'default': 15,
          'other bucket': 9
     });
```

## Credit redemption



### redeem(amount, bucket, callback) 

**Parameters**

**amount**: `Int`, **Required** An `amount` (int) of number of credits to redeem

**bucket**: `String`, **Required** A name of the `bucket` (string) of which bucket to redeem the credits from

**callback**: `function | null`, Returns an error if unsuccessful

**Formerly `redeemCredits()` (depreciated).** See [CHANGELOG](CHANGELOG.md)

Credits are stored in `buckets`, which you can define as points, currency, whatever makes sense for your app. When you want to redeem credits, call this method with the number of points to be redeemed, and the bucket to redeem them from.

```js
Branch.redeem(
    amount, // amount of credits to be redeemed
    bucket,  // String of bucket name to redeem credits from
    callback(err)
)
```

##### Example

```js
branch.redeem(
    5,
    "Rubies",
    function(data){
         console.log(data)
});
```

##### Callback
```js
callback( error: "Error message" );
```
___

# Smart App Sharing Banner

The Branch Web SDK has a built in sharing banner, that automatically displays a device specific banner for desktop, iOS, and Android. If the banner is shown on a desktop, a form for sending yourself the download link via SMS is shown.
Otherwise, a button is shown that either says an "open" app phrase, or a "download" app phrase, based on whether or not the user has the app installed. Both of these phrases can be specified in the parameters when calling the banner function.
**Styling**: The banner automatically styles itself based on if it is being shown on the desktop, iOS, or Android.



### banner(options, linkData) 

**Parameters**

**options**: `Object`, **Required** Object of all the options to setup the banner

**linkData**: `Object`, **Required** Object of all link data, same as Branch.link()

**Formerly `appBanner()` (depreciated).** See [CHANGELOG](CHANGELOG.md)

Display a smart banner directing the user to your app through a Branch referral link.  The `linkData` param is the exact same as in `branch.link()`.

![iOS Smart Banner](docs/images/ios-web-sdk-banner-1.0.0.png)
##### iOS Smart Banner
___
![Android Smart Banner](docs/images/android-web-sdk-banner-1.0.0.png)
##### Android Smart Banner
___
![Desktop Smart Banner](docs/images/desktop-web-sdk-banner-1.0.0.png)
##### Desktop Smart Banner
___

#### Usage

```js
Branch.banner(
    options, 	// Banner options: icon, title, description, openAppButtonText, downloadAppButtonText, showMobile, showDesktop
    linkData     // Data for link, same as Branch.link()
)
```

##### Example

```js
branch.banner({
    icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
    title: 'Branch Demo App',
    description: 'The Branch demo app!',
    openAppButtonText: 'Open',             // Text to show on button if the user has the app installed
    downloadAppButtonText: 'Download',     // Text to show on button if the user does not have the app installed
    showMobile: true,                      // Should the banner be shown on mobile devices?
    showDesktop: true                      // Should the banner be shown on mobile devices?
}, {
    phone: '9999999999',
    tags: ['tag1', 'tag2'],
    feature: 'dashboard',
    stage: 'new user',
    type: 1,
    data: {
        mydata: {
            foo: 'bar'
        },
    '$desktop_url': 'http://myappwebsite.com',
    '$ios_url': 'http://myappwebsite.com/ios',
    '$ipad_url': 'http://myappwebsite.com/ipad',
    '$android_url': 'http://myappwebsite.com/android',
    '$og_app_id': '12345',
    '$og_title': 'My App',
    '$og_description': 'My app\'s description.',
    '$og_image_url': 'http://myappwebsite.com/image.png'
    }

});
```




* * *










## Bugs / Help / Support

Feel free to report any bugs you might encounter in the repo's issues. Any support inquiries outside of bugs 
please send to [dmitri@branch.io](mailto:dmitri@branch.io).