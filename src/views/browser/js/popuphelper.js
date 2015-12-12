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
    if (!options.usemargins) {
      options.usemargins = true;
    }

    var popup = openWindow(options);
    popup.classList.add('popup');
    return popup;
  }

  function openContextMenu(options) {
    var contextmenu = openWindow(options);
    contextmenu.classList.add('contextmenu');
    return contextmenu;
  }

  function openWindow(options) {
    var popup = null;
    if (options.name) {
      popup = document.querySelector('[name="' + options.name + '"]');
    }

    if (!popup) {
      popup = document.createElement('popup-element');
      popup.setAttribute('name', options.name);
      popup.classList.add('window');
      document.body.appendChild(popup);
      popup.setLocation(options.url);
    }

    if (options.anchor) {
      popup.attachTo(options.anchor,
                     options.type === Types.Popup);
    }

    if (options.data) {
      popup.forward(options.data);
    }

    if (options.usemargins && !popup.hasAttribute('usemargins')) {
      popup.setAttribute('usemargins', 'true');
    } else if (popup.hasAttribute('usemargins')) {
      popup.removeAttribute('usemargins');
    }

    return popup;
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
          return openPopup(options);

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
