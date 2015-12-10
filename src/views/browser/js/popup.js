/**
 * popup.js
 *
 * Implements the necessary piece of code to open popups on the screen.
 *
 */
define([], function() {
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

  const DefaultRect = {
    x: 0,
    y: 0,
    height: 0,
  };

  const DefaultMargin = {
    width: 20,
    height: 20
  };

  function Rect(rect = DefaultRect, margin = {}) {
    this.x = (rect.x || 0);
    this.y = (rect.y || 0) + (rect.height || 0);
    this.maxWidth = window.innerWidth - this.x - margin.width;
    this.maxHeight = window.innerHeight - this.y - margin.height;
  }

  Rect.prototype.toString = function() {
    return '' +
      'Rect {\n'+
      '\t x:' + this.x + '\n' +
      '\t y:' + this.y + '\n' +
      '\t width:' + this.maxWidth + '\n' +
      '\t height:' + this.maxHeight + '\n' +
      '}\n';
  }

  function calculateAnchorRect(target) {
    var rootRect = target.getBoundingClientRect();
    return rootRect;
  }

  function openPopup(options) {
    var anchorRect = calculateAnchorRect(options.anchor);
    options.rect = new Rect(anchorRect, DefaultMargin);

    var popup = openWindow(options);
    popup.classList.add('popup');
    return popup;
  }

  function openContextMenu(options) {
    var contextmenu = openWindow(options);
    contextmenu.classList.add('contextmenu');

    var data = options.data;
    contextmenu.addEventListener('mozbrowserloadend', function onLoad(e) {
      contextmenu.removeEventListener(e.type, onLoad);

      setTimeout(function() {
        contextmenu.contentWindow.postMessage({
          infos: options.data 
        }, '*');
      }, 500);
    });

    return contextmenu;
  }

  function openWindow(options) {
    var win = options.name ? document.querySelector('iframe[name="' + options.name + '"]') : null;

    // First, look for a window with the same name. Iff none, create a
    // new one.
    if (!win) {
      var container = document.createElement('div');
      container.className = 'window';

      var arrow = document.createElement('div');
      arrow.className = 'arrow';
    
      win = document.createElement('iframe');
      win.setAttribute('mozbrowser', true);
      win.setAttribute('name', options.name);
      win.setAttribute('mozpasspointerevents', 'true');
      win.setAttribute('ignoreuserfocus', 'true');
      win.setAttribute('transparent', 'true');

      container.style.maxHeight = options.rect.maxHeight + 'px';
      container.style.maxWidth = options.rect.maxWidth + 'px';
      container.style.top = options.rect.y + 'px'
      container.style.left = options.rect.x + 'px';

      container.appendChild(win);
      container.appendChild(arrow);
      document.body.appendChild(container);
    } else {
      container = win.parentNode;
    }

    win.src = options.url;
    container.contentWindow = win.contentWindow;
    return container;
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

      options.rect = new Rect(options.rect);

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
