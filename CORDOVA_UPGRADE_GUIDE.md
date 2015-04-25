# Upgrade Guide To The New Branch PhoneGap/Cordova SDK

In the effort of making the quickly growing functionality of our Web SDK, available to your PhoneGap or Cordova apps, we've merged the two together. This will require some very simple changes to the implementation, but you'll gain a number of very useful functions and the Branch promise of continuous updates and improvements!

### Changes to Initializing the Branck SDK

Formerly, initializing the SDK required calling to asynchronous methods:
```js
var branch = window.Branch;
// Arguments
// arg1: Your app key can be retrieved on the [Settings](https://dashboard.branch.io/#/settings) page of the dashboard
// arg2: the callback to notify you that the instance has instantiated
branch.getInstance("Your app key here", function() {

    // call init session to start a user session and check if that user has been deep linked
    // Arguments
    // arg1: Tell us if this user is eligible to be considered referred - important for referral program integrations
    // arg2: The callback that will be executed when initialization is complete. The parameters returned here will be the key/value pair associated with the link the user
    // clicked or empty if no link was clicked
    branch.initSession(true, function(params) {
        if (params) {
            console.log('Returned params: ' + JSON.stringify(params));

            // handle the deep link data
        }
    });
});
```
First note, that we have depreciated authenticating API calls with the Web SDK via the app id, and have replaced it with a Branch Key. Authenticating with the app id will still work, but it is highly recomended that you switch to using the Branch Key.
This has been simplified to an onpage embed code, and a single call to `branch.init()`, which requires the app id, and returns the launch data of the referring link:
```js
// Arguments
// arg1: Your Branch Key can be retrieved on the [Settings](https://dashboard.branch.io/#/settings) page of the dashboard
// arg2: the callback to notify you that the instance has instantiated
branch.init("BRANCH KEY", function(err, data) {
  if (err) { return console.log(err); } // Error message if init is not successful
  console.log(JSON.stringify(data)); // object containing: data from referring link, referring identity, identity of user, and boolean indicating if user has the app installed on any device
});

```

### Changes to Closing the Session

This is a very simple change from `branch.closeSession()` to `branch.close()`, with an optional callback which catches an error in closing the session.

Former method to close session:
```js
var branch = window.Branch;
branch.closeSession();
```

Upgraded method to close session:
```js
// Arguments
// arg1: the callback to notify you if there was an error

branch.close(function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

### Changes to Retrieving Install or Open Session Data

Formerly, retrieving the latest session data was made by:
```js
var branch = window.Branch;
branch.getLatestReferringParams(function(data) {
   // do something with the latest session parameters
});
```

This has been replaced with the Web SDK method, `branch.data()`:
```js
branch.data(function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(JSON.stringify(data)); // the same data object returned by branch.init
});
```

### Changes to Retrieving Install Session Data

Formerly:
```js
var branch = window.Branch;
branch.getFirstReferringParams(function(data) {
    // do something with the data associated with the first user referral
});
```

The name has been shortened, and the callback format has been modified to match the rest of the Web SDK to return an error as the first argument, and the session data as the second.
```js
branch.first(function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(JSON.stringify(data)); // the same data object returned by branch.init
});
```

### Changes to Registering Custom Events

Formerly:
```js
var branch = window.Branch;
branch.userCompletedAction("your_custom_event", null);
```

This has been replaced with the Web SDK method `branch.track()`:
```js
branch.track("your_custom_event", function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

### Changes to Generating Short Links

Formerly:
```js
// associate data with a link
// you can access this data from any instance that installs or opens the app from this link (amazing...)

var params = {;
    "user": "Joe",
    "profile_pic": "https://s3-us-west-1.amazonaws.com/myapp/joes_pic.jpg",
    "description": "Joe likes long walks on the beach..."
}

// associate a url with a set of tags, channel, feature, and stage for better analytics.
// channel: null or examples: "facebook", "twitter", "text_message", etc
// feature: null or examples: "sharing", "referral", "unlock", etc

var branch = window.Branch;
branch.getShortUrl(params, "facebook", "sharing", function(url) {
   // share the URL on Facebook
});
```

This method has been simplified by replacing it with the Web SDK method `branch.link()`. It still returns the url as the second argument to the callback:
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

### Changes to Retrieving the Reward Balance
*THIS NEEDS CLARIFICATION*

Formerly:
```js
var branch = window.Branch;
branch.loadRewards(function(changed) {
    // changed will indicate whether credits were updated
    if (changed) {
        // Pass the bucket name to retrieve the current balance of credits
        var credits = branch.getCredits("default");
    }
});
```

``js
branch.referrals(function(err, data) {
  if (err) { return console.log(err); } // Error message if not successful
  console.log(JSON.stringify(data)); // Object containing a summary of all the referrals a user has made.
});
```

### Changes to Redeeming Rewards (Now Called Credits)
Rewards we're tracked based on referring activity by the end user. We now track "credits," which can be any unit of your choice. Formerly, rewards were redeemed by:
```js
var branch = window.Branch;
branch.redeemRewards(5, "default");
```

This has now been replaced with the Web SDK method, which is nearly identical, except that it includes an optional callback:
```js
// Arguments
// arg1: Amount of credits to be redeemed
// arg2: String of bucket name to redeem credits from
// arg3: (optional) Callback to catch error
branch.redeem(5, "default", function(err) {
  if (err) { console.log(err); } // Error message if not successful
});
```

### Changes to Getting Credit History

Formerly, the credit history could be retrieved by calling:
```js
var branch = window.Branch;
branch.getCreditHistory(function(history) {

});
```

This has now been replaced with a more rubust function, which accepts filtering parameters:
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
});
```
