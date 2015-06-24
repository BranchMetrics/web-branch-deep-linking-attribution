console.log("Starting index.js");

var branch = require('build');

if (Ti.Platform.osname === "android") {
	// In Android, we start the branch session in onStart and close it
	// in onStop.  This should be done in every Window used in the app
	// since a Window corresponds to an Android Activity.  The
	// SDK will "smartly" handle the case where we are transitioning from
	// one activity to another and not send excess inits or close the session
	// accidentally.
	$.index.activity.onStart = function() {
		branch.init('BRANCH_KEY',
		{ "isReferrable" : true, "url": Alloy.Globals.open_url },
		function(err, data) {
			if (err != null) {
				console.log("Init error: " + JSON.stringify(err));
				Alloy.Globals.status = err.message;
			} else {
				console.log("Init sucessful: " + JSON.stringify(data));
				Alloy.Globals.status = "Ok";
			}
			Ti.App.fireEvent("branch_init");
		});
	};

	$.index.activity.onStop = function() {
		branch.close(function(err) {
			if (err) {
				console.log("Error on close: " + err);
			}
		});
	};
}

var loggedIn = false;

function sendEmail() {
	var dialog = Ti.UI.createEmailDialog();
	dialog.subject = "Check out this app!";
	dialog.messageBody = $.link_text.text;
	dialog.open();
};

function getUrl() {
	var params = {};
	var data = {};
	var current = new Date();
	params.create_date = current.toString();
	if ($.params_text.value) {
		var array = $.params_text.value.split(',');
		if (array.length > 0) {
			params.params = array;
		}
	}
	data.data = params;
	if ($.tags_text.value) {
		var array = $.tags_text.value.split(',');
		if (Array.isArray(array)) {
			console.log("Is array: " + array.length);
		} else {
			console.log("Is string: " + array);
		}
		if (array.length > 0) {
			data.tags = array;
		}
	}
	if ($.alias_text.value) {
		data.alias = $.alias_text.value;
	}
	if ($.channel_text.value) {
		data.channel = $.channel_text.value;
	}
	if ($.stage_text.value) {
		data.stage = $.stage_text.value;
	}
	data.type = parseInt($.type_picker.getSelectedRow(0).value);
	if ($.feature_picker.getSelectedRow(0).value !== "none") {
		data.feature = $.feature_picker.getSelectedRow(0).value;
	}
	console.log("Sending get url.");
	branch.link(data, function(err, url) {
		console.log("In url callback");
		if (err != null) {
			console.log("Error getting url: " + err.message);
			$.status_text.text = err.message;
			$.link_text.text = err.message;
		} else {
			console.log("Get url successful: " + url);
			$.status_text.text = "Ok";
			$.link_text.text = url;
		}
	});
};

function login(e) {
	if (!loggedIn && $.login_text.value && $.login_text.value.length > 0) {
		console.log("Sending login");
		branch.setIdentity($.login_text.value, function(err, data) {
			if (err) {
				console.log("Login error: " + err.message);
				$.status_text.text = err.message;
				loggedIn = false;
			} else {
				console.log("Login successful");
				$.status_text.text = "Ok";
				$.name_text.text = $.login_text.value;
				loggedIn = true;
			}
		});
	}
};

function logout(e) {
	if (loggedIn) {
		console.log("Sending logout");
		branch.logout(function(err) {
			if (err) {
				console.log("Logout error: " + err.message);
				$.status_text.text = err.message;
			} else {
				console.log("Logout successful.");
				$.status_text.text = "Ok";
				$.name_text.text = "";
			}
			loggedIn = false;
		});
	}
};

function doAction() {
	if ($.action_text.value && $.action_text.value.length > 0) {
            var params = {};
            var current = new Date();
            params.creation_data = current.toString();
            console.log("Sending track.");
            branch.track($.action_text.value, params, function(err, data) {
            	if (err) {
            		console.log("Track error: " + err.message);
            		$.status_text.text = err.message;
            	} else {
            		console.log("Track complete.");
            		$.status_text.text = "Ok";
            	}
            });
	}
};

function loadActions() {
        console.log("Sending referrals");
        branch.referrals(function(err, data) {
        	if (err) {
        		console.log("Referrals error: " + err.message);
        		$.status_text.text = err.message;
        		$.actions_text.text = err.message;
        	} else {
        		console.log("Referrals complete: " + JSON.stringify(data));
        		$.status_text.text = "Ok";
        		$.actions_text.text = JSON.stringify(data);
        	}
        });
};

var codeExpDate = null;

function expDateChanged(e) {
	console.log("Expiration changed to: " + e.value);
	codeExpDate = e.value;
}

function expDateClicked(e) {
	var picker = Ti.UI.createPicker({
  		type:Ti.UI.PICKER_TYPE_DATE,
  		minDate:new Date()
	});

	picker.showDatePickerDialog({
		value: new Date(2010,8,1),
  		callback: function(e) {
	    	if (e.cancel) {
    		} else {
    			codeExpDate = e.value;
    			$.exp_text.text = e.value.toString();
    		}
    	}
	});
}

function createCode(e) {
   	var val = {};

   	if ($.prefix_text.value) {
   		val.prefix = $.prefix_text.value;
   	}
   	if ($.code_bucket_text.value) {
   		val.bucket = $.code_bucket_text.value;
   	} else {
   		val.bucket = "default";
   	}
   	if ($.code_amount_text.value) {
   		val.amount = parseInt($.code_amount_text.value);
   	} else {
   		val.amount = 10;
   	}
   	if (codeExpDate) {
   		val.expiration = codeExpDate.toString();
   	}
   	val.calculation_type = parseInt($.calc_type_picker.getSelectedRow(0).value);
   	val.location = parseInt($.location_picker.getSelectedRow(0).value);

   	console.log("Sending get code: " + JSON.stringify(val));
   	branch.getCode(val, function(err, data) {
   		if (err) {
   			console.log("Error getting code: " + err.message);
   			$.status_text.text = err.message;
   			$.code_text.text = err.message;
   		} else {
   			console.log("Get code successful: " + JSON.stringify(data));
   			$.status_text.text = "Ok";
   			$.code_text.text = data.referral_code;
   		}
   	});
};

function validateCode() {
	code = $.code_entry.value;
	if (code) {
	   	console.log("Sending validate code for: " + code);
   		branch.validateCode(code, function(err, data) {
   			if (err) {
   				console.log("Error validating code: " + err.message);
   				$.status_text.text = err.message;
   				$.code_status_text.text = err.message;
	   		} else {
   				console.log("Validation successful." + JSON.stringify(data));
   				$.status_text.text = "Ok";
   				$.code_status_text.text = code + " is valid.";
   			}
   		});
	}
};

function applyCode() {
	var code = $.code_entry.value;
	if (code) {
	   	console.log("Sending apply code for: " + code);
   		branch.applyCode(code, function(err, data) {
   			if (err) {
   				console.log("Error applying code: " + err.message);
   				$.status_text.text = err.message;
   				$.code_status_text.text = err.message;
   			} else {
   				console.log("Apply successful." + JSON.stringify(data));
   				$.status_text.text = "Ok";
   				$.code_status_text.text = code + " applied.";
   			}
   		});
	}
};

function redeem(e) {
   	console.log("Sending redeem rewards");
   	branch.redeem(parseInt($.cr_amount_text.value), $.cr_bucket_text.value, function(err, data) {
   		if (err) {
   			console.log("Error redeeming rewards: " + err.message);
   			$.status_text.text = err.message;
   			$.credit_text.text = err.message;
   		} else {
   			console.log("Redeem successful." + JSON.stringify(data));
   			$.status_text.text = "Ok";
   			$.credit_text.text = "Credits redeemed.";
   		}
   	});
};

function getCreditCounts(e) {
   	console.log("Sending get credits");
   	branch.credits(function(err, data) {
   		if (err) {
   			console.log("Error getting credits: " + err.message);
   			$.status_text.text = err.message;
   			$.credit_text.text = err.message;
   		} else {
   			console.log("Get credits successful." + JSON.stringify(data));
   			$.status_text.text = "Ok";
   			$.credit_text.text = JSON.stringify(data);
   		}
   	});
};

function getCreditHistory(e) {
   	var values = {};
   	if ($.cr_bucket_text.value) {
   		values.bucket = $.cr_bucket_text.value;
   	}
   	console.log("Sending get credit history: " + JSON.stringify(values));
   	branch.creditHistory(values, function(err, data) {
   		if (err) {
   			console.log("Error getting history: " + err.message);
   			$.status_text.text = err.message;
   			$.credit_text.text = err.message;
   		} else {
   			console.log("Get history successful." + JSON.stringify(data));
   			$.status_text.text = "Ok";
   			$.credit_text.text = JSON.stringify(data);
   		}
   	});
};

$.status_text.text = Alloy.Globals.status;

// This event fires when init completes to update the status.
Ti.App.addEventListener("branch_init", function(e) {
	console.log("branch_init fired");
	$.status_text.text = Alloy.Globals.status;
	branch.first(function(err, data) {
		$.first_text.text = data ? JSON.stringify(data) : "null";
	});
	branch.data(function(err, data) {
		$.latest_text.text = data ? JSON.stringify(data) : "null";
	});
});

$.index.open();
