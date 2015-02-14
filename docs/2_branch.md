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

**Parameters**

**app_id**: `number`, **Required** Found in your Branch dashboard

**callback**: `function | null`, Callback function that reeturns as callback(err, data)

---



### &#39;logout&#39;(callback) 

**Parameters**

**callback**: `function | null`



### &#39;close&#39;(callback) 

**Parameters**

**callback**: `function | null`



### &#39;event&#39;(event, metadata, callback) 

**Parameters**

**event**: `String`

**metadata**: `Object`

**callback**: `function`



### &#39;profile&#39;(identity, callback) 

Sets the profile of a user and returns the data.

**Parameters**

**identity**: `string`, Sets the profile of a user and returns the data.

**callback**: `function`, Sets the profile of a user and returns the data.



### &#39;link&#39;(metadata, callback) 

Createa and returns a deep linking URL.  The `data` parameter can include Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).

**Parameters**

**metadata**: `Object`, Createa and returns a deep linking URL.  The `data` parameter can include Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).

**callback**: `function`, Createa and returns a deep linking URL.  The `data` parameter can include Facebook [Open Graph data](https://developers.facebook.com/docs/opengraph).



### &#39;SMSLink&#39;(metadata, callback) 

**Parameters**

**metadata**: `Object`

**callback**: `function`



### &#39;SMSLinkNew&#39;(metadata, callback) 

**Parameters**

**metadata**: `Object`

**callback**: `function`



### &#39;SMSLinkExisting&#39;(phone, callback) 

**Parameters**

**phone**: `String`

**callback**: `function`



### &quot;referrals&quot;(callback) 

**Parameters**

**callback**: `function`



### &quot;credits&quot;(callback) 

**Parameters**

**callback**: `function`



### &quot;redeem&quot;(obj, callback) 

**Parameters**

**obj**: `Object`

**callback**: `function`



### &quot;banner&quot;(obj) 

**Parameters**

**obj**: `Object`




* * *










