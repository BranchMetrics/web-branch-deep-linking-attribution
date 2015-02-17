# Global





* * *

### &#39;init&#39;(app_id, callback) 

Adding the Branch script to your page, automatically creates a window.branch object with all of the external methods described below. All calls made to Branch methods are stored in a queue, so even if the SDK is not fully insantiated, calls made to it will be queed in the order they were originally called. The init function on the Branch object initiates the Branch session and creates a new user session if it doesn't already exist in `sessionStorage`.

##### Usage

```
Branch.init(
    app_di,
    callback(err, data)
)
```

##### Returns

```js
{
    session_id:         '12345', // Server-generated ID of the session, stored in `sessionStorage`
    identity_id:        '12345', // Server-generated ID of the user identity, stored in `sessionStorage`
    device_fingerprint: 'abcde', // Server-generated ID of the device fingerprint, stored in `sessionStorage`
    data:               {},      // If the user was referred from a link, and the link has associated data, the data is passed in here.
    link:               'url',   // Server-generated link identity, for synchronous link creation.
    referring_identity: '12345', // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
}
```

**Parameters**

**app_id**: `number`, **Required** Found in your Branch dashboard

**callback**: `function | null`, Callback function that returns the data

**Note:** `Branch.init` is called every time the constructor is loaded.  This is to properly set the session environment, allowing controlled access to the other SDK methods.
___



### &#39;profile&#39;(identity, callback) 

Sets the profile of a user and returns the data.

**Formerly `identify()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

##### Usage

```
Branch.profile(
    identity, 
    callback(err, data)
)
```

 ##### Returns 

```js
{
    identity_id:        '12345', // Server-generated ID of the user identity, stored in `sessionStorage`.
    link:               'url',   // New link to use (replaces old stored link), stored in `sessionStorage`.
    referring_data:     {},      // Returns the initial referring data for this identity, if exists.
    referring_identity: '12345'  // Returns the initial referring identity for this identity, if exists.
}
```

**Parameters**

**identity**: `string`, **Required** A string uniquely identifying the user

**callback**: `function | null`, Callback that returns the user's Branch identity id and unique link

___



### &#39;logout&#39;(callback) 

Logs out the current session, replaces session IDs and identity IDs.

##### Usage

```
Branch.logout(
    callback(err, data)
)
```

##### Returns 

```js
{
    session_id:  '12345', // Server-generated ID of the session, stored in `sessionStorage`
    identity_id: '12345', // Server-generated ID of the user identity, stored in `sessionStorage`
    link:        'url',   // Server-generated link identity, for synchronous link creation, stored in `sessionStorage`
}
```

**Parameters**

**callback**: `function | null`, Returns id's of the session and user identity, and the link

___



### &#39;event&#39;(event, metadata, callback) 

This function allows you to track any event with supporting metadata. Use the events you track to create funnels in the Branch dashboard.
The `metadata` parameter is a formatted JSON object that can contain any data, and has limitless hierarchy. 

**Formerly `track()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

##### Usage

```
Branch.event(
    event,	
    metadata, 
    callback(err, data)
)
```

##### Returns 

```js
{}
```

**Parameters**

**event**: `String`, **Required** The name of the event to be tracked

**metadata**: `Object | null`, Object of event metadata

**callback**: `function | null`, Returns an empty object or an error

___



### &#39;link&#39;(metadata, callback) 

Creates and returns a deep linking URL.  The `data` parameter can include an object with optional data you would like to store, including Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).

**Formerly `createLink()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

#### Usage

```
Branch.link(
    metadata,
    callback(err, data)
)
```

#### Example

````
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
````

##### Returns 

```js
{ 
    link: 'https://bnc.lt/l/3HZMytU-BW' // Branch deep linking URL
}
```

##### Returns 

```js
{}
```

**Parameters**

**metadata**: `Object | null`, Object of link metadata

**callback**: `function | null`, Returns a string of the Branch deep linking URL

___



### &#39;SMSLink&#39;(metadata, callback) 

Uses the already created link that is stored in `sessionStorage`, or creates a link if one has not been created, then registers a click event with the `channel` prefilled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.

#### Usage

```
Branch.SMSLink(
    metadata,    // Metadata must include phone number as `phone`
    callback(err, data)
)
```

#### Example

```
branch.SMSLink(
    phone: '9999999999',
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

**Parameters**

**metadata**: `Object`, **Required** Object of all link data, requires phone number as `phone`

**callback**: `function | null`, Returns an empty object or an error

___



### &#39;SMSLinkNew&#39;(metadata, callback) 

Forces the creation of a new link and stores it in `sessionStorage`, then registers a click event with the `channel` prefilled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.

#### Usage

```
Branch.SMSLinkNew(
    metadata,    // Metadata must include phone number as `phone`
    callback(err, data)
)
```

**Parameters**

**metadata**: `Object`, **Required** Object of all link data, requires phone number as `phone`

**callback**: `function | null`, Returns an error or empyy object on success

___



### &#39;SMSLinkExisting&#39;(phone, callback) 

Registers a click event on the already created Branch link stored in `sessionStorage` with the `channel` prefilled with `'sms'` and sends an SMS message to the provided `phone` parameter. **Supports international SMS**.

#### Usage

```
Branch.SMSLinkExisting(
    metadata,     // Metadata must include phone number as `phone`
    callback(err, data)
)
```

**Parameters**

**phone**: `String`, **Required** String of phone number the link should be sent to

**callback**: `function | null`, Returns an error or empty object on success

___



### &quot;referrals&quot;(callback) 

Retrieves list of referrals for the current user.

**Formerly `showReferrals()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

##### Usage
```
Branch.referrals(
    callback(err, data)
)
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

**Parameters**

**callback**: `function | null`, Returns an error or object with referral data on success

___



### &quot;credits&quot;(callback) 

Retrieves a list of credits for the current user.

**Formerly `showCredits()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

##### Usage
```
Branch.credits(
    callback(err, data)
)
```

##### Returns 

```js
{
    'default': 15,
    'other bucket': 9
}
```

**Parameters**

**callback**: `function | null`, Returns an error or object with credit data on success

___



### &quot;redeem&quot;(obj, callback) 

Redeem credits from a credit bucket.

**Formerly `redeemCredits()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

```
Branch.redeem(
{
    amount, // amount of credits to be redeemed
    bucket  // String of bucket name to redeem credits from
},
    callback(err, data)
)
```

##### Example

```
branch.redeem({
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

**Parameters**

**obj**: `Object`, **Required** Object with an `amount` (int) param of number of credits to redeem, and `bucket` (string) param of which bucket to redeem the credits from

**callback**: `function | null`, Returns an error or empty object on success

___



### &quot;banner&quot;(data) 

Display a smart banner directing the user to your app through a Branch referral link.  The `data` param is the exact same as in `branch.link()`.

**Formerly `appBanner()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

#### Usage

```
Branch.banner(
    metadata, 	// Metadata, same as Branch.link(), plus 5 extra parameters as shown below in the example
)
```

 ##### Example

```
branch.banner({
    icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
    title: 'Branch Demo App',
    description: 'The Branch demo app!',
    openAppButtonText: 'Open',
    downloadAppButtonText: 'Download',
    data: {
        foo: 'bar'
    }
}, function(data){
    console.log(data)
});
```

**Parameters**

**data**: `Object`, **Required** Object of all link data




* * *










