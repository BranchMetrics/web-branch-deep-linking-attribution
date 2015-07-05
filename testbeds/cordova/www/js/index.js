function interceptFormSubmission() { }

var app = {
    // ------------------ Inititalization & Utility Methods ------------------

    initialize: function() {
        app.branch_key = "key_live_hohBTjb6eJS9jou8Tl1kIhddokjfbXJF";
        document.addEventListener('deviceready', app.onDeviceReady, false);
    },

    setElement: function(element, value) { if (element && element.length) { document.getElementById(element).innerHTML = value; } },

    setStatus: function(status) { if (status && status.length > 0) { app.setElement("status", status); } },

    getElementValue: function(element) {
        var elementRef = document.getElementById(element);
        return elementRef ? document.getElementById(element).value : "";
    },

    executeBranchMethod: function(method, arguments, element, callback) {
        app.setStatus("branch." + method + "() Called");
        arguments.push(function(err, data) {
            if (err) {
                app.setStatus(method + "() " + err);
                app.setElement(element, err);
            }
            else {
                app.setStatus(method + "() Successful");
                app.setElement(element, typeof data == "object" ? JSON.stringify(data) : data);
            }
            if (callback && typeof callback == "function" ) { callback(err, data); }
        });
        branch[method].apply(branch, arguments);
    },

    // ------------------ Lifecycle Methods ------------------

    onDeviceReady: function() {
        branch.setDebug(true);
        document.addEventListener('resume', app.onResume, false);
        document.addEventListener('pause', app.onPause, false);
        app.setStatus("onDeviceReady()");
        branch.init(app.branch_key, { isReferrable: true }, function(err, data) {
            app.initComplete(err, data);
        });
    },

    onPause: function() {
        app.setStatus("onPause(): Sending Close");
        branch.close(function(err) {
            if (err) { app.setStatus("Close error: ", err); }
            else { app.setStatus("Close finished successfully"); }
        });
    },

    onResume: function() {
        app.setStatus("onResume()");
        branch.init(app.branch_key, { isReferrable: true }, function(err, data) {
            app.initComplete(err, data);
        });
    },

    initComplete: function(err, data) {
        if (err) { app.setStatus("Init error: ", err); }
        else {
            app.setStatus("Branch SDK Init Success");
            branch.first(function(err, data) {
                if (data.data && !(data.data === "null")) { app.setElement("first", JSON.stringify(data.data)); }
                else { app.setElement("first", "{ }"); }
            });
            branch.data(function(err, data) {
                if (data.data && !(data.data === "null")) { app.setElement("latest", JSON.stringify(data.data)); }
                else { app.setElement("latest", "{ }"); }
            });
        }
    },

    //------------------ Branch SDK Methods ------------------

    createUrl: function() {
        var params = { };
        params.data = { };
        params.data.creation_date = new Date().toString();
        if (app.getElementValue("feature") && app.getElementValue("feature") != "none") { params.feature = app.getElementValue("feature"); }
        if (app.getElementValue("alias")) { params.alias = app.getElementValue("alias"); }
        if (app.getElementValue("channel")) { params.channel = app.getElementValue("channel"); }
        if (app.getElementValue("stage")) { params.stage = app.getElementValue("stage"); }
        if (app.getElementValue("tags")) { params.tags = app.getElementValue("tags").split(','); }

        app.executeBranchMethod("link", [ params ], "url_label");
    },

    setIdentity: function() {
        var name = app.getElementValue("name");
        if (name && name.length > 0) {
            app.executeBranchMethod("setIdentity", [ name ], "name", function(err, data) {
                if (!err) { app.setElement("username", name); }
            });
        }
        else {
            app.setStatus("setIdentity() no login name specififed");
            app.setElement("username", "no login name specififed");
        }
    },

    logout: function() {
        app.executeBranchMethod("logout", [ ], "username", function(err, data) {
            if (!err) { app.setElement("username", name); }
        });
    },

    sendEmail: function() {
        cordova.plugins.email.open({
            subject: "Check out this app!",
            body: "Follow this link to the new app! " + app.getElementValue("url_label")
        });
    },

    completeAction: function() {
        var eventName = app.getElementValue("event");
        if (eventName && eventName.length > 0) {
            var params = { "creation_date": Date().toString() };
            app.executeBranchMethod("track", [ eventName, params], "");
        }
    },

    referrals: function() {
        app.executeBranchMethod("referrals", [ ], "actions");
    },

    createCode: function() {
        var params = { };
        params.amount = app.getElementValue("amount") ? parseInt(app.getElementValue("amount")) : 1;
        params.calculation_type = app.getElementValue("calculation_type") ? parseInt(app.getElementValue("calculation_type")) : 1;
        params.location = app.getElementValue("location") ? parseInt(app.getElementValue("location")) : 2;
        if (app.getElementValue("bucket")) { params.bucket = app.getElementValue("bucket"); }
        if (app.getElementValue("prefix")) { params.prefix = app.getElementValue("prefix"); }
        app.executeBranchMethod("getCode", [ params ], "code_label");
    },

    validateCode: function() {
        var code = app.getElementValue("av_code");
        if (!code) {
            app.setElement("code_status_label", "Error: no code specified");
            return app.setStatus("applyCode() Error: no code specified");
        }
        app.executeBranchMethod("validateCode", [ code ], "code_status_label", function(err,data) {
            if (!err) { app.setElement("code_status_label", "Code Valid"); }
        });
    },

    applyCode: function() {
        var code = app.getElementValue("av_code");
        if (!code) {
            app.setElement("code_status_label", "Error: no code specified");
            return app.setStatus("applyCode() Error: no code specified");
        }
        app.executeBranchMethod("applyCode", [ code ], "code_status_label", function(err,data) {
            if (!err) { app.setElement("code_status_label", "Code Applied"); }
        });
    },

    redeem: function() {
        app.executeBranchMethod("redeem",
            [ parseInt(app.getElementValue("rewards_amount")), app.getElementValue("rewards_bucket") ],
            "rewards_status_label");
    },

    credits: function() {
        app.executeBranchMethod("credits", [ ], "rewards_status_label");
    },

    creditHistory: function() {
        var params = { "bucket": app.getElementValue("rewards_bucket") || "" };
        app.executeBranchMethod("creditHistory", [ params ], "rewards_bucket");
    }
};
