/**
 * popup.js
 *
 * Implements a web component for popups
 *
 */
define(['/src/shared/js/eventemitter.js'], function(EventEmitter) {
  'use strict';

  let popupProto = Object.create(HTMLElement.prototype);

  popupProto.createdCallback = function() {
    var arrow = document.createElement('div');
    arrow.className = 'arrow';

    // First, look for a window with the same name. Iff none, create a
    // new one.
    let browser = this.browser = document.createElement('iframe');
    browser.setAttribute('mozbrowser', true);
    browser.setAttribute('mozpasspointerevents', 'true');
    browser.setAttribute('ignoreuserfocus', 'true');
    browser.setAttribute('transparent', 'true');

    this.appendChild(browser);
    this.appendChild(arrow);
  };

  popupProto.setLocation = function(url) {
    this.browser.src = url;
  };

  popupProto.setPosition = function(rect) {
    this.style.maxHeight = rect.maxHeight + 'px';
    this.style.maxWidth = rect.maxWidth + 'px';
    this.style.top = rect.y + 'px'
    this.style.left = rect.x + 'px';
  };

  Object.defineProperty(popupProto, "contentWindow", {
    get: function() {
      return this.browser.contentWindow;
    },
    set: function(value) {}
  });

  let Popup = document.registerElement('popup-element', {prototype: popupProto});

  return Popup;
});
