import type { Branch } from './branch.js';
import { log } from '../core/context.js';
import { formatMessage, messages } from '../lib/messages.js';

/**
 * Enum for what parameters are in a wrapped Branch method
 */
export const callback_params = {
  NO_CALLBACK: 0,
  CALLBACK_ERR: 1,
  CALLBACK_ERR_DATA: 2,
};

/**
 * Enum for the initialization state of the Branch Object
 */
export const init_states = {
  NO_INIT: 0,
  INIT_PENDING: 1,
  INIT_FAILED: 2,
  INIT_SUCCEEDED: 3,
};

/**
 * Failure codes for Branch initialization
 */
export const init_state_fail_codes = {
  NO_FAILURE: 0,
  UNKNOWN_CAUSE: 1,
  OPEN_FAILED: 2,
  BFP_NOT_FOUND: 3,
  HAS_APP_FAILED: 4,
};

/***
 * @param parameters
 * @param func
 * @param init
 */
export const wrap = function (
  parameters: number,
  func: (this: Branch, done: Function, ...args: any[]) => void,
  init?: boolean,
): (this: Branch, ...args: any[]) => any {
  const r = function (...callArgs) {
    const self = this;
    let args: any[];
    let callback: Function | undefined;
    const lastArg = callArgs[callArgs.length - 1];
    if (
      parameters === callback_params.NO_CALLBACK ||
      typeof lastArg !== 'function'
    ) {
      callback = function (_err) {
        return;
      };
      args = callArgs.slice();
    } else {
      args = callArgs.slice(0, callArgs.length - 1) || [];
      callback = lastArg;
    }
    self._queue(function (next) {
      const done = function (err, data) {
        try {
          if (err && parameters === callback_params.NO_CALLBACK) {
            throw err;
          } else if (parameters === callback_params.CALLBACK_ERR) {
            callback(err);
          } else if (parameters === callback_params.CALLBACK_ERR_DATA) {
            callback(err, data);
          }
        } finally {
          // ...but we always want to call next
          next();
        }
      };
      if (!init) {
        let msg: string | undefined;
        if (self.init_state === init_states.INIT_PENDING) {
          msg = formatMessage(messages.initPending);
        } else if (self.init_state === init_states.INIT_FAILED) {
          msg = formatMessage(
            messages.initFailed,
            self.init_state_fail_code,
            self.init_state_fail_details,
          );
        } else if (
          self.init_state === init_states.NO_INIT ||
          !self.init_state
        ) {
          msg = formatMessage(messages.nonInit);
        }
        if (msg) {
          log(self._ctx, msg);
          return done(new Error(msg), null);
        }
      }
      args.unshift(done);
      func.apply(self, args);
    });
  };
  return r;
};
