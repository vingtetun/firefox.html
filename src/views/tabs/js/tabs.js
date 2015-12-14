/**
 * tabs.js
 *
 * Tabs object is used to manipulate the list
 * of tabs (add, remove, select, …) and be notified
 * on tab changes (events like 'select', 'add', …).
 *
 */

define(
  [
    '/src/shared/js/bridge/service.js',
    '/src/shared/js/eventemitter.js',
    'uuid'
  ],
function(Bridge, EventEmitter, UUID) {

  'use strict';

  const HOMEPAGE = 'about:home';

  let _tabsArray = [];
  let _selectIndex = -1;

  const Tabs = {

    // This is a poor man session storage. Just a temporary
    // thing (localStorage is bad).
    saveSession: function() {
      window.localStorage.session = JSON.stringify(_tabsArray);
    },

    restoreSession: function() {
      let session = [];
      try {
        session = JSON.parse(window.localStorage.session);
      } catch (e) {}

      if (Array.isArray(session) && session.length > 0) {
        for (let config of session) {
          Tabs.add(config);
        }
      } else {
        Tabs.add({url: HOMEPAGE});
      }
    },

    add: function(options={}) {
      var config = {
        url: options.url || '',
        title: options.title || '',
        favicon: options.favicon || '',
        loading: false,
        uuid: UUID.generate()
      };
      _tabsArray.push(config);

      if (options.select || _selectIndex < 0) {
        this.select(config.uuid);
      }

      this.emit('add', config);

      this.saveSession();
    },

    update: function(options) {
      let uuid = options.uuid;
      let index = _tabsArray.findIndex(function(config) {
        return config.uuid === uuid;
      });

      var config = _tabsArray[index];
      if (config) {
        config.title = options.title;
        config.url = options.url;
        config.favicon = options.favicon;
        Tabs.saveSession();

        config.loading = options.loading;
        Tabs.emit('update', config);
      }
    },

    remove: function(uuid) {
      if (!uuid) {
        uuid = this.getSelected().uuid;
      }

      let index = _tabsArray.findIndex(function(config) {
        return config.uuid === uuid;
      });

      if (index < 0) {
        throw new Error('Unknown tab');
      }

      if (_tabsArray.length == 1) {
        throw new Error('Deck has only one tab');
      }

      if (index == _selectIndex) {
        let newSelectIndex;
        if (index == _tabsArray.length - 1) {
          newSelectIndex = index - 1;
        } else {
          newSelectIndex = index + 1;
        }
        this.select(_tabsArray[newSelectIndex].uuid);
      }

      if (_selectIndex > index) {
        _selectIndex--;
      }

      let config = _tabsArray.splice(index, 1)[0];
      sendMessage('Remove', config);

      this.saveSession();

      this.emit('remove', {uuid});
    },

    select: function(uuid) {
      let index = _tabsArray.findIndex(function(config) {
        return config.uuid === uuid;
      });

      if (index < 0) {
        throw new Error('Unknown tab');
      }

      if (index == _selectIndex) {
        // already selected
        return;
      }

      let previouslySelectedTab = _tabsArray[_selectIndex];
      if (previouslySelectedTab) {
        this.emit('unselect', {uuid: previouslySelectedTab.uuid});
      }

      _selectIndex = index;

      this.emit('select', {uuid});

      let config = _tabsArray[index];
      sendMessage('Show', {
        uuid: uuid,
        url: config.url
      });
    },

    selectNext: function() {
      let newSelectIndex = _selectIndex + 1;
      if (newSelectIndex == _tabsArray.length) {
        newSelectIndex = 0;
      }
      this.select(_tabsArray[newSelectIndex].uuid);
    },

    selectPrevious: function() {
      let newSelectIndex = _selectIndex - 1;
      if (newSelectIndex < 0) {
        newSelectIndex = _tabsArray.length - 1;
      }
      this.select(_tabsArray[newSelectIndex].uuid);
    },

    moveNext: function() {
      let newSelectIndex = _selectIndex + 1;
      if (newSelectIndex >= _tabsArray.length) {
        return;
      }

      _tabsArray.splice(_selectIndex, 2,
                             _tabsArray[newSelectIndex],
                             _tabsArray[_selectIndex]);

      _selectIndex = newSelectIndex;

      let config = _tabsArray[_selectIndex];
      let direction = 1;
      this.emit('move', {uuid: config.uuid, direction});

      this.saveSession();
    },

    movePrevious: function() {
      let newSelectIndex = _selectIndex - 1;
      if (newSelectIndex < 0) {
        return;
      }

      _tabsArray.splice(newSelectIndex, 2,
                             _tabsArray[_selectIndex],
                             _tabsArray[newSelectIndex]);

      _selectIndex = newSelectIndex;

      let config = _tabsArray[_selectIndex];
      let direction = -1;
      this.emit('move', {uuid: config.uuid, direction});

      this.saveSession();
    },

    getSelected: function() {
      return _tabsArray[_selectIndex];
    },

    getCount: function() {
      return _tabsArray.length;
    },
  }

  Tabs[Symbol.iterator] = function*() {
    for (let config of _tabsArray) {
      yield config;
    }
  }

  EventEmitter.decorate(Tabs);

  var SystemFrame = {
    forward: function(msg) {
      this.ready.then((target) => {
        target.postMessage(msg, '*');
      });
    },

    ready: new Promise(function(resolve) {
      var target = document.getElementById('system');
      if (target.ready) {
        resolve(target.contentWindow);
      } else { 
        target.addEventListener('load', () => {
          resolve(target.contentWindow);
        });
      }
    })
  };

  function sendMessage(type, data) {
    SystemFrame.forward({
      name: 'Tab:' + type,
      uuid: data.uuid,
      url: data.url
    });
  }

  Tabs.restoreSession();

  const Service = Bridge.service('tabs')
    .method('add', Tabs.add.bind(Tabs))
    .method('remove', Tabs.remove.bind(Tabs))
    .method('selectPrevious', Tabs.selectPrevious.bind(Tabs))
    .method('selectNext', Tabs.selectNext.bind(Tabs))
    .method('movePrevious', Tabs.movePrevious.bind(Tabs))
    .method('moveNext', Tabs.moveNext.bind(Tabs))
    .method('update', Tabs.update.bind(Tabs))
    .method('viewsource', function() {
      let url = 'view-source:' + Tabs.getSelected().url;
      Tabs.add({select: true, url: url});
    })
    .listen(new BroadcastChannel('tabs'));

  return Tabs;
});
