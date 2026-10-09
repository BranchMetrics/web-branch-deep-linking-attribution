import { safejson } from '../core/safejson.js';
import { snakeToCamel } from '../lib/objects.js';
import { getPlatformByUserAgent } from '../core/platform.js';
import { getEnv } from '../env/env.js';
import { HOST_ID } from '../journeys/v2/renderer/index.js';

export const banner_utils = {};

// UI Animation transition speed in ms.
banner_utils.animationSpeed = 250;

// UIAnimation delay between juxtaposed elements.
banner_utils.animationDelay = 20;

// Height of banner.
banner_utils.bannerHeight = '76px';

/**
 * @param {Object} element
 */
banner_utils.removeElement = function (element) {
  if (element?.parentNode) {
    element.parentNode.removeChild(element);
  }
};

banner_utils.hasClass = function (element, className) {
  return !!element.className.match(
    new RegExp('(\\s|^)' + className + '(\\s|$)'),
  );
};

banner_utils.addClass = function (element, className) {
  if (!element) {
    return;
  }
  if (!banner_utils.hasClass(element, className)) {
    element.className += ' ' + className;
  }
};

banner_utils.removeClass = function (element, className) {
  if (!element) {
    return;
  }
  if (banner_utils.hasClass(element, className)) {
    const reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
    element.className = element.className.replace(reg, ' ');
  }
};

banner_utils.getDate = function (days) {
  const currentDate = new Date();
  return currentDate.setDate(currentDate.getDate() + days);
};

banner_utils.getBodyStyle = function (style) {
  if (document.body.currentStyle) {
    return document.body.currentStyle[snakeToCamel(style)];
  } else {
    return window.getComputedStyle(document.body).getPropertyValue(style);
  }
};

banner_utils.addCSSLengths = function (length1, length2) {
  const convertToUnitlessPixels = function (input) {
    if (!input) {
      return 0;
    }
    const unit = input.replace(/[0-9,\.]/g, '');
    const inputArray = input.match(/\d+/g);
    const value = parseInt(inputArray.length > 0 ? inputArray[0] : '0', 10);
    const vw = function () {
      return (
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0) /
        100
      );
    };
    const vh = function () {
      return (
        Math.max(
          document.documentElement.clientHeight,
          window.innerHeight || 0,
        ) / 100
      );
    };
    return parseInt(
      {
        'px': function (value) {
          return value;
        },
        'em': function (value) {
          if (document.body.currentStyle) {
            return (
              value *
              convertToUnitlessPixels(document.body.currentStyle.fontSize)
            );
          } else {
            return (
              value *
              parseFloat(window.getComputedStyle(document.body).fontSize)
            );
          }
        },
        'rem': function (value) {
          if (document.documentElement.currentStyle) {
            return (
              value *
              convertToUnitlessPixels(
                document.documentElement.currentStyle.fontSize,
              )
            );
          } else {
            return (
              value *
              parseFloat(
                window.getComputedStyle(document.documentElement).fontSize,
              )
            );
          }
        },
        'vw': function (value) {
          return value * vw();
        },
        'vh': function (value) {
          return value * vh();
        },
        'vmin': function (value) {
          return value * Math.min(vh(), vw());
        },
        'vmax': function (value) {
          return value * Math.max(vh(), vw());
        },
        '%': function () {
          return (document.body.clientWidth / 100) * value;
        },
      }[unit](value),
      10,
    );
  };
  return (
    (
      convertToUnitlessPixels(length1) + convertToUnitlessPixels(length2)
    ).toString() + 'px'
  );
};

/**
 * @param {Object} storage
 * @param {Object} options
 * @return {boolean}
 */
banner_utils.shouldAppend = function (storage, options) {
  let hideBanner = storage.get('hideBanner', true);

  if (options.respectDNT && !!Number(getEnv().doNotTrack())) {
    return false;
  }
  try {
    if (typeof hideBanner === 'string') {
      hideBanner = safejson.parse(hideBanner);
    }
  } catch (_e) {
    hideBanner = false;
  }
  if (typeof hideBanner === 'number') {
    hideBanner = new Date() >= new Date(hideBanner);
  } else {
    hideBanner = !hideBanner;
  }

  let forgetHide = options.forgetHide;
  if (typeof forgetHide === 'number') {
    forgetHide = false;
  }

  return (
    !document.getElementById('branch-banner') &&
    !document.getElementById('branch-banner-iframe') &&
    // A v2 journey's #branch-banner is inside this host's shadow root.
    !document.getElementById(HOST_ID) &&
    (hideBanner || forgetHide) &&
    ((options.showAndroid && getPlatformByUserAgent() === 'android') ||
      (options.showiPad && getPlatformByUserAgent() === 'ipad') ||
      (options.showiOS && getPlatformByUserAgent() === 'ios') ||
      (options.showBlackberry && getPlatformByUserAgent() === 'blackberry') ||
      (options.showWindowsPhone &&
        getPlatformByUserAgent() === 'windows_phone') ||
      (options.showKindle && getPlatformByUserAgent() === 'kindle'))
  );
};
