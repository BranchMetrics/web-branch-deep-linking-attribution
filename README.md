# Branch Metrics Web SDK

This README outlines the functionality of the Branch Metrics Web SDK, and how to easily incorporate it into a web app.

Live demo: [http://s3-us-west-1.amazonaws.com/branch-web-sdk/example.html](http://s3-us-west-1.amazonaws.com/branch-web-sdk/example.html)

## Installation

### Requriements

This SDK requires native browser Javascript and has been tested in all modern browsers with sessionStorage capability. No 3rd party libraries are needed to make use of the SDK as is it 100% native Javascript.

### Browser Specific Support
| Chrome | Firefox | Safari |     IE     |
| ------ | ------- | ------ | ---------- |
|    X   |    X    |   X    |  9, 10, 11 |

### API Key

You will need to create a [Branch Metrics app](http://branch.io) to obtain your app_key.

### Quick Install
*Be sure to replace APP-KEY with your actual app key found in your [account dashboard](https://dashboard.branch.io/#/settings).

# TODO: Update src of actual gziped js file

```javascript
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
  + [.profile()](#profileidentity-callback)
  + [.logout()](#logout-callback)
  + [.close()](#close-callback)
  

1. [Event Tracking Methods](#event--action-methods)
  + [.event()](#track)

1. [Deeplinking Methods](#deeplinking-methods)
   + [.link()](#link)
   + [.SMSLink()](#smslink)
   + [.SMSLinkNew()](#smslinknew)
   + [.SMSLinkExisting()](#smslinkexisting)

1. [Smart Banner](#smart-banners)
   + [.banner()](#appbanner)

1. [Referral Methods](#referral-methods)
   + [.referrals()](#referrals)
   + [.credits()](#credits)
   + [.redeem()](#redeem)# Global





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










