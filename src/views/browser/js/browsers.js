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
    'browser',
  ],
function(Bridge, Browser) {

  'use strict';

  var _eventsToTrack = [
    'mozbrowseropenwindow',
    'mozbrowseropentab',
    'mozbrowserloadstart',
    'mozbrowserloadend',
    'mozbrowsertitlechange',
    'mozbrowserlocationchange',
    'mozbrowsericonchange',
    'mozbrowsererror'
  ];

  let service;
  let Tabs = Services.tabs;

  for (let type of _eventsToTrack) {
    window.addEventListener(type, function(e) {
      let browser = e.target.parentNode;

      if (e.type === 'mozbrowseropenwindow') {
        Tabs.method('add', {select: true, url: e.detail.url});
        return;
      }

      if (e.type === 'mozbrowseropentab') {
        Tabs.method('add', {select: false, url: e.detail.url});
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

      // Make sure to not keep turning on/off processes
      // if the user is navigating into tabs with a 
      // shortcut very quickly.
      clearTimeout(this.selectTimeout);
      this.selectTimeout = setTimeout(() => {
        let previouslySelectedBrowser = _selectedBrowser;
        if (previouslySelectedBrowser) {
          previouslySelectedBrowser.hide();
        };

        _selectedBrowser = browser;
        _selectedBrowser.show();

        service.broadcast('select');
      }, 150);
    },

    getSelected: function() {
      return _selectedBrowser;
    }
  }

  Browsers[Symbol.iterator] = function*() {
    return  _browserMap[Symbol.iterator]();
  }

  function selectedBrowser() {
    return Browsers.getSelected();
  }

  Tabs.on('select', Browsers.select.bind(Browsers));
  Tabs.on('remove', Browsers.remove.bind(Browsers));

  service = Bridge.service('browsers')
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
