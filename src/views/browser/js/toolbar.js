/**
 *
 * buttons.js
 *
 * Implement an API to add/remove/update toolbar buttons
 *
 * These buttons are not specific to a tab, but can have
 * a state specific to a given one.
 *
 */

define(['popuphelper'], function(PopupHelper) {
  let map = new Map();

  function getContainer() {
    return document.getElementById("toolbar-buttons");
  }

  function onClick(event) {
    let id = event.target.dataset.id;
    Toolbar.service.broadcast('click', { buttonId: id });
  }

  function createButton(options) {
    let button = document.createElement('button');
    button.className = 'toolbar-button';
    button.addEventListener('click', onClick);
    button.dataset.id = options.id;
    return button;
  }

  function appendButton(button) {
    button && getContainer().appendChild(button); 
  }

  function removeButton(button) {
    button && button.remove();
  }

  function getBadge(button) {
    return button.querySelector('.button-badge');
  }

  function createBadge(button) {
    let badge = document.createElement("div");
    badge.className = "button-badge";
    return button.appendChild(badge);
  }

  function removeBadge(button) {
    getBadge(button) && getBadge().remove();
  }

  let Toolbar = {
    add: function(options) {
      let button = createButton(options);
      appendButton(button);
      map.set(options.id, button);
      return button;
    },

    remove: function(options) {
      let button = map.get(options.id);
      removeButton(button);
      return map.delete(options.id);
    },

    update: function(options) {
      let button = map.get(options.id) || this.add(options);

      button.setAttribute('title', options.title || '');

      if (options.icon) {
        button.innerHTML = '<img src="' + 
                           options.icon[Object.keys(options.icon)[0]] + 
                           '"></img>';
      } else {
        button.innerHTML = '';
      }

      if (options.badgeText) {
        let badge = getBadge(button) || createBadge(button);
        badge.textContent = options.badgeText;
        badge.style.backgroundColor = badge.badgeBackgroundColor || '';
      } else {
        removeBadge(button);
      }
    },

    openPopup: function(options) {
      let button = map.get(options.id);
      PopupHelper.open({
        url: options.url,
        type: PopupHelper.Popup,
        anchor: button
      });
    }
  };

  Toolbar.service =
    Services.service('toolbar')
            .method('ping', () => 'pong')
            .method('openPopup', Toolbar.openPopup.bind(Toolbar))
            .method('update', Toolbar.update.bind(Toolbar))
            .listen(new BroadcastChannel('toolbar'));

  return Toolbar;
});
