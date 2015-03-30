// Karma configuration
// Generated on Sun Mar 29 2015 15:10:04 GMT-0400 (EDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: 'tests',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'mocha' ],


    // list of files / patterns to load in the browser
    files: [
      '../compiler/library/closure-library-master/closure/goog/base.js',
      { pattern: '../compiler/library/closure-library-master/closure/goog/**/*.js', included: false, served: true },
      '../src/0_config.js',
      '../src/0_queue.js',
      '../src/0_storage.js',
      '../src/0_utils.js',
      '../src/0_banner_utils.js',
      '../src/1_api.js',
      '../src/1_banner_css.js',
      '../src/1_banner_html.js',
      '../src/1_resources.js',
      '../src/2_banner.js',
      '../src/3_branch.js',
      '../src/4_initialization.js',
      '../node_modules/mocha/mocha.js',
      '../node_modules/sinon/pkg/sinon-1.13.0.js',
      'test-utils.js',
      'test-setup.js',
      '1_api.js',
      '0_utils.js',
      '0_queue.js',
      '0_storage.js',
      '3_branch.js'
    ],

//      'compiler/library/closure-library-master/closure/goog/Disposable/disposable.js',
//      'compiler/library/closure-library-master/closure/goog/Disposable/idisposable.js',
//      'compiler/library/closure-library-master/closure/goog/json/json.js',
//      'compiler/library/closure-library-master/closure/goog/**/*.js',
//      { pattern: 'compiler/library/closure-library-master/closure/goog/deps.js', included: false, served: true },



    // list of files to exclude
    exclude: [
      'src/onpage.js',
      'src/extern.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
