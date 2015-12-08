# Smart App Sharing Banner

The Branch Web SDK has a built in sharing banner, that automatically displays a device specific banner for desktop, iOS, and Android. If the banner is shown on a desktop, a form for sending yourself the download link via SMS is shown.
Otherwise, a button is shown that either says an "open" app phrase, or a "download" app phrase, based on whether or not the user has the app installed. Both of these phrases can be specified in the parameters when calling the banner function.
**Styling**: The banner automatically styles itself based on if it is being shown on the desktop, iOS, or Android.

# Customizing the App Sharing Banner

The app sharing banner includes a number of ways to easily customize it by specifying properties in the `options` object, which is the first argument of the banner.

### Your App's Information _required_
You can set the icon, title, and description for your app with the properties: `icon`, `title`, and `description`. For example, an app banner with these three properties set:
```js
branch.banner(
 {
      icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
      title: 'Branch Demo App',
      description: 'The Branch demo app!'
 },
 {... link data ...}
);
```
### The Call To Action Text _optional_
On mobile devices, the app banner show's an option either to download the app if they do not have it installed, or open the app if they have already installed it. Both of these can be customized from their respective defaults of Download app, and View in app.
When the banner is opened on a desktop devide, a simpel form is shown that allows the user to txt themselves a link to the app. Both the placeholder phone number, and the text in the button can be customzied from their respective defaults of '(999) 999-9999' and 'Send Link'.
```js
branch.banner(
 {
      // required app info properties
      icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
      title: 'Branch Demo App',
      description: 'The Branch demo app!',
      // Call to action customization
      openAppButtonText: 'Open',
      downloadAppButtonText: 'Install',
      phonePreviewText: '+44 9999-9999',
      sendLinkText: 'Txt me!'
 },
 {... link data ...}
);
```
### Enabled Platforms _optional_
The app banner detects the platform environment as either, desktop, iOS, or Android, and is enabled on all 3 by default. You can easily customize which platforms see the app banner as follows:
```js
branch.banner(
 {
      // required app info properties
      icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
      title: 'Branch Demo App',
      description: 'The Branch demo app!',
      // Platforms customization
      showDesktop: false,
      showiOS: true,
      showAndroid: true,
      showBlackberry: true,
      showWindowsPhone: true,
      showKindle: true
 },
 {... link data ...}
);
```
*
### Display Preferences _optional_
By default, the app banner displays inside of an iFrame (isolates the app banner css from your page), at the top of the page, shows a close button to the user, and will never show again once closed by the user. All of this functionality can be customized.
The `iframe` property defaults to true, and can be set to false if you wish for the banner HTML to display within your page. This allows you to customize the CSS of the banner, past what the Web SDK allows.
The `disableHide` property defaults to false, and when set to true, removes the close button on the banner.
The `forgetHide` property defaults to false, and when set to true, will forget if the user has opened the banner previously, and thus will always show the banner to them even if they have closed it in the past. It can also be set to an integer, in which case, it would forget that the user has previously hid the banner after X days.
The `position` property, defaults to 'top', but can also be set to 'bottom' if you would prefer to show the app banner from the bottom of the screen.
The `customCSS` property allows you to style the banner, even if it is isolated within an iframe. To assist you with device specific styles, the body element of the banner has one of three classes: `branch-banner-android`, `branch-banner-ios`, or `branch-banner-desktop`.
The `mobileSticky` property defaults to false, but can be set to true if you want the user to continue to see the app banner as they scroll.
The `desktopSticky` property defaults to true, but can be set to false if you want the user to only see the app banner when they are scrolled to the top of the page.
```js
branch.banner(
 {
      // required app info properties
      icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
      title: 'Branch Demo App',
      description: 'The Branch demo app!',
      // Display preferences
      iframe: false,
      disableHide: true,
      forgetHide: true, // Can also be set to an integer. For example: 10, would forget that the user previously hid the banner after 10 days
      position: 'bottom',
      mobileSticky: true,
      desktopSticky: true,
      customCSS: '.title { color: #F00; }'
 },
 {... link data ...}
);
```
*
### Link Preferences _optional_
By default, tthe app banner will reusue a link that has most recently been created. If this is not desired, and you wish an enitrley new link to be created and overwrite the previous link, you can set `make_new_link` to true.
```js
branch.banner(
 {
      // required app info properties
      icon: 'http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png',
      title: 'Branch Demo App',
      description: 'The Branch demo app!',
      // Link preferences
      make_new_link: true
 },
 {... link data ...}
);
```
*
### Playing nicely with other positon fixed "sticky" banners
Do you already have a "sticky" element on the top of your website, such as a navigation bar? If so, the Branch app banner will likely interfere with it. Fortunatley, we have a solution!
Without any configuration, the Web SDK adds a class called `branch-banner-is-active` to the body element of your website when the banner opens, and removes it when the banner closes.
As an example, let's say you had an element on your website with a class of `header` that was `position: fixed;`. You could then add the following to your stylesheet:
```css
body.branch-banner-is-active .header { top: 76px; }
```
This will add exactly the space required to show the app banner above your navigation header!
