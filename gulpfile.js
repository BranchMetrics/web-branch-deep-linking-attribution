var gulp = require('gulp'),
	gutil = require('gulp-util'),
	rename = require('gulp-rename'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat');

gulp.task('build', function() {
	return gulp.src([ './src/json2.js', './src/branch.map.js', './src/branch.js' ])
		.pipe(concat('branch.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('./dist/'));
});

/* ----- Linting ----- */

var JSHintOptions = {
	'browser': true,

	'undef': true,
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
	'predef': [ 'console' ]
};

gulp.task('hint', function() {
	var errors = false;

	return gulp.src([ './src/*.js' ])
		.pipe(jshint(JSHintOptions))
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});
