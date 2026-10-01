/**
 * Array.prototype.includes polyfill, installed on the host page as a
 * non-enumerable property only when the browser lacks a native one.
 */

if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    configurable: true,
    writable: true,
    value: function (searchElement, fromIndex) {
      var array = this;
      if (array instanceof String) {
        array = String(array);
      }
      var len = array.length;
      var i = fromIndex || 0;
      if (i < 0) {
        i = Math.max(i + len, 0);
      }
      for (; i < len; i++) {
        var element = array[i];
        if (element === searchElement || Object.is(element, searchElement)) {
          return true;
        }
      }
      return false;
    },
  });
}
