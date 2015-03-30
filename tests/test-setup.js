mocha.ui('bdd');
mocha.reporter('html');

// For whatever reason, gotta duplicate these from the other tests
goog.require('utils');
goog.require('Server');
goog.require('Branch');
goog.require('resources');
goog.require('storage');
