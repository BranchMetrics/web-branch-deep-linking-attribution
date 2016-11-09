'use strict';
goog.provide('appindexing');

goog.require('goog.json');
goog.require('utils');


appindexing.state = {};
appindexing.state['androidAppIndexingTagsPresent'] = false;
appindexing.state['iOSAppIndexingTagsPresent'] = false;
appindexing.state['androidDetailsComplete'] = false;
appindexing.state['iOSDetailsComplete'] = false;
appindexing.state['addediOSTagDom'] = false;
appindexing.state['addedAndroidTagDom'] = false;

/** Scans through all 'link' tags then updates their 'href' values for those that contain 
 * "ios-app" or "android-app" to include Branch tracking parameters.
 * (Stage 1) 
 */
appindexing.updateAppIndexingTagsIfPresent = function() {
	var linkTags = document.getElementsByTagName('link');
	var numLinkTags = linkTags.length;

	if (!numLinkTags) { return; }

	for (var counter = 0; counter < numLinkTags; counter++) {

		var currLinkTag = linkTags[counter];
		var currLinkTagHref = currLinkTag.href;

		if (!currLinkTagHref) { continue; }

		if (currLinkTagHref.includes('ios-app')) {
			appindexing.state['iOSAppIndexingTagsPresent'] = true;
			currLinkTag.setAttribute('href',  appindexing.addBranchTrackingParams(currLinkTagHref));
		}
		if (currLinkTagHref.includes('android-app')) {
			appindexing.state['androidAppIndexingTagsPresent'] = true;
			currLinkTag.setAttribute('href',  appindexing.addBranchTrackingParams(currLinkTagHref));
		}
	}
};

/** Checks whether config contains appropriate per platform params. For Android, config needs to contain
  * both androidPackageName and androidURL. For iOS both, iosAppId and iosURL. Once config is correctly set for
  * iOS or Android, an App Indexing tag is built and inserted into the webpage.
  * (Stage 2)
  */
appindexing.insertAppIndexingTagsFromConfig = function(options) {
	if (options.hasOwnProperty('androidPackageName') &&
		options.hasOwnProperty('androidURL') &&
		typeof options['androidPackageName'] !== undefined &&
		typeof options['androidURL'] !== undefined) {

		appindexing.state['androidDetailsComplete'] = true;
		appindexing.addAppIndexingTag('android', options);
	}
	if (options.hasOwnProperty('iosAppId') && 
		options.hasOwnProperty('iosURL') && 
		typeof options['iosAppId'] !== undefined && 
		typeof options['iosURL'] !== undefined) {

		appindexing.state['iOSDetailsComplete'] = true;
		appindexing.addAppIndexingTag('iOS', options);
	}
};

/** If App Indexing tags do not exist and if the original config passed into autoAppIndex call does 
  * not contain appropriate data, then as a last resort, this function will try to update the config from page's App Links tags.
  * Once config is built it is validated and then if appropriate, App Indexing tags are built and inserted into the webpage.
  * (Stage 3)
 */
appindexing.populateConfigFromAppLinksTags = function(type, options) {
	var metaTags = document.getElementsByTagName('meta');

	for (var counter = 0; counter < metaTags.length; counter++) {
		if (type=='iOS' && metaTags[counter].getAttribute('property') === 'al:ios:app_store_id') {
			options['iosAppId'] = metaTags[counter].getAttribute('content');
		}
		if (type=='iOS' && metaTags[counter].getAttribute('property') === 'al:ios:url') {
			options['iosURL'] = metaTags[counter].getAttribute('content').replace('://','/');
		}
		if (type=='android' && metaTags[counter].getAttribute('property') === 'al:android:package') {
			options['androidPackageName'] = metaTags[counter].getAttribute('content');
		}
		if (type=='android' && metaTags[counter].getAttribute('property') === 'al:android:url') {
			options['androidURL'] = metaTags[counter].getAttribute('content').replace('://','/');
		}
	}
	appindexing.insertAppIndexingTagsFromConfig(options);
};

/** Updates the 'href' attribute of a 'link' element to include Branch Tracking params. */
appindexing.addBranchTrackingParams = function(href) {
	var branchTrackingParams = { "channel": "Firebase App Indexing", "feature": "Auto App Indexing", "$canonical_url": utils.getWindowLocation() }
	var appendQueryStringUsing = (href.indexOf('?') > -1) ? '&' : '?';

	return href + appendQueryStringUsing + 'link_click_id=a-' + btoa(safejson.stringify(branchTrackingParams));
};

/** Builds the 'href' attribute of the 'link' element for insertion into the webpage **/
appindexing.addAppIndexingTag = function(type, options) {
	var href;
	if (type === 'android' && 
		appindexing.state['androidDetailsComplete'] && 
		!appindexing.state['addedAndroidTagDom']) {

		href = 'android-app://' + options['androidPackageName'] + '/' + options['androidURL'];
		href = 	appindexing.addBranchTrackingParams(href);
		appindexing.writeToDOM(href);
		appindexing.state['addedAndroidTagDom'] = true;
	} 
	if (type == 'iOS' && 
		appindexing.state['iOSDetailsComplete'] && 
		!appindexing.state['addediOSTagDom']) {

		href = 'ios-app://' + options['iosAppId'] + '/' + options['iosURL'];
		href = appindexing.addBranchTrackingParams(href);
		appindexing.writeToDOM(href);
		appindexing.state['addediOSTagDom'] = true;
	}
};

/** Modifies the page's HTML to insert App Indexing tags between the <head></head> section of the webpage */
appindexing.writeToDOM = function(href) {
	var linkElement = document.createElement('link');
	linkElement.setAttribute('rel', 'alternate');
	linkElement.setAttribute('href', href);
	document.head.appendChild(linkElement);
};