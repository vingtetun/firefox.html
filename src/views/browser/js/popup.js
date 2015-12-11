/**
 * popup.js
 *
 * Implements a web component for popups
 *
 */
define(['rect'], function(Rect) {
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

    window.addEventListener('resize', this);
    let PopupHelper = require('popuphelper');
    this.addEventListener('click', PopupHelper.close.bind(PopupHelper, this));
    window.addEventListener('click', this);

    browser.addEventListener('mozbrowserscrollareachanged', this);
    browser.addEventListener('mozbrowserloadend', this);


    this.appendChild(arrow);
    this.rect = new Rect(0, 0, innerWidth, innerHeight);
  };

  popupProto.setPosition = function(point) {
    this._updatePosition(point);
  };

  popupProto.attachTo = function(anchor) {
    if (!anchor) {
      throw new Error('AttachTo called without an anchor');
    }

    this.anchor = anchor;
    let anchorRect = anchor.getBoundingClientRect();
    this._updatePosition({x: anchorRect.x, y: anchorRect.y + anchorRect.height});
  };

  popupProto._updatePosition = function(point = null) {
    if (!point) {
      point = {};

      if (this.anchor) {
        let anchorRect = this.anchor.getBoundingClientRect();
        point.x = anchorRect.x;
        point.y = anchorRect.y + anchorRect.height;
      } else {
        point.x = this.rect.x;
        point.x = this.rect.y;
      }
    }

    this.rect.x = point.x;
    this.rect.y = point.y;
    this.rect.width = innerWidth - point.x;
    this.rect.height = innerHeight - point.y;

    var navbar = require('navbar');
    var viewportWithMargin =
      new Rect(20, navbar.height, innerWidth - 40, innerHeight - 50);
    this.rect = this.rect.translateInside(viewportWithMargin);

    this.style.top = this.rect.y + 'px'
    this.style.left = this.rect.x + 'px';
    this.style.width = this.rect.width + 'px';
    this.style.height = this.rect.height + 'px';
    this.style.maxWidth = (this.maxWidth || this.rect.width) + 'px';
    this.style.maxHeight = (this.maxHeight || this.rect.height) + 'px';
  };

  popupProto.handleEvent = function(e) {

    switch (e.type) {
      case 'mozbrowserscrollareachanged':
        break;

      case 'mozbrowserloadend':
        this.browser.getContentDimensions().onsuccess = (e) => {
          // Why +3 ??? Should be some css thingy.
          this.maxWidth = e.target.result.width + 3;
          this.maxHeight = e.target.result.width + 3;
          this._updatePosition();
        };
        break;

      case 'resize':
        this._updatePosition();
        break;

      case 'click':
        if (e.button === 0) {
          require('popuphelper').close(this);
        }
        break;
    }
  };

  popupProto.setLocation = function(url) {
    var target = new URL(url, document.location);
    if (target.host !== document.location.host) {
      this.browser.setAttribute('mozbrowser', true);
      // XXX Should be remote for http i guess
      //this.browser.setAttribute('remote', true);
    }

    this.browser.src = url;
    this.appendChild(this.browser);
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
