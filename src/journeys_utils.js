'use strict';
goog.provide('journeys_utils');

goog.require('banner_utils');
goog.require('journeys_analytics');
goog.require('journeys_dismissals');
goog.require('journeys_events');
goog.require('journeys_frame');
goog.require('journeys_link_overrides');
goog.require('journeys_template');
goog.require('journeys_a11y');
goog.require('safejson');
goog.require('utils');

journeys_utils._callback_index = 1;

function setDefaultBannerProperties() {
  // defaults. These will change based on banner info
  journeys_utils.position = 'top';
  journeys_utils.sticky = 'absolute';
  journeys_utils.bannerHeight = '76px';
  journeys_utils.isFullPage = false;
  journeys_utils.isHalfPage = false;
}

setDefaultBannerProperties();

journeys_utils.divToInjectParents = [];
journeys_utils.isSafeAreaEnabled = false;

// used to set height of full page interstitials
journeys_utils.windowHeight = window.innerHeight;
journeys_utils.windowWidth = window.innerWidth;
// if the device is landscape
if (window.innerHeight < window.innerWidth) {
  journeys_utils.windowHeight = window.innerWidth;
  journeys_utils.windowWidth = window.innerHeight;
}

// calculated later to determine how far to push down body content
journeys_utils.bodyMarginTop = 0;
journeys_utils.bodyMarginBottom = 0;

// Running state of the exit animation
journeys_utils.exitAnimationIsRunning = false;

// Regex to find pieces of the html blob (contract regexes live in journeys_template; the spacer
// ones below are legacy-only, for templates that predate the metadata block)
journeys_utils.jsonRe = journeys_template.jsonRe;
journeys_utils.jsRe = journeys_template.jsRe;
journeys_utils.cssRe = journeys_template.cssRe;
journeys_utils.iframeCssRe = journeys_template.iframeCssRe;
journeys_utils.spacerRe = /#branch-banner-spacer {((.|\s)*?)}/;
journeys_utils.findMarginRe = /margin-bottom: (.*?);/;

journeys_utils.branch = null;
journeys_utils.banner = null;
journeys_utils.isJourneyDisplayed = false;

journeys_utils.animationSpeed = 250;
journeys_utils.animationDelay = 20;

// options to control a Journey's animations
journeys_utils.exitAnimationDisabled = false;
journeys_utils.entryAnimationDisabled = false;

// set to true when user taps on Journey's close icon, continue button or CTA
journeys_utils.journeyDismissed = false;

// properties used to determine the removal of additional whitespace above Journey if position changes from 'top' to 'bottom'
journeys_utils.exitAnimationDisabledPreviously = false;
journeys_utils.previousPosition = '';
journeys_utils.previousDivToInjectParents = [];

// holds data from Journey that is currently being viewed & data from setBranchViewData()
journeys_utils.journeyLinkData = null;

/***
 * @function journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight
 * @param {string} bannerHeight
 */
journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight = function (
  bannerHeight,
) {
  var unitsRegex = /vh|%/gi; // search and replace vh, %
  return unitsRegex.test(bannerHeight)
    ? bannerHeight.replace(unitsRegex, '')
    : false;
};

/***
 * @function journeys_utils.setPositionAndHeight
 * @param {string} html
 *
 * Uses template metadata to set bannerHeight, position, and sticky properties
 * To support old banners, searches the html blob to determine these properties
 * For full page banners, gets view width/height to set fixed pixel values
 */
journeys_utils.setPositionAndHeight = function (html) {
  setDefaultBannerProperties();
  var metadata = journeys_utils.getMetadata(html) || {};
  if (
    metadata &&
    metadata['bannerHeight'] &&
    metadata['position'] &&
    metadata['sticky']
  ) {
    journeys_utils.bannerHeight = metadata['bannerHeight'];
    journeys_utils.position = metadata['position'];
    journeys_utils.sticky = metadata['sticky'];
  } else {
    // to support older banners without proper metadata. Spacer div === top
    var spacerMatch = html.match(journeys_utils.spacerRe);
    if (spacerMatch) {
      journeys_utils.position = 'top';
      var heightMatch = spacerMatch[1].match(journeys_utils.findMarginRe);
      if (heightMatch) {
        journeys_utils.bannerHeight = heightMatch[1];
      }
      journeys_utils.sticky = 'absolute';
    } else {
      journeys_utils.position = 'bottom';
      journeys_utils.sticky = 'fixed';
    }
  }
  var relativeBannerHeightOrFalse =
    journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
      journeys_utils.bannerHeight,
    );
  if (relativeBannerHeightOrFalse) {
    var bannerHeightInPixels =
      (relativeBannerHeightOrFalse / 100) * journeys_utils.windowHeight + 'px';
    journeys_utils.bannerHeight = bannerHeightInPixels;
    if (relativeBannerHeightOrFalse < 100) {
      journeys_utils.isHalfPage = true;
    } else {
      journeys_utils.isFullPage = true;
    }
  }
};

// html-blob extraction delegates to journeys_template (shared with journeys_v2)
journeys_utils.getMetadata = journeys_template.getMetadata;
journeys_utils.getIframeCss = journeys_template.getIframeCss;
journeys_utils.getCtaText = journeys_template.getCtaText;
journeys_utils.getCss = journeys_template.getCss;
journeys_utils.removeScriptAndCss = journeys_template.removeScriptAndCss;

/***
 * @function journeys_utils.findInsertionDiv
 * @param {Object} parent - A dom element or document.body
 * @param {Object} metadata
 */
journeys_utils.findInsertionDiv = function (parent, metadata) {
  journeys_utils.divToInjectParents = [];

  if (metadata && metadata['injectorSelector']) {
    var injectors = document.querySelectorAll(metadata['injectorSelector']);
    if (injectors) {
      for (var i = 0; i < injectors.length; i++) {
        journeys_utils.divToInjectParents.push(injectors[i].parentElement);
      }
    }
  }
};

/***
 * @function journeys_utils.getJsAndAddToParent
 * @param {string} html
 *
 * take the js from template and add to document.body
 */
journeys_utils.getJsAndAddToParent = function (html) {
  var src = journeys_template.getJs(html);
  if (src !== undefined) {
    var script = document.createElement('script');
    script.id = 'branch-journey-cta';
    utils.addNonceAttribute(script);
    script.innerHTML = src;
    document.body.appendChild(script);
  }
};

// iframe shell construction delegates to journeys_frame (shared with journeys_v2)
journeys_utils.createIframe = journeys_frame.createIframe;

// Mounts the creative and installs the WCAG keyboard-nav script if the creative requests it.
journeys_utils.addHtmlToIframe = function (iframe, html, platform) {
  var doc = journeys_frame.mount(iframe, html, platform);
  journeys_a11y.install(doc);
  return doc;
};

/***
 * @function journeys_utils.addIframeOuterCSS
 *
 * Creates a style element on document.body and adds CSS that will determine
 * banner position, height and sticky.
 */
journeys_utils.addIframeOuterCSS = function (cssIframeContainer, metadata) {
  var bodyMargin = '';
  journeys_utils.bodyMarginTop = banner_utils.getBodyStyle('margin-top');
  var bodyMarginTopNumber = +journeys_utils.bodyMarginTop.slice(0, -2);
  journeys_utils.bodyMarginBottom = banner_utils.getBodyStyle('margin-bottom');
  var bodyMarginBottomNumber = +journeys_utils.bodyMarginBottom.slice(0, -2);
  var bannerMarginNumber = +journeys_utils.bannerHeight.slice(0, -2);

  if (cssIframeContainer) {
  } else if (journeys_utils.position === 'top') {
    var calculatedBodyMargin = +bannerMarginNumber + bodyMarginTopNumber;
    document.body.style.marginTop = calculatedBodyMargin.toString() + 'px';
  } else if (journeys_utils.position === 'bottom') {
    var calculatedBodyMargin = +bannerMarginNumber + bodyMarginBottomNumber;
    document.body.style.marginBottom = calculatedBodyMargin.toString() + 'px';
  }

  // adds margin to the parent of div being inserted into
  if (journeys_utils.divToInjectParents.length > 0) {
    // dont want to add margin for full page fixed
    journeys_utils.divToInjectParents.forEach(function (parent) {
      var isFixedNavFullPage;
      var computedParentStyle = window.getComputedStyle(parent);
      if (computedParentStyle) {
        isFixedNavFullPage =
          journeys_utils.isFullPage &&
          computedParentStyle.getPropertyValue('position') === 'fixed';
      }
      if (!isFixedNavFullPage) {
        parent.style.marginTop = journeys_utils.bannerHeight;
      }
    });
  }

  // determines the removal of additional whitespace above Journey if position changes from 'top' to 'bottom'
  if (
    journeys_utils.previousPosition === 'top' &&
    journeys_utils.previousPosition !== journeys_utils.position &&
    journeys_utils.exitAnimationDisabledPreviously &&
    journeys_utils.previousDivToInjectParents &&
    journeys_utils.previousDivToInjectParents.length > 0
  ) {
    journeys_utils.previousDivToInjectParents.forEach(function (parent) {
      parent.style.marginTop = 0;
    });
  }

  // resets properties to related to the case above
  // note: these properties are set in journeys_utils.animateBannerExit()
  journeys_utils.exitAnimationDisabledPreviously = false;
  journeys_utils.previousPosition = '';
  journeys_utils.previousDivToInjectParents = [];

  journeys_utils.journeyDismissed = false;

  var css = cssIframeContainer
    ? cssIframeContainer
    : generateIframeOuterCSS(metadata);
  document.head.appendChild(
    journeys_frame.styleElement(document, 'branch-iframe-css', css),
  );
};

function generateIframeOuterCSS(metadata) {
  var bodyWebkitTransitionStyle = '';
  var iFrameAnimationStyle = '';

  // Resets previous transition styles
  document.body.style.transition = '';
  if (document.getElementById('branch-banner-iframe')) {
    document.getElementById('branch-banner-iframe').style.transition = '';
  }

  // If entry animation is not disabled, then animate Journey entry
  if (!journeys_utils.entryAnimationDisabled) {
    bodyWebkitTransitionStyle =
      'body { -webkit-transition: all ' +
      journeys_utils.animationSpeed / 1000 +
      's ease; }\n';
    document.body.style.transition =
      'all 0' + journeys_utils.animationSpeed / 1000 + 's ease';
    iFrameAnimationStyle =
      '-webkit-transition: all ' +
      journeys_utils.animationSpeed / 1000 +
      's ease; ' +
      'transition: all 0' +
      journeys_utils.animationSpeed / 1000 +
      's ease;';
  }

  var css = '';
  css += bodyWebkitTransitionStyle || '';
  if (journeys_utils.isDesktopJourney) {
    var bannerHeight = journeys_utils.bannerHeight;
    var bannerWidth = journeys_utils.bannerWidth;
    var sticky = journeys_utils.sticky;
    if (journeys_utils.journeyVariant === 'overlay') {
      bannerHeight = '100%!important';
      bannerWidth = '100%!important';
      sticky = 'fixed';
    }
    // add iframe container styles
    css +=
      '#branch-banner-iframe-embed { z-index: 99999!important; height: ' +
      bannerHeight +
      '; width: ' +
      bannerWidth +
      '; padding: 0px!important; margin: 0px!important; ' +
      '; position: ' +
      sticky +
      '; }\n';
    css +=
      '#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width: 100%; left: 0; right: 0; border: 0; height: 100%!important; width: 100%!important; ' +
      iFrameAnimationStyle +
      '; position: ' +
      sticky +
      '; }\n';
  } else {
    css +=
      '#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%;' +
      ' left: 0; right: 0; border: 0; height: ' +
      journeys_utils.bannerHeight +
      '; z-index: 99999; ' +
      iFrameAnimationStyle +
      ' }\n' +
      '#branch-banner-iframe { position: ' +
      journeys_utils.sticky +
      '; }\n' +
      '@media only screen and (orientation: landscape) { ' +
      'body { ' +
      (journeys_utils.position === 'top' ? 'margin-top: ' : 'margin-bottom: ') +
      (journeys_utils.isFullPage
        ? journeys_utils.windowWidth + 'px'
        : journeys_utils.bannerHeight) +
      '; }\n' +
      '#branch-banner-iframe { height: ' +
      (journeys_utils.isFullPage
        ? journeys_utils.windowWidth + 'px'
        : journeys_utils.bannerHeight) +
      '; }';
  }

  return css;
}

/***
 * @function journeys_utils.addIframeInnerCSS
 * @param {Object} iframe - iframe node
 * @param {string} innerCSS
 *
 * Adds css that was stripped from html blob to the iframe element
 */
journeys_utils.addIframeInnerCSS = function (iframe, innerCSS) {
  var css = document.createElement('style');
  css.type = 'text/css';
  css.id = 'branch-css';
  css.innerHTML = innerCSS;

  utils.addNonceAttribute(css);

  var doc = iframe.contentWindow.document;
  doc.head.appendChild(css);

  var isDesktopOverlay =
    journeys_utils.isDesktopJourney &&
    journeys_utils.journeyVariant === 'overlay';

  // if banner is partial height with relative units, we need to make sure
  // it fills the entire height of the iframe
  if (
    (journeys_utils.isHalfPage || journeys_utils.isFullPage) &&
    !isDesktopOverlay
  ) {
    var dismissBackground = doc.getElementsByClassName(
      'branch-banner-dismiss-background',
    )[0];
    var content = doc.getElementsByClassName('branch-banner-content')[0];
    if (!dismissBackground && content) {
      content.style.height = journeys_utils.bannerHeight;
    }
  }

  if (journeys_utils.position === 'top') {
    iframe.style.top = '-' + journeys_utils.bannerHeight;
  } else if (journeys_utils.position === 'bottom') {
    iframe.style.bottom = '-' + journeys_utils.bannerHeight;
  }

  // remove box shadow if no content background color
  // this is to allow floating button to work
  try {
    // get computed background-color of .branch-banner-content
    var content = doc.getElementsByClassName('branch-banner-content')[0];
    var contentComputedStyle = window.getComputedStyle(content);
    var bg = contentComputedStyle.getPropertyValue('background-color');
    var arr = bg.split(', ');
    // if the alpha === 0, remove the box shadow
    if (arr[3] && parseFloat(arr[3]) === 0) {
      iframe.style.boxShadow = 'none';
    }
  } catch (err) {}
};

/***
 * @function journeys_utils.addDynamicCtaText
 * @param {Object} iframe
 * @param {string} ctaText
 */
journeys_utils.addDynamicCtaText = function (iframe, ctaText) {
  var doc = iframe.contentWindow.document;
  if (doc && doc.getElementById('branch-mobile-action')) {
    var mobileAction = doc.getElementById('branch-mobile-action');
    mobileAction.innerHTML = ctaText;
    mobileAction.setAttribute('aria-label', ctaText);
  }
};

/***
 * @function journeys_utils.centerOverlay
 * @param {Object} banner
 */
journeys_utils.centerOverlay = function (banner) {
  if (banner && banner.style) {
    banner.style.bottom = '140px';
    banner.style.width = '94%';
    banner.style.borderRadius = '20px';
    banner.style.margin = 'auto';
  }
};

/***
 * @function journeys_utils.animateBannerEntrance
 * @param {Object} banner
 */
journeys_utils.animateBannerEntrance = function (banner, cssIframeContainer) {
  banner_utils.addClass(document.body, 'branch-banner-is-active');
  if (journeys_utils.isFullPage && journeys_utils.sticky === 'fixed') {
    document.head.appendChild(
      journeys_frame.styleElement(
        document,
        undefined,
        '.branch-banner-no-scroll {overflow: hidden;}',
      ),
    );
    banner_utils.addClass(document.body, 'branch-banner-no-scroll');
  }

  function onAnimationEnd() {
    if (cssIframeContainer) {
      banner.style.top = null;
      banner.style.bottom = null;
    } else {
      if (journeys_utils.position === 'top') {
        banner.style.top = '0';
      } else if (journeys_utils.position === 'bottom') {
        // check if safeAreaRequired is true or not
        if (
          journeys_utils.journeyLinkData &&
          journeys_utils.journeyLinkData['journey_link_data'] &&
          !journeys_utils.journeyLinkData['journey_link_data'][
            'safeAreaRequired'
          ]
        ) {
          banner.style.bottom = '0';
        } else {
          journeys_utils._dynamicallyRepositionBanner();
        }
      }
    }
    journeys_events.publish(
      journeys_utils.branch,
      'didShowJourney',
      journeys_utils.journeyLinkData,
    );
    journeys_utils.isJourneyDisplayed = true;
  }
  setTimeout(onAnimationEnd, journeys_utils.animationDelay);
};

journeys_utils._resizeListener = function () {
  if (journeys_utils.isSafeAreaEnabled) {
    journeys_utils._resetJourneysBannerPosition(false, false);
  }
};

journeys_utils._scrollListener = function () {
  if (journeys_utils.isSafeAreaEnabled) {
    if (window.pageYOffset > window.innerHeight) {
      journeys_utils._resetJourneysBannerPosition(true, false);
    } else {
      journeys_utils._resetJourneysBannerPosition(false, false);
    }
  }
};

journeys_utils._dynamicallyRepositionBanner = function () {
  journeys_utils.isSafeAreaEnabled = true;
  // disable Journey animation to avoid lag when repositioning the banner
  document.getElementById('branch-banner-iframe').style.transition = 'all 0s';
  // make sure on the first journey load the position is correct
  journeys_utils._resetJourneysBannerPosition(false, true);
  // resize listener for Safari in-app webview resize due to bottom/top nav bar
  window.addEventListener('resize', journeys_utils._resizeListener);
  // scroll listener for bottom overscrolling edge case
  window.addEventListener('scroll', journeys_utils._scrollListener);
};

journeys_utils._resetJourneysBannerPosition = function (
  isPageBottomOverScrolling,
  checkIfPageAlreadyScrollingOnFirstLoad,
) {
  var bannerIFrame = document.getElementById('branch-banner-iframe');
  var bannerHeight = bannerIFrame.offsetHeight;
  var bannerTopDistance = bannerIFrame.offsetTop;
  var windowHeight = window.innerHeight;

  // on first load check if the page is already scrolling
  if (checkIfPageAlreadyScrollingOnFirstLoad) {
    if (window.pageYOffset !== 0) {
      bannerIFrame.style.bottom = '0';
      return false;
    }
  }

  if (!isPageBottomOverScrolling) {
    // always keep banner top location equal to the height specified
    if (windowHeight - bannerTopDistance != bannerHeight) {
      bannerIFrame.style.top = '' + (windowHeight - bannerHeight) + 'px';
    }
  } else {
    // bottom overscrolling is usually equivalent to half the banner size
    bannerIFrame.style.top =
      windowHeight - bannerHeight + bannerHeight / 2 + 'px';
  }
};

// Dismissal storage delegates to journeys_dismissals (shared with journeys_v2)
journeys_utils._findGlobalDismissPeriod =
  journeys_dismissals.globalDismissDeadline;
journeys_utils._setJourneyDismiss = journeys_dismissals.recordViewDismiss;

/***
 * @function journeys_utils.finalHookups
 * @param {string} templateId
 * @param {string} audienceRuleId
 * @param {Object} storage
 * @param {function()} cta
 * @param {Object} banner
 *
 * hooks up the call to action and dismiss buttons
 */
journeys_utils.finalHookups = function (
  templateId,
  audienceRuleId,
  storage,
  cta,
  banner,
  metadata,
  testModeEnabled,
  branch_view,
) {
  if (!cta || !banner) {
    return;
  }

  var doc = banner.contentWindow.document;

  var actionEls = doc.querySelectorAll('#branch-mobile-action');
  Array.prototype.forEach.call(actionEls, function (el) {
    el.addEventListener('click', function (e) {
      journeys_events.publish(
        journeys_utils.branch,
        'didClickJourneyCTA',
        journeys_utils.journeyLinkData,
      );
      journeys_utils.journeyDismissed = true;
      cta();
      journeys_utils.animateBannerExit(banner);
    });
  });
  journeys_utils._setupDismissBehavior(
    '.branch-banner-continue',
    'didClickJourneyContinue',
    storage,
    banner,
    templateId,
    audienceRuleId,
    metadata,
    testModeEnabled,
    branch_view,
    'click',
  );
  journeys_utils._setupDismissBehavior(
    '.branch-banner-close',
    'didClickJourneyClose',
    storage,
    banner,
    templateId,
    audienceRuleId,
    metadata,
    testModeEnabled,
    branch_view,
    'click',
  );
  journeys_utils._setupDismissBehavior(
    '.branch-banner-dismiss-background',
    'didClickJourneyBackgroundDismiss',
    storage,
    banner,
    templateId,
    audienceRuleId,
    metadata,
    testModeEnabled,
    branch_view,
    'click',
  );
  journeys_utils._setupDismissBehavior(
    '.branch-banner-dismiss-background',
    'didScrollJourneyBackgroundDismiss',
    storage,
    banner,
    templateId,
    audienceRuleId,
    metadata,
    testModeEnabled,
    branch_view,
    'touchmove',
  );
};

/**
 * @function journeys_utils._setupDismissBehavior
 * @param  {string} cssSelector
 * @param  {string} eventName
 * @param  {Object} storage
 * @param  {Object} banner
 * @param  {string} templateId
 * @param  {Object} metadata
 * @param  {boolean} testModeEnabled
 *
 * Attach callbacks for dismiss elements on journey
 */
journeys_utils._setupDismissBehavior = function (
  cssSelector,
  eventName,
  storage,
  banner,
  templateId,
  audienceRuleId,
  metadata,
  testModeEnabled,
  branch_view,
  eventType,
) {
  var doc = banner.contentWindow.document;
  var cancelEls = doc.querySelectorAll(cssSelector);
  Array.prototype.forEach.call(cancelEls, function (el) {
    el.addEventListener(eventType, function (e) {
      journeys_utils._handleJourneyDismiss(
        eventName,
        storage,
        banner,
        templateId,
        audienceRuleId,
        metadata,
        testModeEnabled,
        branch_view,
      );
    });
  });
};

journeys_utils._getDismissRequestData = function (
  branch_view,
  dismissal_source,
) {
  return journeys_analytics.getDismissRequestData(
    branch_view,
    dismissal_source,
    journeys_utils.journeyLinkData,
    journeys_utils.branch,
  );
};

journeys_utils._handleJourneyDismiss = function (
  eventName,
  storage,
  banner,
  templateId,
  audienceRuleId,
  metadata,
  testModeEnabled,
  branch_view,
) {
  var globalDismissPeriod = !testModeEnabled
    ? journeys_utils._findGlobalDismissPeriod(metadata)
    : 0;
  journeys_events.publish(
    journeys_utils.branch,
    eventName,
    journeys_utils.journeyLinkData,
  );
  journeys_utils.journeyDismissed = true;
  journeys_utils.animateBannerExit(banner);

  if (!testModeEnabled) {
    journeys_dismissals.recordGlobalDismiss(storage, globalDismissPeriod);
    journeys_dismissals.recordViewDismiss(storage, templateId, audienceRuleId);
    var listener = function () {
      journeys_utils.branch.removeListener(listener);
      var requestData = journeys_utils._getDismissRequestData(
        branch_view,
        utils.dismissEventToSourceMapping[eventName],
      );
      journeys_utils.branch._api(
        resources.dismiss,
        requestData,
        function (err, data) {
          if (!err && metadata && metadata['dismissRedirect']) {
            window.location = metadata['dismissRedirect'];
          } else if (!err && typeof data === 'object' && data['template']) {
            if (branch_view.shouldDisplayJourney(data, null, false)) {
              branch_view.displayJourney(
                data['template'],
                requestData,
                requestData['branch_view_id'] ||
                  data['event_data']['branch_view_data']['id'],
                data['event_data']['branch_view_data'],
                false,
                data['journey_link_data'],
                journeys_utils.branch,
                {
                  'use_v2_renderer': data['use_v2_renderer'],
                  'animationConfig': data['animationConfig'],
                  'entryAnimationDisabled':
                    journeys_utils.entryAnimationDisabled,
                  'exitAnimationDisabled': journeys_utils.exitAnimationDisabled,
                },
              );
            }
          }
        },
      );
    };
    journeys_utils.branch.addListener(
      'branch_internal_event_didCloseJourney',
      listener,
    );
  }
};

journeys_utils._getPageviewMetadata = journeys_analytics.getPageviewMetadata;

/***
 * @function journeys_utils.animateBannerExit
 * @param {Object} banner
 * @param {boolean=} dismissedJourneyProgrammatically
 */
journeys_utils.animateBannerExit = function (
  banner,
  dismissedJourneyProgrammatically,
) {
  if (!journeys_utils.exitAnimationDisabled) {
    journeys_utils.exitAnimationIsRunning = true;
  }

  // adds transitions for Journey exit if they don't exist
  if (
    journeys_utils.entryAnimationDisabled &&
    !journeys_utils.exitAnimationDisabled
  ) {
    document.body.style.transition =
      'all 0' + journeys_utils.animationSpeed / 1000 + 's ease';
    document.getElementById('branch-banner-iframe').style.transition =
      'all 0' + journeys_utils.animationSpeed / 1000 + 's ease';

    // ensure that -webkit-transition styles get applied as well
    var iFrameOutterCSSBackup =
      document.getElementById('branch-iframe-css').innerHTML + '\n';
    iFrameOutterCSSBackup +=
      'body { -webkit-transition: all ' +
      journeys_utils.animationSpeed / 1000 +
      's ease; }\n';
    iFrameOutterCSSBackup +=
      '#branch-banner-iframe { -webkit-transition: all ' +
      journeys_utils.animationSpeed / 1000 +
      's ease; }\n';
    // in order for updated styles to get applied, we have to remove all branch-iframe-css styles
    document.getElementById('branch-iframe-css').innerHTML = '';
    //re-add them here for changes to take effect
    document.getElementById('branch-iframe-css').innerHTML =
      iFrameOutterCSSBackup;
  }

  if (journeys_utils.position === 'top') {
    banner.style.top = '-' + journeys_utils.bannerHeight;
  } else if (journeys_utils.position === 'bottom') {
    banner.style.bottom = '-' + journeys_utils.bannerHeight;
  }

  journeys_events.publish(
    journeys_utils.branch,
    'willCloseJourney',
    journeys_utils.journeyLinkData,
  );
  if (journeys_utils.position === 'top') {
    document.body.style.marginTop = journeys_utils.bodyMarginTop;
  } else if (journeys_utils.position === 'bottom') {
    document.body.style.marginBottom = journeys_utils.bodyMarginBottom;
  }
  // removes timeout if animation is disabled, else waits out the default animation speed + delay
  var speedAndDelay = journeys_utils.exitAnimationDisabled
    ? 0
    : journeys_utils.animationSpeed + journeys_utils.animationDelay;
  setTimeout(function () {
    // remove banner, branch-css, and branch-iframe-css
    banner_utils.removeElement(banner);
    banner_utils.removeElement(document.getElementById('branch-css'));
    banner_utils.removeElement(document.getElementById('branch-iframe-css'));
    banner_utils.removeElement(document.getElementById('branch-journey-cta'));

    // remove margin from all elements with branch injection div
    if (
      (!journeys_utils.exitAnimationDisabled ||
        journeys_utils.journeyDismissed) &&
      journeys_utils.divToInjectParents &&
      journeys_utils.divToInjectParents.length > 0
    ) {
      journeys_utils.divToInjectParents.forEach(function (parent) {
        parent.style.marginTop = 0;
      });
    } else {
      journeys_utils.exitAnimationDisabledPreviously =
        journeys_utils.exitAnimationDisabled;
      journeys_utils.previousPosition = journeys_utils.position;
      journeys_utils.previousDivToInjectParents =
        journeys_utils.divToInjectParents;
    }

    banner_utils.removeClass(document.body, 'branch-banner-is-active');
    banner_utils.removeClass(document.body, 'branch-banner-no-scroll');

    // clear any safe area listeners on banner closing
    if (journeys_utils.isSafeAreaEnabled) {
      journeys_utils.isSafeAreaEnabled = false;
      window.removeEventListener('resize', journeys_utils._resizeListener);
      window.removeEventListener('scroll', journeys_utils._scrollListener);
    }
    journeys_events.publish(
      journeys_utils.branch,
      'didCloseJourney',
      journeys_utils.journeyLinkData,
    );
    if (!dismissedJourneyProgrammatically) {
      journeys_events.publish(
        journeys_utils.branch,
        'branch_internal_event_didCloseJourney',
        journeys_utils.journeyLinkData,
      );
    }

    journeys_utils.isJourneyDisplayed = false;
    setTimeout(function () {
      journeys_utils.exitAnimationIsRunning = false;
    }, journeys_utils.animationSpeed);
  }, speedAndDelay);
};

journeys_utils.setJourneyLinkData = function (linkData) {
  var data = { 'banner_id': journeys_utils.branchViewId };
  if (
    linkData &&
    typeof linkData === 'object' &&
    Object.keys(linkData || {}).length > 0
  ) {
    utils.removePropertiesFromObject(
      linkData,
      journeys_analytics.FILTERED_LINK_KEYS,
    );
    data['journey_link_data'] = {};
    utils.merge(data['journey_link_data'], linkData);
  }
  journeys_utils.journeyLinkData = data;
  journeys_utils.journeyType = data['journey_link_data']['type'] || null;
  journeys_utils.isDesktopJourney =
    data['journey_link_data']['type'] === 'desktop';
  journeys_utils.journeyVariant = data['journey_link_data']['variant'] || null;
};

// $journeys_cta override delegates to journeys_link_overrides (shared with journeys_v2)
journeys_utils.hasJourneyCtaLink = function () {
  return (
    journeys_link_overrides.getCtaLink(journeys_utils.branch) !== undefined
  );
};

journeys_utils.getJourneyCtaLink = function () {
  return journeys_link_overrides.getCtaLink(journeys_utils.branch);
};

journeys_utils.tryReplaceJourneyCtaLink = function (html) {
  return journeys_link_overrides.applyCtaOverride(journeys_utils.branch, html);
};
