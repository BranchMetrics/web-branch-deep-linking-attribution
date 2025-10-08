'use strict';
goog.provide('Logger');
// jscs:disable validateIndentation
/**
 * @constructor
 */

Logger = function() {
  /**
   * @private
   * @type {string}
   */
  this.level_ = 'error';
  this.levelsOrdered = [ 'verbose', 'info', 'warn', 'error', 'none' ];
};

/**
 * Sets the logging level.
 * @param {string} level - The logging level to set.
 */
Logger.prototype.setLevel = function(level) {
  if (this.levelsOrdered.indexOf(level) !== -1) {
    this.level_ = level;
  }
  else {
    console.error(`Invalid log level: ${level}`);
  }
};

/**
 * Logs a message to the console if the log level allows it.
 * @param {string} level - The logging level of the message.
 * @param {...*} args - The message to log.
 */
Logger.prototype.log = function(level) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (this.shouldLog(level)) {
    switch (level) {
      case 'info':
        this.logInfo_(args);
        break;
      case 'warn':
        this.logWarning_(args);
        break;
      case 'error':
        this.logError_(args);
        break;
    }
  }
};

/**
 * Checks if a message with the given level should be logged.
 * @private
 * @param {string} level - The logging level of the message.
 * @return {boolean} True if the message should be logged, false otherwise.
 */
Logger.prototype.shouldLog = function(level) {
  if (this.level_ === 'none') {
    return false;
  }
  let currentLevelIndex = this.levelsOrdered.indexOf(this.level_);
  let logLevelIndex = this.levelsOrdered.indexOf(level);
  return logLevelIndex >= currentLevelIndex;
};

/**
 * Logs an info message to the console.
 * @private
 * @param {Array} args - The message to log.
 */
Logger.prototype.logInfo_ = function(args) {
  console.info.apply(console, args);
};

/**
 * Logs a warning message to the console.
 * @private
 * @param {Array} args - The message to log.
 */
Logger.prototype.logWarning_ = function(args) {
  console.warn.apply(console, args);
};

/**
 * Logs an error message to the console.
 * @private
 * @param {Array} args - The message to log.
 */
Logger.prototype.logError_ = function(args) {
  console.error.apply(console, args);
};
// jscs:enable validateIndentation

