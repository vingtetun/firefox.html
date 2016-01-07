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

  [
    'debug',
    'history',
    'tabs',
    'browsers',
    'suggestions',
    'shortcuts',
    'find',
    'urlbar'
  ].forEach(name => defineLazyGetter(Services, name));

  // Globally listen for key events.
  global.addEventListener('keypress', e => {
    let activeElement = document.activeElement;
    if (!activeElement || activeElement.contentDocument) {
      return;
    }

    // Reading key/keyCode may throw some security errors.
    let key;
    try {
      e.key;
      e.keyCode;
    } catch(e) {
      return;
    }

    Services.shortcuts.method('on', {
      key: e.key,
      keyCode: e.keyCode,
      ctrlKey: e.getModifierState('Control'),
      shiftKey: e.getModifierState('Shift'),
      metaKey: e.getModifierState('Meta'),
      altKey: e.getModifierState('Alt'),
    });
  });

  Services.service = bridge.service;

  global.Services = Services;
})(this);
