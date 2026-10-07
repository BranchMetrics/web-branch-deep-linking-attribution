import { removePropertiesFromObject } from '../lib/objects.js';
import { dismissEventToSourceMapping } from './constants.js';
import { applyNonce } from '../core/context.js';
import { banner_utils } from '../banner/banner-utils.js';
import {
  getCss,
  getCtaText,
  getIframeCss,
  getJs,
  getMetadata,
  removeScriptAndCss,
} from './template.js';
import {
  globalDismissDeadline,
  recordGlobalDismiss,
  recordViewDismiss,
} from './dismissals.js';
import { animationDurationMs } from './css-animation.js';
import { applyCtaOverride } from './cta-override.js';
import { installCtaScript } from './cta-script.js';
import { buildDismissRequestData, sendDismiss } from './dismiss-request.js';
import { buildJourneyLinkData, FILTERED_LINK_KEYS } from './link-data.js';

export const journeys_utils = {};

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
/** @type {number | string} */
journeys_utils.bodyMarginTop = 0;
/** @type {number | string} */
journeys_utils.bodyMarginBottom = 0;

// Running state of the exit animation
journeys_utils.exitAnimationIsRunning = false;

// Set from event_data.branch_view_data.is_new_animation (see branch_view.displayJourney): true
// when the creative animates #branch-banner itself via CSS, so the SDK must not also move the
// iframe for entrance/exit.
journeys_utils.use_v2_renderer = false;

// Regex to find pieces of the html blob
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
  const unitsRegex = /vh|%/gi; // search and replace vh, %
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
  const metadata = journeys_utils.getMetadata(html) || {};
  if (metadata?.bannerHeight && metadata.position && metadata.sticky) {
    journeys_utils.bannerHeight = metadata.bannerHeight;
    journeys_utils.position = metadata.position;
    journeys_utils.sticky = metadata.sticky;
  } else {
    // to support older banners without proper metadata. Spacer div === top
    const spacerMatch = html.match(journeys_utils.spacerRe);
    if (spacerMatch) {
      journeys_utils.position = 'top';
      const heightMatch = spacerMatch[1].match(journeys_utils.findMarginRe);
      if (heightMatch) {
        journeys_utils.bannerHeight = heightMatch[1];
      }
      journeys_utils.sticky = 'absolute';
    } else {
      journeys_utils.position = 'bottom';
      journeys_utils.sticky = 'fixed';
    }
  }
  const relativeBannerHeightOrFalse =
    journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
      journeys_utils.bannerHeight,
    );
  if (relativeBannerHeightOrFalse) {
    const bannerHeightInPixels =
      // @ts-expect-error -- numeric string such as '50', coerced by `/`
      (relativeBannerHeightOrFalse / 100) * journeys_utils.windowHeight + 'px';
    journeys_utils.bannerHeight = bannerHeightInPixels;
    // @ts-expect-error -- numeric string such as '50', coerced by `<`
    if (relativeBannerHeightOrFalse < 100) {
      journeys_utils.isHalfPage = true;
    } else {
      journeys_utils.isFullPage = true;
    }
  }
};

/***
 * @function journeys_utils.getMetadata
 * @param {string} html
 */
journeys_utils.getMetadata = getMetadata;

/***
 * @function journeys_utils.getIframeCss
 * @param {string} html
 */
journeys_utils.getIframeCss = getIframeCss;

/***
 * @function journeys_utils.getCtaText
 * @param {Object} metadata
 * @param {boolean} hasApp
 */
journeys_utils.getCtaText = getCtaText;

/***
 * @function journeys_utils.findInsertionDiv
 * @param {Object} parent - A dom element or document.body
 * @param {Object} metadata
 */
journeys_utils.findInsertionDiv = function (_parent, metadata) {
  journeys_utils.divToInjectParents = [];

  if (metadata?.injectorSelector) {
    const injectors = document.querySelectorAll(metadata.injectorSelector);
    if (injectors) {
      for (let i = 0; i < injectors.length; i++) {
        journeys_utils.divToInjectParents.push(injectors[i].parentElement);
      }
    }
  }
};

/***
 * @function journeys_utils.getCss
 * @param {string} html
 */
journeys_utils.getCss = getCss;

/***
 * @function journeys_utils.getJsAndAddToParent
 * @param {string} html
 *
 * take the js from template and add to document.body
 */
journeys_utils.getJsAndAddToParent = function (html) {
  const src = getJs(html);
  if (src !== undefined) {
    installCtaScript(journeys_utils.branch._ctx, src);
  }
};

/***
 * @function journeys_utils.removeScriptAndCss
 * @param {string} html
 *
 * After extracting js and css from html blob, we should remove it.
 * We will use the remaining html to add to iframe
 */
journeys_utils.removeScriptAndCss = removeScriptAndCss;

/***
 * @function journeys_utils.createIframe
 */
journeys_utils.createIframe = function () {
  const iframe = document.createElement('iframe');
  iframe.src = 'about:blank'; // solves CORS issues, test in IE
  iframe.style.overflow = 'hidden';
  iframe.scrolling = 'no';
  iframe.id = 'branch-banner-iframe';
  iframe.className = 'branch-animation';
  iframe.title = 'Branch Banner Frame';
  iframe.setAttribute('aria-label', 'Branch Banner Frame');
  applyNonce(journeys_utils.branch._ctx, iframe);

  return iframe;
};

/***
 * @function journeys_utils.addHtmlToIframe
 * @param {Object} iframe - iframe node created in previous step
 * @param {string} html - raw Journey HTML
 * @param {string} userAgent - UA to determine body class
 */
journeys_utils.addHtmlToIframe = function (iframe, html, userAgent) {
  let bodyClass;
  if (userAgent === 'ios' || userAgent === 'ipad') {
    bodyClass = 'branch-banner-ios';
  } else if (userAgent === 'android') {
    bodyClass = 'branch-banner-android';
  } else {
    bodyClass = 'branch-banner-other';
  }
  const iframedoc = iframe.contentDocument || iframe.contentWindow.document;

  // Safely ensure <head> and <body> exist for style injection and innerHTML
  if (!iframedoc.head) {
    const head = iframedoc.createElement('head');
    (iframedoc.documentElement || iframedoc).appendChild(head);
  }
  if (!iframedoc.body) {
    const body = iframedoc.createElement('body');
    (iframedoc.documentElement || iframedoc).appendChild(body);
  }

  iframedoc.body.innerHTML = html;
  iframedoc.body.className = bodyClass;
  const metaTag = iframedoc.querySelector('meta[name="accessibility"]');
  if (metaTag && metaTag.content === 'wcag') {
    const scriptTag = iframedoc.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.text = `
            var focusableElements = 'button, [href], input, select, textarea, [role="button"], h1, [role="text"], .branch-banner-content';
            var modal = document.getElementById('branch-banner');
            var focusableContent = modal.querySelectorAll(focusableElements);
            var focusElementIdx = 0;

            function handleKeyboardNavigation(e) {
                var isTabPressed = e.key === 'Tab' || e.keyCode === 9;
                var isEnterPressed = e.key === 'Enter' || e.keyCode === 13;
                
                // Handle Tab key for focus navigation
                if (isTabPressed) {
                    if (e.shiftKey) {
                        if (focusElementIdx <= 0) {
                            focusElementIdx = focusableContent.length - 1;
                        } else {
                            focusElementIdx = focusElementIdx - 1;
                        }
                    } else {
                        if (focusElementIdx >= focusableContent.length - 1) {
                            focusElementIdx = 0;
                        } else {
                            focusElementIdx = focusElementIdx + 1;
                        }
                    }

                    focusableContent[focusElementIdx].focus();
                    e.preventDefault();
                    return;
                }
                
                // Handle Enter key for activation
                if (isEnterPressed) {
                    // Get the currently focused element
                    var focusedElement = document.activeElement;
                    if (focusedElement && (
                        focusedElement.tagName === 'BUTTON' || 
                        focusedElement.getAttribute('role') === 'button' ||
                        focusedElement.tagName === 'A'
                    )) {
                        // Simulate a click on the element
                        focusedElement.click();
                        e.preventDefault();
                    }
                }
            }

            function autoFocus(delay) {
                setTimeout(function() { focusableContent[focusElementIdx].focus() }, delay);
            }

            document.addEventListener('keydown', handleKeyboardNavigation);
            autoFocus(100);
            
        `;
    iframedoc.querySelector('body').append(scriptTag);
  }
};

/***
 * @function journeys_utils.addIframeOuterCSS
 *
 * Creates a style element on document.body and adds CSS that will determine
 * banner position, height and sticky.
 */
journeys_utils.addIframeOuterCSS = function (cssIframeContainer, metadata) {
  const iFrameCSS = document.createElement('style');
  iFrameCSS.type = 'text/css';
  iFrameCSS.id = 'branch-iframe-css';

  journeys_utils.bodyMarginTop = banner_utils.getBodyStyle('margin-top');
  const bodyMarginTopNumber = +journeys_utils.bodyMarginTop.slice(0, -2);
  journeys_utils.bodyMarginBottom = banner_utils.getBodyStyle('margin-bottom');
  const bodyMarginBottomNumber = +journeys_utils.bodyMarginBottom.slice(0, -2);
  const bannerMarginNumber = +journeys_utils.bannerHeight.slice(0, -2);

  if (cssIframeContainer) {
  } else if (journeys_utils.position === 'top') {
    const calculatedBodyMargin = +bannerMarginNumber + bodyMarginTopNumber;
    document.body.style.marginTop = calculatedBodyMargin.toString() + 'px';
  } else if (journeys_utils.position === 'bottom') {
    const calculatedBodyMargin = +bannerMarginNumber + bodyMarginBottomNumber;
    document.body.style.marginBottom = calculatedBodyMargin.toString() + 'px';
  }

  // adds margin to the parent of div being inserted into
  if (journeys_utils.divToInjectParents.length > 0) {
    // dont want to add margin for full page fixed
    journeys_utils.divToInjectParents.forEach(function (parent) {
      let isFixedNavFullPage;
      const computedParentStyle = window.getComputedStyle(parent);
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

  let finalOuterCSS = '';

  if (cssIframeContainer) {
    finalOuterCSS = cssIframeContainer;
  } else {
    finalOuterCSS = generateIframeOuterCSS(metadata);
  }

  // Inject configured CSS if it targets the IFRAME surface (the host page)
  if (
    journeys_utils.animationConfig &&
    journeys_utils.animationConfig.surface === 'IFRAME'
  ) {
    finalOuterCSS += '\n' + journeys_utils.animationConfig.generatedCss + '\n';
  }

  iFrameCSS.innerHTML = finalOuterCSS;

  applyNonce(journeys_utils.branch._ctx, iFrameCSS);

  document.head.appendChild(iFrameCSS);
};

function generateIframeOuterCSS(_metadata) {
  let bodyWebkitTransitionStyle = '';
  let iFrameAnimationStyle = '';

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

  let css = '';
  css += bodyWebkitTransitionStyle || '';
  if (journeys_utils.isDesktopJourney) {
    let bannerHeight = journeys_utils.bannerHeight;
    let bannerWidth = journeys_utils.bannerWidth;
    let sticky = journeys_utils.sticky;
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
  const css = document.createElement('style');
  css.type = 'text/css';
  css.id = 'branch-css';

  let finalCSS = innerCSS;
  if (
    journeys_utils.animationConfig &&
    journeys_utils.animationConfig.surface === 'CONTENT'
  ) {
    finalCSS += '\n' + journeys_utils.animationConfig.generatedCss + '\n';
  }

  css.innerHTML = finalCSS;

  applyNonce(journeys_utils.branch._ctx, css);

  const doc = iframe.contentWindow.document;
  doc.head.appendChild(css);

  const isDesktopOverlay =
    journeys_utils.isDesktopJourney &&
    journeys_utils.journeyVariant === 'overlay';

  // if banner is partial height with relative units, we need to make sure
  // it fills the entire height of the iframe
  if (
    (journeys_utils.isHalfPage || journeys_utils.isFullPage) &&
    !isDesktopOverlay
  ) {
    const dismissBackground = doc.getElementsByClassName(
      'branch-banner-dismiss-background',
    )[0];
    const content = doc.getElementsByClassName('branch-banner-content')[0];
    if (!dismissBackground && content) {
      content.style.height = journeys_utils.bannerHeight;
    }
  }

  // Skip if #branch-banner is animating its own entrance -- moving the iframe too would
  // double or fight that animation.
  if (!journeys_utils.use_v2_renderer) {
    if (journeys_utils.position === 'top') {
      iframe.style.top = '-' + journeys_utils.bannerHeight;
    } else if (journeys_utils.position === 'bottom') {
      iframe.style.bottom = '-' + journeys_utils.bannerHeight;
    }
  }

  // remove box shadow if no content background color
  // this is to allow floating button to work
  try {
    // get computed background-color of .branch-banner-content
    const content = doc.getElementsByClassName('branch-banner-content')[0];
    const contentComputedStyle = window.getComputedStyle(content);
    const bg = contentComputedStyle.getPropertyValue('background-color');
    const arr = bg.split(', ');
    // if the alpha === 0, remove the box shadow
    if (arr[3] && parseFloat(arr[3]) === 0) {
      iframe.style.boxShadow = 'none';
    }
  } catch (_err) {}
};

/***
 * @function journeys_utils.addDynamicCtaText
 * @param {Object} iframe
 * @param {string} ctaText
 */
journeys_utils.addDynamicCtaText = function (iframe, ctaText) {
  const doc = iframe.contentWindow.document;
  if (doc?.getElementById('branch-mobile-action')) {
    const mobileAction = doc.getElementById('branch-mobile-action');
    mobileAction.innerHTML = ctaText;
    mobileAction.setAttribute('aria-label', ctaText);
  }
};

journeys_utils.getAnimationRoot = function (banner) {
  if (!banner) return null;

  const isIframeSurface =
    journeys_utils.animationConfig &&
    journeys_utils.animationConfig.surface === 'IFRAME';

  if (isIframeSurface) {
    return banner;
  }

  if (banner.contentWindow) {
    const doc = banner.contentWindow.document;
    if (doc) {
      return (
        doc.getElementById('branch-banner') ||
        doc.querySelector('.branch-banner-content') ||
        null
      );
    }
  }
  return null;
};

function getAnimationClass(isExit) {
  if (journeys_utils.animationConfig?.classes) {
    return isExit
      ? journeys_utils.animationConfig.classes.exit
      : journeys_utils.animationConfig.classes.enter;
  }
  return isExit ? 'branch-banner-exit' : 'branch-banner-enter';
}

function isAnimationDisabled(isExit) {
  return isExit
    ? journeys_utils.exitAnimationDisabled
    : journeys_utils.entryAnimationDisabled;
}

journeys_utils.attachAnimation = function (element, isExit) {
  if (!element || isAnimationDisabled(isExit)) {
    return;
  }

  const className = getAnimationClass(isExit);
  if (className) {
    banner_utils.addClass(element, className);
  }
};

journeys_utils.detachAnimation = function (element, isExit) {
  if (!element || isAnimationDisabled(isExit)) {
    return;
  }

  const className = getAnimationClass(isExit);
  if (className) {
    banner_utils.removeClass(element, className);
  }
};

/***
 * @function journeys_utils.animateBannerEntrance
 * @param {Object} banner
 */
journeys_utils.animateBannerEntrance = function (banner, cssIframeContainer) {
  // Only attach the entrance class if this is the new animation path
  if (journeys_utils.use_v2_renderer && banner?.contentWindow) {
    const bannerRoot = journeys_utils.getAnimationRoot(banner);
    journeys_utils.attachAnimation(bannerRoot, false);
  }

  banner_utils.addClass(document.body, 'branch-banner-is-active');
  if (journeys_utils.isFullPage && journeys_utils.sticky === 'fixed') {
    const bodyCSS = document.createElement('style');
    bodyCSS.type = 'text/css';
    bodyCSS.innerHTML = '.branch-banner-no-scroll {overflow: hidden;}';
    document.head.appendChild(bodyCSS);
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
          journeys_utils.journeyLinkData?.journey_link_data &&
          !journeys_utils.journeyLinkData.journey_link_data.safeAreaRequired
        ) {
          banner.style.bottom = '0';
        } else {
          journeys_utils._dynamicallyRepositionBanner();
        }
      }
    }
    journeys_utils.branch._publishEvent(
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
  const bannerIFrame = document.getElementById('branch-banner-iframe');
  const bannerHeight = bannerIFrame.offsetHeight;
  const bannerTopDistance = bannerIFrame.offsetTop;
  const windowHeight = window.innerHeight;

  // on first load check if the page is already scrolling
  if (checkIfPageAlreadyScrollingOnFirstLoad) {
    if (window.pageYOffset !== 0) {
      bannerIFrame.style.bottom = '0';
      return false;
    }
  }

  if (!isPageBottomOverScrolling) {
    // always keep banner top location equal to the height specified
    if (windowHeight - bannerTopDistance !== bannerHeight) {
      bannerIFrame.style.top = '' + (windowHeight - bannerHeight) + 'px';
    }
  } else {
    // bottom overscrolling is usually equivalent to half the banner size
    bannerIFrame.style.top =
      windowHeight - bannerHeight + bannerHeight / 2 + 'px';
  }
};

journeys_utils._findGlobalDismissPeriod = globalDismissDeadline;

/***
 * @function journeys_utils.finalHookups
 * @param {string} templateId
 * @param {string} audienceRuleId
 * @param {Object} storage
 * @param {() => void} cta
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

  const doc = banner.contentWindow.document;

  const actionEls = doc.querySelectorAll('#branch-mobile-action');
  Array.prototype.forEach.call(actionEls, function (el) {
    el.addEventListener('click', function (_e) {
      journeys_utils.branch._publishEvent(
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
  const doc = banner.contentWindow.document;
  const cancelEls = doc.querySelectorAll(cssSelector);
  Array.prototype.forEach.call(cancelEls, function (el) {
    el.addEventListener(eventType, function (_e) {
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

journeys_utils._setJourneyDismiss = recordViewDismiss;

journeys_utils._getDismissRequestData = function (
  branch_view,
  dismissal_source,
) {
  return buildDismissRequestData({
    branch: journeys_utils.branch,
    branchView: branch_view,
    source: dismissal_source,
    linkData: journeys_utils.journeyLinkData,
  });
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
  const globalDismissPeriod = !testModeEnabled
    ? journeys_utils._findGlobalDismissPeriod(metadata)
    : 0;
  journeys_utils.branch._publishEvent(
    eventName,
    journeys_utils.journeyLinkData,
  );
  journeys_utils.journeyDismissed = true;
  journeys_utils.animateBannerExit(banner);

  if (!testModeEnabled) {
    recordGlobalDismiss(storage, globalDismissPeriod);
    journeys_utils._setJourneyDismiss(storage, templateId, audienceRuleId);
    const listener = function () {
      journeys_utils.branch.removeListener(listener);
      const requestData = journeys_utils._getDismissRequestData(
        branch_view,
        dismissEventToSourceMapping[eventName],
      );
      sendDismiss({
        branch: journeys_utils.branch,
        requestData,
        dismissRedirect: metadata ? metadata.dismissRedirect : undefined,
      });
    };
    journeys_utils.branch.addListener(
      'branch_internal_event_didCloseJourney',
      listener,
    );
  }
};

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

  // Trigger any exit animation the creative authored on #branch-banner, and read its real
  // duration so removal below waits for it instead of using the SDK default.
  let contentHandlesExit = false;
  let contentExitDurationMs = 0;

  if (journeys_utils.use_v2_renderer && banner?.contentWindow) {
    const bannerRoot = journeys_utils.getAnimationRoot(banner);
    if (bannerRoot) {
      journeys_utils.detachAnimation(bannerRoot, false);
      journeys_utils.attachAnimation(bannerRoot, true);

      contentHandlesExit = true;
      contentExitDurationMs =
        journeys_utils._getAnimationDurationMs(bannerRoot);
    }
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
    let iFrameOutterCSSBackup =
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

  // Same guard as the entrance side: skip if #branch-banner is animating its own exit.
  if (!contentHandlesExit) {
    if (journeys_utils.position === 'top') {
      banner.style.top = '-' + journeys_utils.bannerHeight;
    } else if (journeys_utils.position === 'bottom') {
      banner.style.bottom = '-' + journeys_utils.bannerHeight;
    }
  }

  journeys_utils.branch._publishEvent(
    'willCloseJourney',
    journeys_utils.journeyLinkData,
  );
  if (journeys_utils.position === 'top') {
    // @ts-expect-error -- 0 until measured; CSS accepts a bare 0
    document.body.style.marginTop = journeys_utils.bodyMarginTop;
  } else if (journeys_utils.position === 'bottom') {
    // @ts-expect-error -- 0 until measured; CSS accepts a bare 0
    document.body.style.marginBottom = journeys_utils.bodyMarginBottom;
  }
  // removes timeout if animation is disabled, else the default timeout or the content's own
  // exit animation, whichever is longer
  const speedAndDelay = journeys_utils.exitAnimationDisabled
    ? 0
    : Math.max(
        journeys_utils.animationSpeed + journeys_utils.animationDelay,
        contentExitDurationMs,
      );
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
    journeys_utils.branch._publishEvent(
      'didCloseJourney',
      journeys_utils.journeyLinkData,
    );
    if (!dismissedJourneyProgrammatically) {
      journeys_utils.branch._publishEvent(
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

/***
 * @function journeys_utils._getAnimationDurationMs
 * @param {Object} element
 *
 * Total CSS animation time on element (animation-delay + animation-duration), in ms.
 * 0 if no animation is applied.
 */
journeys_utils._getAnimationDurationMs = animationDurationMs;

journeys_utils.setJourneyLinkData = function (linkData) {
  // Build before stripping: link data made only of filtered keys still gets an
  // empty journey_link_data, as in v1.
  const data = buildJourneyLinkData(journeys_utils.branchViewId, linkData);
  // v1 has always stripped these keys from the caller's object too; kept for parity.
  removePropertiesFromObject(linkData, FILTERED_LINK_KEYS);
  journeys_utils.journeyLinkData = data;
  journeys_utils.isDesktopJourney = data.journey_link_data.type === 'desktop';
  journeys_utils.journeyVariant = data.journey_link_data.variant || null;
};

journeys_utils.tryReplaceJourneyCtaLink = function (html) {
  return applyCtaOverride(journeys_utils.branch, html);
};
