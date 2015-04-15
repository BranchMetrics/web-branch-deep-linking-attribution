#!/bin/bash

cordova platform add ios android
cordova plugin add org.apache.cordova.console de.appplant.cordova.plugin.email-composer
ln -s `cd ../.. && pwd` plugins/io.branch.sdk
