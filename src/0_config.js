/**
 * Just a couple of variables that shouldn't change very often...
 */
goog.provide('config');
/** @define {string} */
var DEFAULT_API_ENDPOINT = 'https://api2.branch.io';

config.app_service_endpoint = 'https://app.link';
config.link_service_endpoint = 'https://bnc.lt';
config.api_endpoint = DEFAULT_API_ENDPOINT;
// will get overwritten by gha on actual deploy
config.version = '2.86.1';
