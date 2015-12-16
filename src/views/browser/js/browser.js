/**
 * browser.js
 *
 * browser implements the <browser> element. It's a wrapper
 * around a <iframe mozbrowser>.
 *
 */

define(['popuphelper'], function(PopupHelper) {

  'use strict';

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;

  const IFRAME_EVENTS = [
    'mozbrowserasyncscroll', 'mozbrowserclose', 'mozbrowsercontextmenu',
    'mozbrowsererror', 'mozbrowsericonchange', 'mozbrowserloadend',
    'mozbrowserloadstart', 'mozbrowserlocationchange', 'mozbrowseropenwindow',
    'mozbrowsersecuritychange', 'mozbrowsershowmodalprompt', 'mozbrowsertitlechange',
    'mozbrowserusernameandpasswordrequired', 'mozbrowsercontextmenu'
  ];

  // Non-Remote iframes may steal the focus :/
  const INPROCESS_URLS = [
      'about:addons',
    , 'about:config'
    , 'about:cache'
    , 'about:crashes',
    , 'about:debugging'
    , 'about:downloads'
    , 'about:healthreport'
    , 'about:networking'
    , 'about:newtab'
    , 'about:performance'
    , 'about:plugins'
    , 'about:preferences'
    , 'about:sharing'
    , 'about:support'
    , 'about:telemetry'
    , 'about:webrtc'
    , 'about:devtools-panel'
  ];

  let browserProto = Object.create(HTMLElement.prototype);

  browserProto.setLocation = function(url) {
    if (!this._innerIframe) {
      this._createInnerIframe(INPROCESS_URLS.indexOf(url) == -1);
    }

    this._innerIframe.src = url;
  };

  browserProto.show = function() {
    this.removeAttribute('hidden');
    if (this._innerIframe && this._innerIframe.setVisible) {
      this._innerIframe.setVisible(true);
    }
  };

  browserProto.hide = function() {
    this.setAttribute('hidden', 'true');
    if (this._innerIframe && this._innerIframe.setVisible) {
      this._innerIframe.setVisible(false);
    }
  };

  browserProto.createdCallback = function() {
    this._zoom = 1;
    this._clearBrowserData();
  };

  browserProto._createInnerIframe = function(remote) {
    let iframe = document.createElement('iframe');
    iframe.className = 'browser';
    iframe.setAttribute('mozbrowser', 'true');
    iframe.setAttribute('flex', '1');
    iframe.setAttribute('remote', remote);
    iframe.setAttribute('mozallowfullscreen', 'true');
    this.appendChild(iframe);
    for (let eventName of IFRAME_EVENTS) {
      iframe.addEventListener(eventName, this);
    }
    this._innerIframe = iframe;
    this._applyZoom();
  };

  browserProto.attachedCallback = function() {
  };

  browserProto.detachedCallback = function() {
    if (this._innerIframe) {
      for (let eventName of IFRAME_EVENTS) {
        this._innerIframe.removeEventListener(eventName, this);
      }
    }
  };

  browserProto.zoomIn = function() {
    this._zoom += 0.1;
    this._zoom = Math.min(MAX_ZOOM, this._zoom);
    this._applyZoom();
  };

  browserProto.zoomOut = function() {
    this._zoom -= 0.1;
    this._zoom = Math.max(MIN_ZOOM, this._zoom);
    this._applyZoom();
  };

  browserProto.resetZoom = function() {
    this._zoom = 1;
    this._applyZoom();
  };

  browserProto._applyZoom = function() {
    if (this._innerIframe && this._innerIframe.zoom) {
      this._innerIframe.zoom(this._zoom);
    }
  };

  browserProto.reload = function() {
    if (this._innerIframe) this._innerIframe.reload();
  };

  browserProto.stop = function() {
    if (this._innerIframe) this._innerIframe.stop();
  };

  browserProto.goBack = function() {
    if (this._innerIframe) this._innerIframe.goBack();
  };

  browserProto.findAll = function(str, caseSensitive) {
    if (this._innerIframe) {
      this._innerIframe.findAll(str, caseSensitive);
    }
  };

  browserProto.findNext = function(str, direction) {
    if (this._innerIframe) {
      this._innerIframe.findNext(str, direction);
    }
  };

  browserProto.clearMatch = function() {
    if (this._innerIframe) {
      this._innerIframe.clearMatch();
    }
  };


  browserProto.goForward = function() {
    if (this._innerIframe) this._innerIframe.goForward();
  };

  browserProto.toggleDevtools = function() {
    if (this.tools) {
      this.tools.remove();
      this.tools = null;
      return;
    }
    let tools = this.tools = document.createElement('iframe');
    tools.setAttribute('mozbrowser', 'true');
    tools.setAttribute('flex', '1');
    tools.setAttribute('src', 'about:devtools-panel');
    tools.setAttribute('style', 'visibility:hidden');
    tools.target = this._innerIframe;
    this.appendChild(tools);
  };

  browserProto._clearBrowserData = function() {
    this._loading = false;
    this._title = '';
    this._location = '';
    this._favicon = '';
    this._securityState = 'insecure';
    this._securityExtendedValidation = false;
  };

  Object.defineProperty(browserProto, 'loading', {
    get: function() {
      return this._loading;
    }
  });

  Object.defineProperty(browserProto, 'uuid', {
    get: function() {
      return this.getAttribute('uuid');
    }
  });

  Object.defineProperty(browserProto, 'title', {
    get: function() {
      return this._title;
    }
  });

  Object.defineProperty(browserProto, 'location', {
    get: function() {
      return this._location;
    }
  });

  Object.defineProperty(browserProto, 'favicon', {
    get: function() {
      return this._favicon;
    }
  });

  Object.defineProperty(browserProto, 'securityState', {
    get: function() {
      return this._securityState;
    }
  });

  Object.defineProperty(browserProto, 'securityExtendedValidation', {
    get: function() {
      return this._securityExtendedValidation;
    }
  });

  browserProto.canGoBack = function() {
    return new Promise((resolve, reject) => {
      if (!this._innerIframe) {
        return resolve(false);
      }
      this._innerIframe.getCanGoBack().onsuccess = r => {
        return resolve(r.target.result);
      };
    });
  };

  browserProto.canGoForward = function() {
    return new Promise((resolve, reject) => {
      if (!this._innerIframe) {
        return resolve(false);
      }
      this._innerIframe.getCanGoForward().onsuccess = r => {
        return resolve(r.target.result);
      };
    });
  };

  browserProto.focus = function() {
    if (this._innerIframe) {
      this._innerIframe.focus();
    }
  };

  browserProto.isMozBrowser = function() {
    if (this._innerIframe && this._innerIframe.setVisible) {
      return true;
    }

    return false;
  };

  browserProto.userInput = '';

  browserProto.handleEvent = function(e) {
    let somethingChanged = true;

    switch (e.type) {
      case 'mozbrowserloadstart':
        this._clearBrowserData();
        this._loading = true;
        break;
      case 'mozbrowserloadend':
        this._loading = false;
        break;
      case 'mozbrowsertitlechange':
        this._title = e.detail;
        Services.history.method('updateTitle', this._location, this._title);
        break;
      case 'mozbrowserlocationchange':
        this.userInput = '';
        this._location = e.detail;
        Services.history.method('update', this._location);
        break;
      case 'mozbrowsericonchange':
        this._favicon = e.detail.href;
        break;
      case 'mozbrowsererror':
        this._loading = false;
        break;
      case 'mozbrowsersecuritychange':
        this._securityState = e.detail.state;
        this._securityExtendedValidation = e.detail.extendedValidation;
        break;
      case 'mozbrowsercontextmenu':
        PopupHelper.open({
          url: '/src/views/contextmenu/index.html',
          name: 'contextmenu',
          type: PopupHelper.ContextMenu,
          data: JSON.parse(JSON.stringify(e.detail))
        });
        e.preventDefault();
        break;
      default:
        somethingChanged = false;
    }
  };

  let Browser = document.registerElement('browser-element', {prototype: browserProto});

  /*
  PopupHelper.open({
    url: 'http://google.fr',
    type: PopupHelper.Popup,
    anchor: document.querySelector('.reload-button')
  });
  */

  return Browser;
});
