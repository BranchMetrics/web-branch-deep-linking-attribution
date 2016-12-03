'use strict';
goog.provide('appindexing');

goog.require('safejson');
goog.require('utils');


appindexing.state = {};
appindexing.state['androidAppIndexingTagsPresent'] = false;
appindexing.state['iosAppIndexingTagsPresent'] = false;
appindexing.state['androidDetailsComplete'] = false;
appindexing.state['iosDetailsComplete'] = false;

appindexing.options = {};


/** Builds the 'href' attribute of the 'link' element for insertion into the webpage **/
function addAppIndexingTag(type) {
	var href;
	if (type === 'android' && appindexing.state['androidDetailsComplete']) {
		href = 'android-app://' + appindexing.options['androidPackageName'] + '/' + appindexing.options['androidURL'];
		href = 	addBranchTrackingParams(href);
		writeToDOM(href);
	} 
	if (type === 'ios' && appindexing.state['iosDetailsComplete']) {
		href = 'ios-app://' + appindexing.options['iosAppId'] + '/' + appindexing.options['iosURL'];
		href = addBranchTrackingParams(href);
		writeToDOM(href);
	}
};

/** Updates the 'href' attribute of a 'link' element to include Branch Tracking params. */
function addBranchTrackingParams(href) {

	var branchTrackingParams = { "~channel": "Firebase App Indexing", "~feature": "Auto App Indexing", "$canonical_url": utils.getWindowLocation() }
	
	if (typeof appindexing.options['data'] === 'object') {
		for (var key in appindexing.options['data']) {
			if (appindexing.options['data'].hasOwnProperty(key) && 
				!branchTrackingParams.hasOwnProperty(key)) {

				branchTrackingParams[key] = appindexing.options['data'][key];
			}
		}
	}

	var appendQueryStringUsing = (href.indexOf('?') > -1) ? '&' : '?';

	return href + appendQueryStringUsing + 'link_click_id=a-' + btoa(safejson.stringify(branchTrackingParams));
};

/** Modifies the page's HTML to insert App Indexing tags between the <head></head> section of the webpage */
function writeToDOM(href) {
	var linkElement = document.createElement('link');
	linkElement.setAttribute('rel', 'alternate');
	linkElement.setAttribute('href', href);
	document.head.appendChild(linkElement);
};

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
			appindexing.state['iosAppIndexingTagsPresent'] = true;
			currLinkTag.setAttribute('href',  addBranchTrackingParams(currLinkTagHref));
		}
		if (currLinkTagHref.includes('android-app')) {
			appindexing.state['androidAppIndexingTagsPresent'] = true;
			currLinkTag.setAttribute('href',  addBranchTrackingParams(currLinkTagHref));
		}
	}
};

/** Checks whether config contains appropriate per platform params. For Android, config needs to contain
  * both androidPackageName and androidURL. For ios both, iosAppId and iosURL. Once config is correctly set for
  * ios or Android, an App Indexing tag is built and inserted into the webpage.
  * (Stage 2)
  */
appindexing.insertAppIndexingTagsFromConfig = function(type) {

	if (type === 'android' && 
		typeof appindexing.options['androidPackageName'] === 'string' &&
		typeof appindexing.options['androidURL'] === 'string' ) {
		appindexing.state['androidDetailsComplete'] = true;
		addAppIndexingTag('android');
	}
	
	if (type === 'ios' && 
		typeof appindexing.options['iosAppId'] === 'string' &&
		typeof appindexing.options['iosURL'] === 'string' ) {
		appindexing.state['iosDetailsComplete'] = true;
		addAppIndexingTag('ios');
	}
};

/** If App Indexing tags do not exist and if the original config passed into autoAppIndex call does 
  * not contain appropriate data, then as a last resort, this function will try to update the config from page's App Links tags.
  * Once config is built it is validated and then if appropriate, App Indexing tags are built and inserted into the webpage.
  * (Stage 3)
 */
appindexing.populateConfigFromAppLinksTags = function(type) {
	var metaTags = document.getElementsByTagName('meta');

	for (var counter = 0; counter < metaTags.length; counter++) {

		var currMetaTag = metaTags[counter];

		if (type === 'ios' && currMetaTag.getAttribute('property') === 'al:ios:app_store_id') {
			appindexing.options['iosAppId'] = currMetaTag.getAttribute('content');
		}
		if (type === 'ios' && currMetaTag.getAttribute('property') === 'al:ios:url') {
			appindexing.options['iosURL'] = currMetaTag.getAttribute('content').replace('://','/');
		}
		if (type === 'android' && currMetaTag.getAttribute('property') === 'al:android:package') {
			appindexing.options['androidPackageName'] = currMetaTag.getAttribute('content');
		}
		if (type === 'android' && currMetaTag.getAttribute('property') === 'al:android:url') {
			appindexing.options['androidURL'] = currMetaTag.getAttribute('content').replace('://','/');
		}
	}
	appindexing.insertAppIndexingTagsFromConfig(type);
};