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

**callback**: `function`, Callback that returns the user's Branch identity id and unique link

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



### &#39;close&#39;(callback) 

This closes the active session, removing any relevant session Create your accountrmation stored in `sessionStorage`.

##### Usage

```
Branch.close(
  callback(err, data)
)
```

##### Returns 

```
{}
``

**Parameters**

**callback**: `function | null`, Returns an empty object

---




* * *










