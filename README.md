# Branch Metrics Web SDK

This README will outline the functionality of the Branch Metrics Web SDK.

Live demo: http://s3-us-west-1.amazonaws.com/branch-sdk/example.html

## Installation

### Requirements

This SDK requires native browser Javascript and has been tested in all modern browsers with `sessionStorage` capability.  A more verbose list of supported browsers will be available soon.  No 3rd party libraries are needed to make use of the SDK as is it 100% native Javascript. 

You will need to create a Branch Metrics app to obtain your `app_id`.  

Create your free account here: http://branch.io

### Quick Install

Place this code in the `</head>` statement in your HTML.  Be sure to replace `YOUR_APP_ID` with your Branch app ID.

```html
<script type="text/javascript">
  (function() {

    var config = {
      app_id: 'YOUR_APP_ID',
      debug: true,
      init_callback: function(){
        console.log('Branch SDK initialized!');
      }
    };

    // Begin Branch SDK //
    var Branch_Init=function(a){self=this,self.app_id=a.app_id,self.debug=a.debug,self.init_callback=a.init_callback,
    self.queued=[],this.init=function(){for(var a=['close','logout','track','identify','createLink','showReferrals','showCredits',
    'redeemCredits','appBanner'],b=0;b<a.length;b++)self[a[b]]=function(a){return function(){self.queued.push([a].concat(Array
    .prototype.slice.call(arguments,0)))}}(a[b])},self.init();var b=document.createElement('script');b.type='text/javascript',b
    .async=!0,b.src='https://s3-us-west-1.amazonaws.com/branch-sdk/branch.min.js',document.getElementsByTagName('head')[0]
    .appendChild(b)};window.branch=new Branch_Init(config);
    // End Branch SDK //

  })();
</script>
```

## API Reference

**[Constructor](#constructor)**  
**[Queued Methods](#queued-methods)**  
**[Session Methods](#session-methods)**  
   - **[.init()](#init)**  
   - **[.identify()](#identify)**  
   - **[.close()](#close)**  
   - **[.logout()](#logout)**  

**[Event / Action Methods](#event--action-methods)**  
   - **[.track()](#track)**  

**[Deeplinking Methods](#deeplinking-methods)**  
   - **[.createLink()](#createlink)**  
   - **[.SMSLink()](#smslink)**  
   - **[.createLinkClick()](#createlinkclick)** 

**[Smart Banners](#smart-banners)**  
   - **[.appBanner()](#appbanner)**  

**[Referral Methods](#referral-methods)**  
   - **[.showReferrals()](#showreferrals)**  
   - **[.showCredits()](#showcredits)**  
   - **[.redeemCredits()](#redeemcredits)**  

**[Bugs / Help / Support](#bugs--help--support)**

### Constructor

Loading the Branch SDK into your app will automatically instantiate the SDK class under the variable 
`branch` that is immediately available in the DOM.  Instantiation also calls `.init()` to properly 
setup your SDK environment.

### Queued Methods

This SDK allows queued method calls before the SDK has called `.init()`  This allows you to call methods 
before the SDK is ready for real-time calls.  Any method called before the SDK is ready will be queued 
in the DOM and executed thereafter in order of execution.

### Session Methods

These are the core methods of the SDK.  These are only accessible if the `Branch()` construct is 
initilized properly.

#### .init()

This initilizes the Branch SDK and creates a new user session if `branch_session` does not exist in 
`sessionStorage`.  If there is a valid session in `sessionStorage`, this will be used in place.

##### Usage

```
Branch.init(
  callback (function, optional)
)
```

##### Example

```javascript
branch.init(function(data){
  console.log(data)
});
```

##### Returns

```js
{
  session_id:         '12345', // Server-generated ID of the session. Store this locally.
  identity_id:        '12345', // Server-generated ID of the user identity. Store this locally.
  device_fingerprint: 'abcde', // Server-generated ID of the device fingerprint. Store this locally
  data:               {},      // If the user was referred from a link, and the link has associated data, the data is passed in here.
  link:               'url',   // Server-generated link, for synchronous link creation.
  referring_identity: '12345', // If the user was referred from a link, and the link was created by a user with a developer identity, that identity is here.
}
```

**Note:** `Branch.init` is called every time the constructor is loaded.  This is to properly set the session 
environment, allowing controlled access to the other SDK methods.

#### .identify()

Set profile data.

##### Usage

```
Branch.identify(
  (JSON object, required) {
    identity (string, required), // Identity of the loaded user.  Normally used to pass service username or email address.
  }, 
  callback (fuction, optional)
)
```

##### Example

```js
branch.identify({
  identity: 'username'
}, function(data){
  console.log(data)
});
```

##### Returns 

```js
{
  identity_id:        '12345', // Server-generated ID of the user identity. Store this locally.
  link:               'url',   // New link to use (replaces old stored link).
  referring_data:     {},      // Returns the initial referring data for this identity, if exists.
  referring_identity: '12345'  // Returns the initial referring identity for this identity, if exists.
}
```

#### .close()

This closes the active session, removing any relevant session inforation stored in `sessionStorage`.

##### Usage

```
Branch.close(
  callback (function, optional)
)
```

##### Example

```js
branch.close(function(data){
  console.log(data)
});
```

##### Returns 

```
{}
```

#### .logout()

Logs out the current session, replaces session IDs and identity IDs.

##### Usage

```
Branch.logout(
  callback (function, optional)
)
```

##### Example

```js
branch.logout(function(data){
  console.log(data)
});
```

##### Returns 

```js
{
  session_id:  '12345', // Server-generated ID of the session. Store this locally.
  identity_id: '12345', // Server-generated ID of the user identity. Store this locally.
  link:        'url',   // Server-generated link, for synchronous link creation.
}
```

### Event / Action Methods

#### .track()

Track any event with supporting metadata.  Events are used to create funnels.

The `metadata` parameter is a formatted JSON object that can contain any data, and has limitless hierarchy. 

##### Usage

```
Branch.track(
  event (string, required),         // The event name; i.e. 'Loaded a page'
  metadata (JSON object, optional), // Additional information attached to the event in JSON format.
  callback (function, optional)
)
```

##### Example

```js
branch.track('Loaded a page', {page: 'Homepage'}, function(data){
  console.log(data)
});
```

##### Returns 

```js
{}
```

### Deeplinking Methods

#### .createLink()

Create a deep linking URL.  The `data` parameter can include Facebook Open Graph data.  To read more about 
Open Graph, visit https://developers.facebook.com/docs/opengraph.

##### Usage

```
Branch.createLink(
  (JSON Object, required) {
    tags (JSON array, optional),           // An array of tags for splitting out data in the dashboard.
    channel (string, optional),            // A string to indicate the external channel (text_message, mail, facebook, etc).
    feature (string, optional),            // The string for a particular feature (invite, referral).
    stage (string, optional),              // A string representing the progress of the user.
    type (int, optional),                  // Use 1 for one time use links, 0 for persistent.
    data (JSON object, optional) {         // This parameter takes any JSON object and attaches it to the link created.  Reserved
                                           // parameters are denoted with '$'.
      '$desktop_url' (url, optional),      // Custom redirect URL for desktop link clicks.
      '$ios_url' (url, optional)           // Custom redirect URL for iOS device clicks.
      '$ipad_url' (url, optional)          // Custom redirect URL for iPad clicks.  Overrides $ios_url on iPads.
      '$android_url' (url, optional)       // Custom redirect URL for Android device clicks.
      '$og_app_id' (string, optional)      // Facebook app ID for Open Graph data.
      '$og_title', (string, optional)      // Open Graph page title.
      '$og_description' (string, optional) // Open Graph page description.
      '$og_image_url' (url, optional)      // Open graph page image/icon URL.
    },
    callback (function, optional)
  }
)
```

##### Example

```js
branch.createLink({
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
}, function(data){
  console.log(data)
});
```

##### Returns

```
{}
```

#### .SMSLink()

Calls `branch.CreateLink()` with a pre-filled `channel` parameter set to `sms` and sends an SMS message with a link to the 
provided `phone` parameter.  International SMS supported.

##### Usage

```
Branch.SMSLink(
  (JSON Object, required) {
    phone (long int, required)             // The phone number to send the SMS.
    tags (JSON array, optional),           // An array of tags for splitting out data in the dashboard.
    feature (string, optional),            // The string for a particular feature (invite, referral).
    stage (string, optional),              // A string representing the progress of the user.
    type (int, optional),                  // Use 1 for one time use links, 0 for persistent.
    data (JSON object, optional) {         // This parameter takes any JSON object and attaches it to the link created.  Reserved
                                           // parameters are denoted with '$'.
      '$desktop_url' (url, optional),      // Custom redirect URL for desktop link clicks.
      '$ios_url' (url, optional)           // Custom redirect URL for iOS device clicks.
      '$ipad_url' (url, optional)          // Custom redirect URL for iPad clicks.  Overrides $ios_url on iPads.
      '$android_url' (url, optional)       // Custom redirect URL for Android device clicks.
      '$og_app_id' (string, optional)      // Facebook app ID for Open Graph data.
      '$og_title', (string, optional)      // Open Graph page title.
      '$og_description' (string, optional) // Open Graph page description.
      '$og_image_url' (url, optional)      // Open graph page image/icon URL.
    },
    callback (function, optional)
  }
)
```

##### Example

```js
branch.SMSLink({
  phone: 1234567890,
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
}, function(data){
  console.log(data)
});
```

##### Returns

```
{}
```

#### .sendSMSLink()

Not to be confused with `Branch.SMSLink()`.  This method sends a request to a pre-configured link for sending SMS
links.  You can call this if you already have a link configured, i.e. `http://bnc.lt/c/randomStringId`.  It is 
recommended you use the `Branch.SMSLink()` method as it is designed to handle this workflow.

##### Usage

```
Branch.sendSMSLink(
    link_url (string, required),
    callback (function, optional)
  }
)
```

##### Example

```js
branch.sendSMSLink('http://bnc.lt/c/randomStringId', function(data){
  console.log(data)
});
```

##### Returns

```
{
  message: 'Text message sent.'
}
```

#### .createLinkClick()

Perform an anonymous click to a generated URL.  Used primarily to create a link click ID to be used for other SDK
methods.  Clicks will not be attributed to a platfom, device or browser fingerprint.

##### Usage

```
Branch.createLinkClick (
  url (string, required),
  callback (function, optional)
)
```

##### Example

```js
branch.createLinkClick('http://bnc.lt/l/randomString', function(click_id){
  console.log(click_id)
});
```

##### Returns

```
randomStringId
```

#### .createLinkClick()

Perform an anonymous click to a generated URL.  Used primarily to create a link click ID to be used for other SDK
methods.  Clicks will not be attributed to a platfom, device or browser fingerprint.

##### Usage

```
Branch.createLinkClick (
  url (string, required),
  callback (function, optional)
)
```

##### Example

```js
branch.createLinkClick('http://bnc.lt/l/randomString', function(click_id){
  console.log(click_id)
});
```

##### Returns

```
randomStringId
```

### Smart Banners

Generate on mobile and desktop browsers to direct to app installs through deeplinking.

#### .appBanner()

Display a smart banner directing a user to your app through a Branch referral link.  The `data` param is the exact same as in `Branch.createLink()`.

##### Usage

```
Branch.appBanner(
  (JSON object, required) {
    icon (string, recommended),       // URL path to your app's icon.  Recommended size is 50px by 50px with no border or whitespace.
    title (string, recommended)       // The title or name of your app.
    description (string, recommended) // The description of your app.
    data (JSON object, optional)      // Verbatim data used in Branch.createLink().  This data is passed with your clicked links.
  }
)
```

##### Example

```js
branch.appBanner({
  icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
  title: 'My App',
  description: 'This is my app!',
  data: {
    foo: 'bar'
  }
});
```

##### Returns

```
Nothing
```

### Referral Methods

#### .showReferrals()

Retrieve list of referral for the current user.

##### Usage

```
Branch.showReferrals(
  callback (function, optional)
)
```

##### Example

```js
branch.showReferrals(function(data){
  console.log(data)
});
```

##### Returns

```js
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
}
```

#### .showCredits()

Retrieve a list of credits for the current user.

##### Usage

```
Branch.showCredits(
  callback (function, optional)
)
```

##### Example

```js
branch.showCredits(function(data){
  console.log(data)
});
```

##### Returns

```js
{
  'default': 15,
  'other bucket': 4
}
```

#### .redeemCredits()

Redeem credits from a credit bucket.

##### Usage

```
Branch.redeemCredits(
  (JSON object, required) {
    amount (int, required),
    bucket (string, required)
  },
  callback (function, optional)
)
```

##### Example

```js
branch.redeemCredits({
  5,
  'bucket'
}, function(data){
  console.log(data)
});
```

##### Returns

```js
{}
```

## Bugs / Help / Support

Feel free to report any bugs you might encounter in the repo's issues. Any support inquiries outside of bugs 
please send to sean@branch.io.
