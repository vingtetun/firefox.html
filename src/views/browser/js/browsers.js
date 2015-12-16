/**
 * browsers.js
 *
 * This is the central piece of Firefox.html.
 * Browsers controls the list of <browser>s.
 *
 * Browsers object is used to manipulate the list
 * of browser (add, remove, select, …) and be notified
 * on tab changes (events like 'select', 'add', …).
 *
 */

define(
  [
    '/src/shared/js/bridge/service.js',
    '/src/shared/js/eventemitter.js',
    'browser',
  ],
function(Bridge, EventEmitter, Browser) {

  'use strict';

  var _eventsToTrack = [
    'mozbrowseropenwindow',
    'mozbrowserloadstart',
    'mozbrowserloadend',
    'mozbrowsertitlechange',
    'mozbrowserlocationchange',
    'mozbrowsericonchange',
    'mozbrowsererror'
  ];

  let Tabs = Services.tabs;

  for (let type of _eventsToTrack) {
    window.addEventListener(type, function(e) {
      let browser = e.target.parentNode;

      if (e.type === 'mozbrowseropenwindow') {
        Tabs.method('add', {url: e.detail.url});
        return;
      }

      Tabs.method('update', {
        uuid: browser.uuid,
        title: browser.title,
        loading: browser.loading,
        url: browser.location.toString(),
        favicon: browser.favicon
      });

    });
  }

  let _browserMap = new Map();
  let _selectedBrowser = null;

  const Browsers = {
    add: function(config={}) {
      let browser = document.createElement('browser-element');
      browser.setAttribute('flex', '1');
      browser.setAttribute('uuid', config.uuid);

      let parent = document.querySelector('.iframes');
      parent.appendChild(browser);
      _browserMap.set(config.uuid, browser);

      this.emit('add', {browser: browser});

      if (config.url) {
        browser.setLocation(config.url);
      }

      if (config.select || !_selectedBrowser) {
        this.select(browser);
      } else {
        browser.hide();
      }

      return browser;
    },

    remove: function(config) {
      let browser = _browserMap.get(config.uuid);
      if (!browser) {
        throw new Error('Unknown browser');
      }

      _browserMap.delete(config.uuid);
      browser.remove();

      this.emit('remove', {browser});
    },

    select: function(config) {
      let browser = _browserMap.get(config.uuid);
      if (!browser) {
        // This is an unknow browser, let's create a new one.
        browser = this.add(config);
      }

      if (browser === _selectedBrowser) {
        // already selected
        return;
      }

      browser.willBeVisibleSoon();

      let previouslySelectedBrowser = _selectedBrowser;
      if (previouslySelectedBrowser) {
        this.emit('unselect', {browser: previouslySelectedBrowser});
      }

      _selectedBrowser = browser;

      this.emit('select', {browser});

      window.requestAnimationFrame(() => {
        if (previouslySelectedBrowser) {
          previouslySelectedBrowser.hide();
        }
        browser.show();
      });
    },

    getSelected: function() {
      return _selectedBrowser;
    }
  }

  Browsers[Symbol.iterator] = function*() {
    return  _browserMap[Symbol.iterator]();
  }

  EventEmitter.decorate(Browsers);

  function selectedBrowser() {
    return Browsers.getSelected();
  }

  Tabs.on('select', Browsers.select.bind(Browsers));
  Tabs.on('remove', Browsers.remove.bind(Browsers));

  Bridge.service('browsers')
    .method('reload', () => selectedBrowser().reload())
    .method('goBack', () => selectedBrowser().goBack())
    .method('goForward', () => selectedBrowser().goForward())
    .method('zoomIn', () => selectedBrowser().zoomIn())
    .method('zoomOut', () => selectedBrowser().zoomOut())
    .method('resetZoom', () => selectedBrowser().resetZoom())
    .method('findAll', (value) => selectedBrowser().findAll(value, 'case-insensitive'))
    .method('findForward', () => selectedBrowser().findNext('forward'))
    .method('findBackward', () => selectedBrowser().findNext('backward'))
    .method('clearMatch', () => selectedBrowser().clearMatch())
    .method('toggleDevtools', () => selectedBrowser().toggleDevtools())
    .listen(new BroadcastChannel('browsers'));

  return Browsers;
});
