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
    var arrow = this.arrow = document.createElement('div');
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

  popupProto.attachTo = function(anchor) {
    if (!anchor) {
      throw new Error('AttachTo called without an anchor');
    }

    this.anchor = anchor;
    let anchorRect = anchor.getBoundingClientRect();
    this.move({x: anchorRect.x, y: anchorRect.y + anchorRect.height});
  };

  popupProto.move = function(point = null) {
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
    this.rect.width = this.rect.width || (innerWidth - point.x);
    this.rect.height = this.rect.height || (innerHeight - point.y);

    var navbar = require('navbar');
    var viewportWithMargin = new Rect(
      10, navbar.height,
      innerWidth - 20, innerHeight - navbar.height - 10
    );
    this.rect = this.rect.translateInside(viewportWithMargin);

    this.style.top = this.rect.y + 'px'
    this.style.left = this.rect.x + 'px';
    this.style.width = this.rect.width + 'px';
    this.style.height = this.rect.height + 'px';
    this.style.maxWidth = (this.maxWidth || this.rect.width) + 'px';
    this.style.maxHeight = (this.maxHeight || this.rect.height) + 'px';

    if (this.anchor && this.arrow) {
      let anchorRect = this.anchor.getBoundingClientRect();
      let rect = new Rect(
        anchorRect.x + anchorRect.width / 2,
        anchorRect.y + anchorRect.height,
        0,
        0
      );

      let arrowRect = this.arrow.getBoundingClientRect();

      let offsetX = (rect.x - this.rect.x) - arrowRect.width / 2;
      this.arrow.style.left = Math.max(3, offsetX) + 'px';
    }
  };

  popupProto.handleEvent = function(e) {

    switch (e.type) {
      case 'mozbrowserscrollareachanged':
          this.rect.width = this.maxWidth = e.detail.width;
          this.rect.height = this.maxHeight = e.detail.height;
          this.move();
        break;

      case 'mozbrowserloadend':
        this.browser.getContentDimensions().onsuccess = (e) => {
          this.rect.width = this.maxWidth = e.target.result.width;
          this.rect.height = this.maxHeight = e.target.result.height;
          this.move();
          this.removeAttribute('hidden');
        };
        break;

      case 'resize':
        this.move();
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
      this.setAttribute('hidden', 'true');
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
