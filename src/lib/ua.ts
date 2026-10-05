function isSafariBrowser(ua) {
  return !!/^((?!chrome|android|crios|firefox|fxios|edg|yabrowser).)*safari/i.test(
    ua,
  );
}

function isChromeBrowser(ua) {
  return !!/(chrome|crios)/i.test(ua);
}

function isFirefoxBrowser(ua) {
  return !!/(fxios|firefox)/i.test(ua);
}

function isEdgeBrowser(ua) {
  return !!/edg/i.test(ua);
}

function isOperaBrowser(ua) {
  return !!/(opt|opr)/i.test(ua);
}

function isYandexBrowser(ua) {
  return !!/yabrowser/i.test(ua);
}

function isMacintoshDesktop(ua) {
  return ua && ua.indexOf('Macintosh') > -1;
}

function isGTEVersion(ua, v) {
  v = v || 11;

  const match = /version\/([^ ]*)/i.exec(ua);
  if (match?.[1]) {
    try {
      const version = parseFloat(match[1]);
      if (version >= v) {
        return true;
      }
    } catch (_e) {
      return false;
    }
  }
  return false;
}

function isSafari13OrGreateriPad(ua, isPortraitScreen) {
  return (
    ua &&
    isSafariBrowser(ua) &&
    isMacintoshDesktop(ua) &&
    isGTEVersion(ua, 13) &&
    isPortraitScreen
  );
}

function isIOS(ua) {
  return ua && /(iPad|iPod|iPhone)/.test(ua);
}

export function getPlatformByUserAgent(ua: string, isPortraitScreen: boolean) {
  if (ua.match(/android/i)) {
    return 'android';
  }
  if (ua.match(/ipad/i) || isSafari13OrGreateriPad(ua, isPortraitScreen)) {
    return 'ipad';
  }
  if (ua.match(/i(os|p(hone|od))/i)) {
    return 'ios';
  }
  if (ua.match(/\(BB[1-9][0-9]*\;/i)) {
    return 'blackberry';
  }
  if (ua.match(/Windows Phone/i)) {
    return 'windows_phone';
  }
  if (
    ua.match(/Kindle/i) ||
    ua.match(/Silk/i) ||
    ua.match(/KFTT/i) ||
    ua.match(/KFOT/i) ||
    ua.match(/KFJWA/i) ||
    ua.match(/KFJWI/i) ||
    ua.match(/KFSOWI/i) ||
    ua.match(/KFTHWA/i) ||
    ua.match(/KFTHWI/i) ||
    ua.match(/KFAPWA/i) ||
    ua.match(/KFAPWI/i)
  ) {
    return 'kindle';
  }
  if (ua.match(/(Windows|Macintosh|Linux)/i)) {
    return 'desktop';
  }
  return 'other';
}

/**
 * Returns true if browser is safari version 11 or greater
 */
export function isSafari11OrGreater(ua: string) {
  const isSafari = isSafariBrowser(ua);

  if (isSafari) {
    return isGTEVersion(ua, 11);
  }

  return false;
}

export function isIOSWKWebView(ua: string, isWebKit: boolean) {
  return (
    isWebKit &&
    ua &&
    isIOS(ua) &&
    !isChromeBrowser(ua) &&
    !isFirefoxBrowser(ua) &&
    !isEdgeBrowser(ua) &&
    !isOperaBrowser(ua) &&
    !isYandexBrowser(ua)
  );
}
