'use strict';
goog.provide('appindexing');

goog.require('goog.json');// jshint unused:false
goog.require('utils');


appindexing.state = {};
appindexing.state['androidAppIndexingTagsPresent'] = false;
appindexing.state['iOSAppIndexingTagsPresent'] = false;
appindexing.state['androidDetailsComplete'] = false;
appindexing.state['iOSDetailsComplete'] = false;
appindexing.state['addediOSTagDom'] = false;
appindexing.state['addedAndroidTagDom'] = false;

appindexing.checkForAppIndexingTags = function() {
	var linkTags = document.getElementsByTagName('link');
	var numLinkTags = linkTags.length;

	for (var counter = 0; counter < numLinkTags; counter++) {
		var currLinkTag = linkTags[counter];
		var currLinkTagHref = currLinkTag.href;
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

appindexing.checkOptions = function(options) {
	if (options.hasOwnProperty('androidPackageName') && options.hasOwnProperty('androidURL') && typeof options['androidPackageName']!==undefined && typeof options['androidURL']!==undefined){
		appindexing.state['androidDetailsComplete'] = true;
		appindexing.addAppIndexingTag('android', options);
	}
	if (options.hasOwnProperty('iosAppId') && options.hasOwnProperty('iosURL') && typeof options['iosAppId']!==undefined && typeof options['iosURL']!==undefined){
		appindexing.state['iOSDetailsComplete'] = true;
		appindexing.addAppIndexingTag('iOS', options);
	}
};

appindexing.checkAppLinks = function(type, options) {
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
	appindexing.checkOptions(options);
};

appindexing.addBranchTrackingParams = function(href) {
	var branchTrackingParams = { "channel":"Firebase-App-Indexing", "$canonical_url":utils.getWindowLocation() }
	var appendQueryStringUsing = '?';
	if (href.indexOf('?') > -1) { appendQueryStringUsing = '&' };
	return href + appendQueryStringUsing + 'link_click_id=a-' + btoa(JSON.stringify(branchTrackingParams));
};

appindexing.addAppIndexingTag = function(type, options) {
	var href;
	if (type === 'android' && appindexing.state['androidDetailsComplete'] === true && appindexing.state['addedAndroidTagDom'] === false) {
		href = 'android-app://' + options['androidPackageName'] + '/' + options['androidURL'];
		href = 	appindexing.addBranchTrackingParams(href);
		appindexing.writeToDOM(href);
		appindexing.state['addedAndroidTagDom'] = true;
	} 
	if (type == 'iOS' && appindexing.state['iOSDetailsComplete'] === true && appindexing.state['addediOSTagDom'] === false) {
		href = 'ios-app://' + options['iosAppId'] + '/' + options['iosURL'];
		href = appindexing.addBranchTrackingParams(href);
		appindexing.writeToDOM(href);
		appindexing.state['addediOSTagDom'] = true;
	}
};

appindexing.writeToDOM = function(href) {
	var linkNode = document.createElement('link');
	linkNode.setAttribute('rel', 'alternate');
	linkNode.setAttribute('href', href);
	document.head.appendChild(linkNode);
};