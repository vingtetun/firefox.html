(function(global) {
  'use strict';

  function defineLazyGetter(obj, name) {
    Object.defineProperty(obj, name, {
      configurable: true,
      get: function() {
        return Object.defineProperty(obj, name, {
                __proto__: null,
                value: bridge.client(name, new BroadcastChannel(name)),
                writable: false,
                enumerable: false,
                configurable: false
              })[name];
      }
    });
  }

  var Services = {};
  defineLazyGetter(Services, 'history');
  defineLazyGetter(Services, 'tabs');

  window.Services = Services;
})(this);
