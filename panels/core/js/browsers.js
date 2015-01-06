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
    '/shared/js/eventemitter.js',
    '/shared/js/keybindings.js',
    'browser',
  ],
function(EventEmitter, RegisterKeyBindings, Browser) {

  'use strict';

  let _browserArray = [];
  let _selectIndex = -1;
  
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
        window.parent.postMessage({
          type: 'Tab:Add',
          url: e.detail.url
        }, '*');

        return;
      }

      window.parent.postMessage({
        type: 'Tab:Update',
        uuid: browser.uuid,
        title: browser.title,
        loading: browser.loading,
        url: browser.location.toString(),
        favicon: browser.favicon
      }, '*');
    });
  }

  window.addEventListener('message', function(e) {
    if (!e.data.name.startsWith('Tab:')) {
      return;
    }

    var browser = document.querySelector('[uuid="' + e.data.uuid + '"]');
    if (browser) {
      Browsers.select(browser);
    } else {
      browser = Browsers.add(e.data);
      Browsers.select(browser);
    }
  });

  const Browsers = {
    add: function(config={}) {
      let browser = document.createElement('browser-element');
      browser.setAttribute('flex', '1');
      browser.setAttribute('uuid', config.uuid);

      let parent = document.querySelector('.iframes');
      parent.appendChild(browser);
      _browserArray.push(browser);

      this.emit('add', {browser: browser});

      if (config.url) {
        browser.setLocation(config.url);
      }

      if (config.select || _selectIndex < 0) {
        this.select(browser);
      } else {
        browser.hide();
      }

      return browser;
    },

    remove: function(browser) {
      let index = _browserArray.indexOf(browser);
      if (index < 0) {
        throw new Error('Unknown browser');
      }

      if (_browserArray.length == 1) {
        throw new Error('Deck has only one browser');
      }

      if (index == _selectIndex) {
        let newSelectIndex;
        if (index == _browserArray.length - 1) {
          newSelectIndex = index - 1;
        } else {
          newSelectIndex = index + 1;
        }
        this.select(_browserArray[newSelectIndex]);
      }

      if (_selectIndex > index) {
        _selectIndex--;
      }

      _browserArray.splice(index, 1);
      browser.remove();

      this.emit('remove', {browser});
    },

    select: function(browser) {
      let index = _browserArray.indexOf(browser);
      if (index < 0) {
        throw new Error('Unknown browser');
      }

      if (index == _selectIndex) {
        // already selected
        return;
      }

      browser.willBeVisibleSoon();

      let previouslySelectedBrowser = _browserArray[_selectIndex];
      if (previouslySelectedBrowser) {
        this.emit('unselect', {browser: previouslySelectedBrowser});
      }

      _selectIndex = index;

      this.emit('select', {browser});

      window.mozRequestAnimationFrame(() => {
        if (previouslySelectedBrowser) {
          previouslySelectedBrowser.hide();
        }
        browser.show();
      });
    },

    getSelected: function() {
      return _browserArray[_selectIndex];
    },

    getCount: function() {
      return _browserArray.length;
    },
  }

  Browsers[Symbol.iterator] = function*() {
    for (let browser of _browserArray) {
      yield browser;
    }
  }

  EventEmitter.decorate(Browsers);

  RegisterKeyBindings(
    ['',              'Esc',        () => Browsers.getSelected().stop()],
    ['',              'F5',         () => Browsers.getSelected().reload()]
  );

  if (window.OS == 'linux' || window.OS == 'windows') {
    RegisterKeyBindings(
      ['Ctrl',          'r',          () => Browsers.getSelected().reload()],
      ['Alt',           'Left',       () => Browsers.getSelected().goBack()],
      ['Alt',           'Right',      () => Browsers.getSelected().goForward()],
      ['Ctrl Shift',    '+',          () => Browsers.getSelected().zoomIn()],
      ['Ctrl',          '=',          () => Browsers.getSelected().zoomIn()],
      ['Ctrl',          '-',          () => Browsers.getSelected().zoomOut()],
      ['Ctrl',          '0',          () => Browsers.getSelected().resetZoom()]
    );
  }

  if (window.OS == 'osx') {
    RegisterKeyBindings(
      ['Cmd',       'r',          () => Browsers.getSelected().reload()],
      ['Cmd',       'Left',       () => Browsers.getSelected().goBack()],
      ['Cmd',       'Right',      () => Browsers.getSelected().goForward()],
      ['Cmd Shift', '+',          () => Browsers.getSelected().zoomIn()],
      ['Cmd',       '=',          () => Browsers.getSelected().zoomIn()],
      ['Cmd',       '-',          () => Browsers.getSelected().zoomOut()],
      ['Cmd',       '0',          () => Browsers.getSelected().resetZoom()]
    );
  }

  return Browsers;
});
