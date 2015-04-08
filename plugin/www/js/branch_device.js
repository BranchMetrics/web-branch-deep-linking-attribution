var exec = require("cordova/exec");

exports.getInstallData = function(args, callback) {
    exec(callback, function() {
        callback({});
    }, "BranchDevice", "getInstallData", args);
};

exports.getOpenData = function(args, callback) {
    exec(callback, function() {
        callback({});
    }, "BranchDevice", "getOpenData", args);
};
