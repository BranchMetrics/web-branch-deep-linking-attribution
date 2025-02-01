/**
 * Just a couple of variables that shouldn't change very often...
 */
goog.provide('config');

config.app_service_endpoint = 'https://bnc.lt';
config.link_service_endpoint = 'https://bnc.lt';
config.api_endpoint = 'https://api.branch.io';
// will get overwritten by gha on actual deploy
config.version = '2.85.2';
