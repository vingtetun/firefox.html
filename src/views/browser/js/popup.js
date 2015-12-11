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
    browser.setAttribute('mozpasspointerevents', 'true');
    browser.setAttribute('ignoreuserfocus', 'true');
    browser.setAttribute('transparent', 'true');

    browser.addEventListener('mozbrowserscrollareachanged', this);
    browser.addEventListener('mozbrowserloadend', this);

    this.appendChild(arrow);
  };

  popupProto.handleEvent = function(e) {
    dump(e.type + '\n');

    switch (e.type) {
      case 'mozbrowserscrollareachanged':
        dump(e.detail.width + '\n');
        dump(e.detail.height + '\n');
        break;

      case 'mozbrowserloadend':
        this.browser.getContentDimensions().onsuccess = (e) => {
          dump(e.target.result.width + '\n');
          dump(e.target.result.height + '\n');

          this.style.maxHeight = (e.target.result.height + 3) + 'px';
          this.style.maxWidth = (e.target.result.width + 3) + 'px';
        };
        break;
    }
  };

  popupProto.setLocation = function(url) {
    var target = new URL(url, document.location);
    dump(target.host + ': ' + document.location.host + '\n');
    if (target.host !== document.location.host) {
      this.browser.setAttribute('mozbrowser', true);
      // XXX Should be remote for http i guess
      //this.browser.setAttribute('remote', true);
    }

    this.browser.src = url;
    this.appendChild(this.browser);
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
