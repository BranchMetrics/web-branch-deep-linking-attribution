var Test = function() {
	this.testvar = "Hi";
};

Test.prototype['testMe'] = function() {
	console.log("Tested!");
};

console.log("ID: " + module.id);
exports.Test = Test;
exports.test_string = "I'm here!";
exports.testFunc = function(arg) {
	console.log("Arg is: " + arg);
};
