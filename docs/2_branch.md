# Global





* * *

### &#39;init&#39;(app_id, callback) 

Adding the Branch script to your page, automatically creates a window.branch object with all of the external methods described below. All calls made to Branch methods are stored in a queue, so even if the SDK is not fully insantiated, calls made to it will be queed in the order they were originally called. The init function on the Branch object initiates the Branch session and creates a new user session if it doesn't already exist in `sessionStorage`.

##### Usage

```
Branch.init(
  callback (function, optional)
)
```

##### Returns

```js
{
  session_id:         '12345', // Server-generated ID of the session that is stored in `sessionStorage`
  identity_id:        '12345', // Server-generated ID of the user identity that is stored in `sessionStorage`
  device_fingerprint: 'abcde', // Server-generated ID of the device fingerprint that is stored in `sessionStorage`
  data:               {},      // If the user was referred from a link, and the link has associated data, the data is passed in here.
  link:               'url',   // Server-generated link identity, for synchronous link creation.
  referring_identity: '12345', // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
}
```

**Parameters**

**app_id**: `number`, **Required** Found in your Branch dashboard

**callback**: `function | null`, Callback function that reeturns as callback(err, data)

**Note:** `Branch.init` is called every time the constructor is loaded.  This is to properly set the session environment, allowing controlled access to the other SDK methods.

---



### &#39;logout&#39;(callback) 

Logs out the current session, replaces session IDs and identity IDs.

##### Usage

```
Branch.logout(
  callback (function, optional)
)
```

##### Returns 

```js
{
 session_id:  '12345', // Server-generated ID of the session that is stored in `sessionStorage`
 identity_id: '12345', // Server-generated ID of the user identity that is stored in `sessionStorage`
 link:        'url',   // Server-generated link identity, for synchronous link creation that is stored in `sessionStorage`
}
```

**Parameters**

**callback**: `function | null`, ---




* * *










