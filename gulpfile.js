var gulp = require('gulp'),
	gutil = require('gulp-util'),
	jshint = require('gulp-jshint'),
	through = require('through'),
	jscs = require('gulp-jscs');

/* ----- Linting ----- */

var JSHintOptions = {
	'browser': true,

	'sub': true,
	'undef': true,
	'trailing': true,
	'curly': true,
	'bitwise': false,
	'forin': true,
	'freeze': true,
	'immed': true,
	'noarg': true,
	'nonbsp': true,
	'unused': true,
	'latedef': true,
	'scripturl': true,
	'predef': [ 'console', 'module', 'goog', 'define', 'ActiveXObject' ]
};

gulp.task('hint', function() {
	var errors = false;

	return gulp.src([ './src/[0-9]_*.js' ])
		.pipe(through(function(data) {
			var file = String(data.contents);
			file = file.replace(/goog.provide\('(.*)'\);?/g, function(a, b) { return '/* exported ' + b + ' */ var ' + b + ';'; });
			file = file.replace(/goog.require\('(.*)'\);?/g, function(a, b) { return '/* global ' + b + ': false */'; });
			data.contents = new Buffer(file);
			this.queue(data);
		}))
		.pipe(jshint(JSHintOptions))
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function() {
	return gulp.src([
		'./src/*.js'
	]).pipe(jscs());
});

gulp.task('check', [ 'hint', 'jscs' ]);
