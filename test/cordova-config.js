/**
 * Just a couple of variables that shouldn't change very often...
 */
goog.provide('config');

config.link_service_endpoint = 'https://bnc.lt';
config.api_endpoint = 'https://api.branch.io';
config.version = '1.6.4';

/** @define {boolean} */
window.WEB_BUILD = false;

/** @define {boolean} */
window.CORDOVA_BUILD = true;

/** @define {boolean} */
window.TITANIUM_BUILD = false;

window.DEBUG = false;
