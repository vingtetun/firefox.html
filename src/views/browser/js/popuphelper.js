/**
 * popuphelper.js
 *
 * Implements the necessary piece of code to open popups on the screen.
 *
 */
define(['popup'], function() {
  'use strict';

  const Types = {
    Window: 0,
    ContextMenu: 1,
    Popup: 2
  };

  const Errors = {
    NoParameters: 'No parameters',
    NoURL: 'Needs a target url',
    NoTarget: 'Needs a target',
    UnknowType: 'Unknow type'
  };

  function ErrorMessage(str) {
    throw new Error('PopupHelper: ' + str);
  }

  function openPopup(options) {
    var popup = openWindow(options);
    popup.attachTo(options.anchor);
    popup.classList.add('popup');
    return popup;
  }

  function openContextMenu(options) {
    var contextmenu = openWindow(options);
    contextmenu.classList.add('contextmenu');

    options.anchor = {
      getBoundingClientRect: function() {
        return {
          x: options.x,
          y: options.y,
          width: 0,
          height: 0
        }
      }
    };

    contextmenu.attachTo(options.anchor);

    contextmenu.loaded.then(function() {
      contextmenu.contentWindow.postMessage({
        infos: options.data
      }, '*');
    });

    return contextmenu;
  }

  function openWindow(options) {
    var popup = null;
    if (options.name) {
      popup = document.querySelector('[name="' + options.name + '"]');
    }

    if (!popup) {
      popup = document.createElement('popup-element');
      popup.classList.add('window');
    }

    popup.setLocation(options.url);
    return document.body.appendChild(popup);
  }

  var PopupHelper = {
    open: function(options) {
      if (!options) {
        return ErrorMessage(Errors.NoParameters);
      }

      if (!options.url) {
        return ErrorMessage(Errors.NoURL);
      }

      if (!options.name) {
        options.name = '';
      }

      if (!options.type) {
        options.type = Types.Window;
      }

      switch (options.type) {
        case Types.Window:
          return openWindow(options);

        case Types.ContextMenu:
          return openContextMenu(options);

        case Types.Popup:
          return options.anchor ? openPopup(options)
                                : openWindow(options);

        default:
          return ErrorMessage(Errors.UnknowType + ' (' + options.type + ')');
      }

      return null;
    },

    close: function(target) {
      if (!target) {
        return ErrorMessage(Errors.NoTarget);
      }

      target.remove();
    }
  };

  for (let type in Types) {
    PopupHelper[type] = Types[type];
  }

  return PopupHelper;
});
