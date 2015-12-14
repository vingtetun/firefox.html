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
    '/src/shared/js/eventemitter.js',
    'browser',
  ],
function(EventEmitter, Browser) {

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

  for (let type of _eventsToTrack) {
    window.addEventListener(type, function(e) {
      let browser = e.target.parentNode;

      if (e.type === 'mozbrowseropenwindow') {
        Services.tabs.method('add', {url: e.detail.url});
        return;
      }

      Services.tabs.method('update', {
        uuid: browser.uuid,
        title: browser.title,
        loading: browser.loading,
        url: browser.location.toString(),
        favicon: browser.favicon
      });

    });
  }

  window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data || !data.name || !data.name.startsWith('Tab:')) {
      return;
    }

    var browser = document.querySelector('[uuid="' + data.uuid + '"]');
    if (browser) {
      Browsers.select(browser);
    } else {
      browser = Browsers.add(data);
      Browsers.select(browser);
    }
  });

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
        throw new Error('Unknown browser');
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

  return Browsers;
});
