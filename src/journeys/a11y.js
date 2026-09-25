'use strict';
goog.provide('journeys_a11y');

// Keyboard navigation for WCAG creatives. Runs inside the iframe document (a separate JS realm),
// so it has to be injected as script text rather than called as a function.
journeys_a11y.META_SELECTOR = 'meta[name="accessibility"]';
journeys_a11y.META_VALUE = 'wcag';

journeys_a11y.SCRIPT = [
  'var focusableElements = \'button, [href], input, select, textarea, [role="button"], h1, [role="text"], .branch-banner-content\';',
  "var modal = document.getElementById('branch-banner');",
  'var focusableContent = modal.querySelectorAll(focusableElements);',
  'var focusElementIdx = 0;',
  'function handleKeyboardNavigation(e) {',
  "  var isTabPressed = e.key === 'Tab' || e.keyCode === 9;",
  "  var isEnterPressed = e.key === 'Enter' || e.keyCode === 13;",
  '  if (isTabPressed) {',
  '    if (!focusableContent.length) {',
  '      return;',
  '    }',
  '    if (e.shiftKey) {',
  '      focusElementIdx = focusElementIdx <= 0 ? focusableContent.length - 1 : focusElementIdx - 1;',
  '    } else {',
  '      focusElementIdx = focusElementIdx >= focusableContent.length - 1 ? 0 : focusElementIdx + 1;',
  '    }',
  '    focusableContent[focusElementIdx].focus();',
  '    e.preventDefault();',
  '    return;',
  '  }',
  '  if (isEnterPressed) {',
  '    var focusedElement = document.activeElement;',
  "    if (focusedElement && (focusedElement.tagName === 'BUTTON' || focusedElement.getAttribute('role') === 'button' || focusedElement.tagName === 'A')) {",
  '      focusedElement.click();',
  '      e.preventDefault();',
  '    }',
  '  }',
  '}',
  "document.addEventListener('keydown', handleKeyboardNavigation);",
  'if (focusableContent.length) {',
  '  setTimeout(function() { focusableContent[focusElementIdx].focus(); }, 100);',
  '}',
].join('\n');

journeys_a11y.isRequested = function (doc) {
  var meta = doc.querySelector(journeys_a11y.META_SELECTOR);
  return !!meta && meta.content === journeys_a11y.META_VALUE;
};

// Installs the keyboard-nav script into doc.body if requested. Returns whether it was installed.
journeys_a11y.install = function (doc) {
  if (!journeys_a11y.isRequested(doc)) {
    return false;
  }
  var script = doc.createElement('script');
  script.type = 'text/javascript';
  script.text = journeys_a11y.SCRIPT;
  doc.body.appendChild(script);
  return true;
};
