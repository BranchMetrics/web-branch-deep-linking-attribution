var gulp = require('gulp'),
	gutil = require('gulp-util'),
	jshint = require('gulp-jshint'),
	jscs = require('gulp-jscs');

/* ----- Linting ----- */

var JSHintOptions = {
	'browser': true,

	'sub': true,
	// 'undef': true,
	'trailing': true,
	'curly': true,
	'bitwise': true,
	'forin': true,
	'freeze': true,
	'immed': true,
	'noarg': true,
	'nonbsp': true,
	'unused': true,
	'latedef': true,
	'scripturl': true,
	'predef': [ 'console', 'module', 'goog', 'define' ]
};

gulp.task('hint', function() {
	var errors = false;

	return gulp.src([ './src/[0-9]_*.js' ])
		.pipe(jshint(JSHintOptions))
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function() {
	return gulp.src([
		'./src/*.js'
	]).pipe(jscs());
});
