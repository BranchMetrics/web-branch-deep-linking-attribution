
// Intercept form submission.
function dummy() {
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('resume', this.onResume, false);
    },

    // deviceready Event Handler
    onDeviceReady: function() {
        console.log("Device ready");
        branch.setDebug(true);
    	console.log("Sending init");
        branch.init('key_live_hohBTjb6eJS9jou8Tl1kIhddokjfbXJF', { isReferrable: true }, function(err, data) {
        	app.initComplete(err, data);
        });
        var statusEle = document.getElementById("status");
        statusEle.innerHTML = "Ready..."
    },

    // pause Event Handler
    onPause: function() {
    	console.log("Sending close.");
    	branch.close(function(err) {
            var statusEle = document.getElementById("status");
        	if (err) {
                console.log("Close error: " + err);
        		statusEle.innerHTML = err;
        	} else {
                console.log("Close complete.");
                statusEle.innerHTML = "Ok";
        	}
   		});
    },

    // resume Event Handler
    onResume: function() {
    	console.log("Sending init");
        branch.init('key_live_hohBTjb6eJS9jou8Tl1kIhddokjfbXJF', { isReferrable: true }, function(err, data) {
        	app.initComplete(err, data);
        });
        var statusEle = document.getElementById("status");
        statusEle.innerHTML = "Resumed..."
    },

    initComplete: function(err, data) {
        var statusEle = document.getElementById("status");
        var firstEle = document.getElementById("first");
        var latestEle = document.getElementById("latest");
    	if (err) {
            console.log("Init error: " + err);
    		statusEle.innerHTML = err;
    	} else {
            console.log("Init complete: " + JSON.stringify(data));
            statusEle.innerHTML = "Ok";
            branch.first(function(err, data) {
            	if (data.data && !(data.data === "null")) {
            		first.innerHTML = JSON.stringify(data.data);
            	} else {
            		first.HTML = "{}";
            	}
            });
            branch.data(function(err, data) {
            	if (data.data && !(data.data === "null")) {
            		latest.innerHTML = JSON.stringify(data.data);
            	} else {
            		latest.HTML = "{}";
            	}
            });
    	}
    },

    createUrl: function() {
        console.log("Create URL clicked");
        var aliasEle = document.getElementById("alias");
        var channelEle = document.getElementById("channel");
        var stageEle = document.getElementById("stage");
        var typeEle = document.getElementById("url_type");
        var featureEle = document.getElementById("feature");
        var tagsEle = document.getElementById("tags");
        var paramsEle = document.getElementById("params");
        var tags = null;
        if (tagsEle.value) {
            tags = tagsEle.value.split(',');
        }
        var params = {};
        var current = new Date();
        params.creation_data = current.toString();
        if (paramsEle.value) {
            var prms = paramsEle.value.split(',');
            if (prms.length > 0) {
                params.params = prms;
            }
        }
        var vals = {};
       	vals.type = parseInt(typeEle.value);
        if (featureEle.value) {
        	if (!(featureEle.value === "none")) {
            	vals.feature = featureEle.value;
        	}
        }
        if (aliasEle.value) {
        	vals.alias = aliasEle.value;
        }
        if (channelEle.value) {
        	vals.channel = channelEle.value;
        }
        if (stageEle.value) {
        	vals.stage = stageEle.value;
        }
        if (tags) {
        	vals.tags = tags;
        }
        vals.data = params;
        console.log("Sending: " + JSON.stringify(vals));
        branch.link(vals, function(err, url) {
            var statusEle = document.getElementById("status");
            var urlEle = document.getElementById("url_label");
            if (!err) {
                statusEle.innerHTML = "Ok";
                url_label.innerHTML = url;
            } else {
                statusEle.innerHTML = err;
                url_label.innerHTML = err;
            }
        });
    },

    login: function() {
    	console.log("Sending login");
    	var nameEle = document.getElementById("name");
    	var name = nameEle.value;
    	if (name && name.length > 0) {
    		branch.setIdentity(name, function (err, data) {
    			var statusEle = document.getElementById("status");
				var usernameEle = document.getElementById("username");
    			if (err) {
    				console.log("Login error: " + err);
    				statusEle.innerHTML = err;
    				usernameEle.innerHTML = "";
    			} else {
    				console.log("Login successful");
    				statusEle.innerHTML = "Ok";
    				usernameEle.innerHTML = name;
    			}
    		});
    	}
    },

    logout: function() {
    	console.log("Sending logout");
		branch.logout(function (err) {
			var statusEle = document.getElementById("status");
			var usernameEle = document.getElementById("username");
			usernameEle.innerHTML = "";
			if (err) {
				console.log("Logout error: " + err);
				statusEle.innerHTML = err;
			} else {
				console.log("Logout successful");
				statusEle.innerHTML = "Ok";
			}
		});
    },

    sendEmail: function() {
        var urlEle = document.getElementById("url_label");
        var message = "Follow this link to the new app! " + urlEle.innerHTML;
        cordova.plugins.email.open(
            {
                subject: "Check out this app!",
                body: message
            });
    },

    completeAction: function() {
    	var eventEle = document.getElementById("event");
    	var statusEle = document.getElementById("status");
    	if (eventEle.value) {
            var params = {};
            var current = new Date();
            params.creation_data = current.toString();
            console.log("Sending track.");
            branch.track(eventEle.value, params, function(err, data) {
            	if (err) {
            		console.log("Track error: " + err);
            		statusEle.innerHTML = err;
            	} else {
            		console.log("Track complete.");
            		statusEle.innerHTML = "Ok";
            	}
            });
    	}
    },

    loadActions: function() {
    	var actionsEle = document.getElementById("actions");
    	var statusEle = document.getElementById("status");
        var params = {};
        var current = new Date();
        params.creation_data = current.toString();
        console.log("Sending referrals");
        branch.referrals(function(err, data) {
        	if (err) {
        		console.log("Referrals error: " + err);
        		statusEle.innerHTML = err;
        		actionsEle.innerHTML = err;
        	} else {
        		console.log("Referrals complete: " + JSON.stringify(data));
        		statusEle.innerHTML = "Ok";
        		actionsEle.innerHTML = JSON.stringify(data);
        	}
        });
    },

    createCode: function() {
    	var prefixEle = document.getElementById("prefix");
    	var amountEle = document.getElementById("amount");
    	var bucketEle = document.getElementById("bucket");
    	var locationEle = document.getElementById("location");
    	var typeEle = document.getElementById("calculation_type");
    	var expirationEle = document.getElementById("exp");
    	var codeEle = document.getElementById("code_label");
    	var statusEle = document.getElementById("status");

    	var val = {};
    	if (prefixEle.value) {
    		val.prefix = prefixEle.value;
    	}
    	if (bucketEle.value) {
    		val.bucket = bucketEle.value;
    	} else {
    		val.bucket = "default";
    	}
    	if (amountEle.value) {
    		val.amount = parseInt(amountEle.value);
    	} else {
    		val.amount = 10;
    	}
    	if (expirationEle.value) {
    		val.expiration = expirationEle.value;
    	}
    	val.calculation_type = parseInt(typeEle.value);
    	val.location = parseInt(locationEle.value);

    	console.log("Sending get code: " + JSON.stringify(val));
    	branch.getCode(val, function(err, data) {
    		if (err) {
    			console.log("Error getting code: " + err);
    			statusEle.innerHTML = err;
    			codeEle.innerHTML = err;
    		} else {
    			console.log("Get code successful: " + JSON.stringify(data));
    			statusEle.innerHTML = "Ok";
    			codeEle.innerHTML = data.referral_code;
    		}
    	});
    },

    validateCode: function() {
    	var codeEle = document.getElementById("av_code");
    	var codeStatusEle = document.getElementById("code_status_label");
    	var statusEle = document.getElementById("status");
    	var code = codeEle.value;
    	if (!code) {
    		return;
    	}
    	console.log("Sending validate code for: " + code);
    	branch.validateCode(code, function(err, data) {
    		if (err) {
    			console.log("Error validating code: " + err);
    			statusEle.innerHTML = err;
    			codeStatusEle.innerHTML = err;
    		} else {
    			console.log("Validation successful." + JSON.stringify(data));
    			statusEle.innerHTML = "Ok";
    			codeStatusEle.innerHTML = code + " is valid.";
    		}
    	});
    },

    applyCode: function() {
    	var codeEle = document.getElementById("av_code");
    	var codeStatusEle = document.getElementById("code_status_label");
    	var statusEle = document.getElementById("status");
    	var code = codeEle.value;
    	if (!code) {
    		return;
    	}
    	console.log("Sending apply code for: " + code);
    	branch.applyCode(code, function(err, data) {
    		if (err) {
    			console.log("Error applying code: " + err);
    			statusEle.innerHTML = err;
    			codeStatusEle.innerHTML = err;
    		} else {
    			console.log("Apply successful." + JSON.stringify(data));
    			statusEle.innerHTML = "Ok";
    			codeStatusEle.innerHTML = code + " applied.";
    		}
    	});
    },


    redeemRewards: function() {
    	var amountEle = document.getElementById("rewards_amount");
    	var bucketEle = document.getElementById("rewards_bucket");
    	var rewardsStatusEle = document.getElementById("rewards_status_label")
    	var statusEle = document.getElementById("status");
    	console.log("Sending redeem rewards");
    	branch.redeem(parseInt(amountEle.value), bucketEle.value, function(err, data) {
    		if (err) {
    			console.log("Error redeeming rewards: " + err);
    			statusEle.innerHTML = err;
    			rewardsStatusEle.innerHTML = err;
    		} else {
    			console.log("Redeem successful." + JSON.stringify(data));
    			statusEle.innerHTML = "Ok";
    			rewardsStatusEle.innerHTML = "Credits redeemed.";
    		}
    	});
    },


    getCredits: function() {
    	var amountEle = document.getElementById("rewards_amount");
    	var bucketEle = document.getElementById("rewards_bucket");
    	var rewardsStatusEle = document.getElementById("rewards_status_label")
    	var statusEle = document.getElementById("status");
    	console.log("Sending get credits");
    	branch.credits(function(err, data) {
    		if (err) {
    			console.log("Error getting credits: " + err);
    			statusEle.innerHTML = err;
    			rewardsStatusEle.innerHTML = err;
    		} else {
    			console.log("Get credits successful." + JSON.stringify(data));
    			statusEle.innerHTML = "Ok";
    			rewardsStatusEle.innerHTML = JSON.stringify(data);
    		}
    	});
    },


    getCreditHistory: function() {
    	var amountEle = document.getElementById("rewards_amount");
    	var bucketEle = document.getElementById("rewards_bucket");
    	var rewardsStatusEle = document.getElementById("rewards_status_label")
    	var statusEle = document.getElementById("status");
    	var values = {};
    	if (bucketEle.value) {
    		values.bucket = bucketEle.value;
    	}
    	console.log("Sending redeem rewards: " + JSON.stringify(values));
    	branch.creditHistory(values, function(err, data) {
    		if (err) {
    			console.log("Error getting history: " + err);
    			statusEle.innerHTML = err;
    			rewardsStatusEle.innerHTML = err;
    		} else {
    			console.log("Get history successful." + JSON.stringify(data));
    			statusEle.innerHTML = "Ok";
    			rewardsStatusEle.innerHTML = JSON.stringify(data);
    		}
    	});
    }
};

app.initialize();
