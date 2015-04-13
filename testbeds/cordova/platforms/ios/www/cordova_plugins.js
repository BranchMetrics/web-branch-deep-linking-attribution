cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/de.appplant.cordova.plugin.email-composer/www/email_composer.js",
        "id": "de.appplant.cordova.plugin.email-composer.EmailComposer",
        "clobbers": [
            "cordova.plugins.email",
            "plugin.email"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.console/www/console-via-logger.js",
        "id": "org.apache.cordova.console.console",
        "clobbers": [
            "console"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.console/www/logger.js",
        "id": "org.apache.cordova.console.logger",
        "clobbers": [
            "cordova.logger"
        ]
    },
    {
        "file": "plugins/io.branch.sdk/dist/cordova/build.js",
        "id": "io.branch.sdk.branch",
        "clobbers": [
            "branch",
            "Branch"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "de.appplant.cordova.plugin.email-composer": "0.8.2",
    "org.apache.cordova.console": "0.2.13",
    "io.branch.sdk": "1.0.0"
}
// BOTTOM OF METADATA
});