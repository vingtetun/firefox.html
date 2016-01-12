/**
 * browser.js
 *
 * browser implements the <browser> element. It's a wrapper
 * around a <iframe mozbrowser>.
 *
 */

define([
  '/src/shared/js/urlhelper.js',
  '/src/shared/js/content-scripts.js',
], function(UrlHelper, ContentScripts) {
  'use strict';

  const Tabs = Services.tabs;
  const History = Services.history;
  const Browsers = Services.browsers;

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const BROADCAST_UPDATES_DELAY = 100;

  const IFRAME_EVENTS = [
    'mozbrowserasyncscroll'
    , 'mozbrowserclose'
    , 'mozbrowsercontextmenu'
    , 'mozbrowsererror'
    , 'mozbrowsericonchange'
    , 'mozbrowserloadend'
    , 'mozbrowserloadstart'
    , 'mozbrowserlocationchange'
    , 'mozbrowseropentab'
    , 'mozbrowseropenwindow'
    , 'mozbrowsersecuritychange'
    , 'mozbrowsershowmodalprompt'
    , 'mozbrowsertitlechange'
    , 'mozbrowserusernameandpasswordrequired'
    , 'mozbrowsercontextmenu'
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

  function getTemplate() {
    let template = document.getElementById('browser-template');
    return document.importNode(template.content, true);
  }


  /**
   * <browser-element> Impl
   */
  let browserProto = Object.create(HTMLElement.prototype);

  browserProto.createdCallback = function() {
    this._zoom = 1;
    this._prepareContent();
    this._clearBrowserData();
  };

  browserProto.attachedCallback = function() {
  };

  browserProto.detachedCallback = function() {
  };

  /*
   * <browser-element> Properties
   */

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
      return this._frameElement ? this._frameElement.src : '';
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

  browserProto.userInput = '';

  browserProto.setLocation = function(url) {
    if (!this._frameElement) {
      this._createFrameElement(INPROCESS_URLS.indexOf(url) == -1);
    }

    this._frameElement.src = url;
    this.maybeInjectScripts(url);
  };

  browserProto.show = function() {
    this._frameElement && this._frameElement.setVisible(true);
    this._frameElement && this._frameElement.setActive(true);
    this.removeAttribute('hidden');
    this.focus();
  };

  browserProto.hide = function() {
    this._frameElement && this._frameElement.setVisible(false);
    this._frameElement && this._frameElement.setActive(false);
    this.setAttribute('hidden', 'true');
    this.blur();
  };

  browserProto._prepareContent = function() {
    // Ideally it would be nice to do:
    // let shadow = this.createShadowRoot();
    // But adding the mozbrowser iframe as an element of the shadow
    // root prevent it to be focused and as a result, it will not
    // receive key events. So let's use normal dom for now :/
    let shadow = this;
    shadow.appendChild(getTemplate());

    let navbar = shadow.querySelector('.navbar');
    let urlbar = navbar.querySelector('.urlbar');
    let urlinput = navbar.querySelector('.urlinput');
    let backButton = navbar.querySelector('.back-button')
    let forwardButton = navbar.querySelector('.forward-button')
    let reloadButton = navbar.querySelector('.reload-button');
    let stopButton = navbar.querySelector('.stop-button');

    backButton.onclick = () => this.goBack();
    forwardButton.onclick = () => this.goForward();
    reloadButton.onclick = () => this.reload();
    stopButton.onclick = () => this.stop();

    urlinput.addEventListener('focus', () => {
      urlinput.select();
      urlbar.classList.add('focus');
    })

    urlinput.addEventListener('blur', () => {
      if (hasResultWindow) {
        Services.popups.method('close', { id: 'places' });
        hasResultWindow = false;
      }

      urlbar.classList.remove('focus');
    })

  browserProto.maybeInjectScripts = function(url) {
    let script = ContentScripts.get(url);
    if (!script) {
      return;
    }

    let frame = this._frameElement;
    frame.addEventListener('mozbrowserlocationchange', function f(e) {
      frame.removeEventListener(e.type, f);
      let req = frame.executeScript(script, {url: url});
      req.onsuccess = function(rv) {
        dump('ExecuteScript succes: ' + req.result + '\n');
      };

      req.onerror = function(code) {
        dump('ExecuteScript failure: ' + req.result + '\n');
      };
    });
  };

  urlinput.addEventListener('keypress', (e) => {
    if (e.keyCode == 13) {
      UrlInputValidated()
    }

    if (hasResultWindow && (
        e.keyCode === 9 ||
        e.keyCode === 38 ||
        e.keyCode === 40)) {
      Services.popups.method('update', { id: 'places', data: { keycode: e.keyCode } });
      e.preventDefault();
    }
  });

  window.addEventListener('message', function(e) {
    if (e.data && e.data.selected_value) {
      urlinput.value = e.data.selected_value;
    }
  });

  urlinput.addEventListener('input', () => {
    this.userInput = urlinput.value;
    UrlInputChanged();
  });

  Services.service('urlbar')
    .method('focus', () => {
      urlinput.focus();
      urlinput.select();
    })
    .listen(new BroadcastChannel('urlbar'));

  var hasResultWindow = false;
  function UrlInputChanged() {
    let text = urlinput.value;
    if (text === '') {
      if (hasResultWindow) {
        Services.popups.method('close', { id: 'places' });
        hasResultWindow = false;
      }
      return;
    }

    if (hasResultWindow) {
      Services.popups.method('update', { id: 'places', data: { value: text } });
    } else {
      let rect = navbar.getBoundingClientRect();
      Services.popups.method('openPanel', {
        url: '/src/views/places/index.html',
        id: 'places',
        name: 'places',
        anchor: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        data: { value: text }
      });
      hasResultWindow = true;
    }
  }

  let browser = this;
  function UrlInputValidated() {
    if (hasResultWindow) {
      Services.popups.method('close', { id: 'places' });
      hasResultWindow = false;
    }

    let text = urlinput.value;
    let url = PreprocessUrlInput(text);
    browser.setLocation(url);
    browser.focus();
  }

  let events = [
    'mozbrowserloadstart',
    'mozbrowserloadend',
    'mozbrowserlocationchange',
    'mozbrowsererror',
    'mozbrowsersecuritychange',
  ];
  events.forEach((name) => {
    browser.addEventListener(name, UpdateTab);
  });

  function OnTabSelected(config) {
    if (config.uuid !== browser.uuid) {
      return;
    }

    if (!browser.location) {
      urlinput.focus();
      urlinput.select();
    }
    UpdateTab();
  }

  OnTabSelected(browser);
  Browsers.on('select', OnTabSelected);

  function UpdateTab() {
    if (browser.loading) {
      navbar.classList.add('loading');
    } else {
      navbar.classList.remove('loading');
    }

    if (browser.userInput) {
      urlinput.value = browser.userInput;
    } else if (browser.location) {
      urlinput.value = UrlHelper.trim(browser.location);
    } else {
      urlinput.value = '';
    }

    if (browser.securityState == 'secure') {
      navbar.classList.add('ssl');
      navbar.classList.toggle('sslev', browser.securityExtendedValidation);
    } else {
      navbar.classList.remove('ssl');
      navbar.classList.remove('sslev');
    }

    browser.canGoBack().then(canGoBack => {
      backButton.classList.toggle('disabled', !canGoBack);
    });

    browser.canGoForward().then(canGoForward => {
      forwardButton.classList.toggle('disabled', !canGoForward);
    });
  };


  function PreprocessUrlInput(input) {
    if (UrlHelper.isNotURL(input)) {
      let urlTemplate = 'https://search.yahoo.com/search?p={searchTerms}';
      return urlTemplate.replace('{searchTerms}', encodeURIComponent(input));
    }

    if (!UrlHelper.hasScheme(input)) {
      input = 'http://' + input;
    }

    return input;
  };




  };

  browserProto._createFrameElement = function(remote) {
    let frameElement = document.createElement('iframe');
    frameElement.className = 'browser';
    frameElement.setAttribute('mozbrowser', 'true');
    frameElement.setAttribute('flex', '1');
    frameElement.setAttribute('remote', remote);
    frameElement.setAttribute('mozallowfullscreen', 'true');
    this.querySelector('.iframes').appendChild(frameElement);

    for (let eventName of IFRAME_EVENTS) {
      frameElement.addEventListener(eventName, this);
    }

    this._frameElement = frameElement;
    this._applyZoom();
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

  browserProto.methodCheck = function(name, args) {
    this._frameElement &&
    this._frameElement[name] &&
    this._frameElement[name].apply(this._frameElement, args || []);
  };

  browserProto._applyZoom = function() {
    this.methodCheck('zoom', [this._zoom]);
  };

  browserProto.reload = function() {
    this.methodCheck('reload');
  };

  browserProto.stop = function() {
    this.methodCheck('stop');
  };

  browserProto.goBack = function() {
    this.methodCheck('goBack');
  };

  browserProto.findAll = function(str, caseSensitive) {
    this.methodCheck('findAll', [str, caseSensitive]);
  };

  browserProto.findNext = function(str, direction) {
    this.methodCheck('findNext', [str, direction]);
  };

  browserProto.clearMatch = function() {
    this.methodCheck('clearMatch');
  };

  browserProto.goForward = function() {
    this.methodCheck('goForward');
  };

  browserProto.focus = function() {
    this.methodCheck('focus');
  };

  browserProto.blur = function() {
    this.methodCheck('blur');
  };


  browserProto.canGoBack = function() {
    if (!this._frameElement) {
      return Promise.resolve(false);
    }

    return this._frameElement.getCanGoBack();
  };

  browserProto.canGoForward = function() {
    if (!this._frameElement) {
      return Promise.resolve(false);
    }

    return this._frameElement.getCanGoForward();
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
    tools.target = this._frameElement;
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

  browserProto.handleEvent = function(e) {
    switch (e.type) {
      case 'mozbrowseropenwindow':
        Tabs.method('add', {select: true, url: e.detail.url});
        break;
      case 'mozbrowseropentab':
        Tabs.method('add', {select: false, url: e.detail.url});
        break;
      case 'mozbrowserloadstart':
        this._clearBrowserData();
        this._loading = true;
        break;
      case 'mozbrowserloadend':
        this._loading = false;
        break;
      case 'mozbrowsertitlechange':
        this._title = e.detail;
        History.method('updateTitle', this._location, this._title);
        break;
      case 'mozbrowserlocationchange':
        this.userInput = '';
        this._location = e.detail;
        History.method('update', this._location);
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
        Services.popups.method('openContextMenu', {
          data: JSON.parse(JSON.stringify(e.detail))
        });

        e.preventDefault();
        break;
      default:
        break;
    }

    // Coalesce the update events.
    clearTimeout(this._selectTimeout);
    this._selectTimeout = setTimeout(() => {
      Tabs.method('update', {
        uuid: this.uuid,
        title: this.title,
        loading: this.loading,
        url: this.location,
        favicon: this.favicon
      });
    }, BROADCAST_UPDATES_DELAY);
  };

  return document.registerElement('browser-element', {prototype: browserProto});
});
