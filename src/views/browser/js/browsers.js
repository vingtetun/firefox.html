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
    'browser',
  ],
function(Browser) {

  'use strict';

  let service;
  let _browserMap = new Map();
  let _selectedBrowser = null;

  const Browsers = {
    add: function(config={}) {
      let browser = document.createElement('browser-element');
      browser.setAttribute('flex', '1');
      browser.setAttribute('uuid', config.uuid);

      let parent = document.querySelector('#outervbox');
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
        return;
      }

      if (browser === _selectedBrowser) {
        // already selected
        return;
      }

      requestAnimationFrame(() => {
        let previouslySelectedBrowser = _selectedBrowser;

        _selectedBrowser = browser;
        _selectedBrowser.show();

        if (previouslySelectedBrowser) {
          requestAnimationFrame(() => {
            previouslySelectedBrowser.hide();
            service.broadcast('select', config);
          });
        } else {
          service.broadcast('select', config);
        }
      });
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

  let Tabs = Services.tabs;
  Tabs.on('add', Browsers.add.bind(Browsers));
  Tabs.on('select', Browsers.select.bind(Browsers));
  Tabs.on('remove', Browsers.remove.bind(Browsers));

  service = Services.service('browsers')
    .method('ping', () => 'pong')
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
