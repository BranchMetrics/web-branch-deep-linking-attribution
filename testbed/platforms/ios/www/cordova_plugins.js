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
        "file": "plugins/io.branch.device/www/js/branch_device.js",
        "id": "io.branch.device.branch_device",
        "clobbers": [
            "cordova.plugins.branch_device",
            "plugin.branch_device"
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
        "file": "plugins/org.apache.cordova.device/www/device.js",
        "id": "org.apache.cordova.device.device",
        "clobbers": [
            "device"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "de.appplant.cordova.plugin.email-composer": "0.8.2",
    "io.branch.device": "0.0.1",
    "org.apache.cordova.console": "0.2.13",
    "org.apache.cordova.device": "0.3.0"
}
// BOTTOM OF METADATA
});