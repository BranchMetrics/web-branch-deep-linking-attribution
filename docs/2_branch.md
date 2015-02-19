# Global





* * *

### &#39;init&#39;(app_id, callback) 

Adding the Branch script to your page automatically creates a window.branch object with all the external methods described below. All calls made to Branch methods are stored in a queue, so even if the SDK is not fully instantiated, calls made to it will be queued in the order they were originally called.
The init function on the Branch object initiates the Branch session and creates a new user session, if it doesn't already exist, in `sessionStorage`. 
**Useful Tip**: The init fucntion returns a data object where you can read the link the user was referred by.

**Parameters**

**app_id**: `number`, **Required** Found in your Branch dashboard

**callback**: `function | null`, Callback function that returns the data

##### Usage

```
Branch.init(
    app_id,
    callback(err, data)
)
```

##### Returns

```js
{
    data:               {},      // If the user was referred from a link, and the link has associated data, the data is passed in here.
    referring_identity: '12345', // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
}
```

**Note:** `Branch.init` must be called prior to calling any other Branch functions.
___



### &#39;setIdentity&#39;(identity, callback) 

Sets the identity of a user and returns the data. To use this function, pas a unique string that identifies the user - this could be an email address, UUID, Facebook ID, etc.

**Formerly `identify()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

**Parameters**

**identity**: `string`, **Required** A string uniquely identifying the user

**callback**: `function | null`, Callback that returns the user's Branch identity id and unique link

##### Usage

```
Branch.setIdentity(
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
___



### &#39;logout&#39;(callback) 

Logs out the current session, replaces session IDs and identity IDs.

**Parameters**

**callback**: `function | null`, Returns id's of the session and user identity, and the link

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
___



### &#39;event&#39;(event, metadata, callback) 

This function allows you to track any event with supporting metadata. Use the events you track to create funnels in the Branch dashboard.
The `metadata` parameter is a formatted JSON object that can contain any data and has limitless hierarchy.

**Formerly `track()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

**Parameters**

**event**: `String`, **Required** The name of the event to be tracked

**metadata**: `Object | null`, Object of event metadata

**callback**: `function | null`, Returns an error or empty object on success

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
___



### &#39;link&#39;(metadata, callback) 

Creates and returns a deep linking URL.  The `data` parameter can include an object with optional data you would like to store, including Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).

**Formerly `createLink()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

**Parameters**

**metadata**: `Object | null`, Object of link metadata

**callback**: `function | null`, Returns a string of the Branch deep linking URL

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
    'https://bnc.lt/l/3HZMytU-BW' // Branch deep linking URL
}
```
___



### &#39;sendSMS&#39;(metadata, callback, make_new_link) 

A powerful function to give your users the ability to share links via SMS. If the user navigated to this page via a Branch link, `sendSMS` will send that same link. Otherwise, it will create a new link with the data provided in the `metadata` argument. `sendSMS` also  registers a click event with the `channel` pre-filled with `'sms'` before sending an sms to the provided `phone` parameter. This way the entire link click event is recorded starting with the user sending an sms. **Supports international SMS**.

**Parameters**

**metadata**: `Object`, **Required** Object of all link data, requires phone number as `phone`

**callback**: `function | null`, Returns an error or empty object on success

**make_new_link**: `String | true`, If true, forces the creation of a new link that will be sent, even if a link already exists

#### Usage

```
Branch.sendSMS(
    metadata,            // Metadata must include phone number as `phone`
    callback(err, data),
    make_new_link    // Deafult: false
)
```

#### Example

```
branch.sendSMS(
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

}, make_new_link);
```

___



### &quot;referrals&quot;(callback) 

Retrieves list of referrals for the current user.

**Formerly `showReferrals()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

**Parameters**

**callback**: `function | null`, Returns an error or object with referral data on success

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
___



### &quot;credits&quot;(callback) 

Retrieves a list of credits for the current user.

**Formerly `showCredits()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

**Parameters**

**callback**: `function | null`, Returns an error or object with credit data on success

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

___



### &quot;redeem&quot;(obj, callback) 

Redeem credits from a credit bucket.

**Formerly `redeemCredits()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

**Parameters**

**obj**: `Object`, **Required** Object with an `amount` (int) param of number of credits to redeem, and `bucket` (string) param of which bucket to redeem the credits from

**callback**: `function | null`, Returns an error or empty object on success

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
___



### &quot;banner&quot;(data) 

Display a smart banner directing the user to your app through a Branch referral link.  The `data` param is the exact same as in `branch.link()`.

**Formerly `appBanner()` (depreciated).**
See [CHANGELOG](CHANGELOG.md)

**Parameters**

**data**: `Object`, **Required** Object of all link data

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




* * *










