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
  + [.logout()](#logoutcallback)
  + [.close()](#closecallback)

1. Event Tracking Methods
  + [.event()](#track)

1. Deeplinking Methods
   + [.link()](#link)
   + [.SMSLink()](#smslink)
   + [.SMSLinkNew()](#smslinknew)
   + [.SMSLinkExisting()](#smslinkexisting)

1. Smart Banner
   + [.banner()](#appbanner)

1. Referral Methods
   + [.referrals()](#referrals)
   + [.credits()](#credits)
   + [.redeem()](#redeem)