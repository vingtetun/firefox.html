
function calculateAnchorRect(target) {
  var rect = target.getBoundingClientRect();
  return rect;
}

function openPopup(url, name, features) {
  if (features && features.anchor) {

    if (!features.rect) {
      features.rect = {};
    }

    var anchorRect = calculateAnchorRect(features.anchor);
    features.rect.left = anchorRect.left;
    features.rect.top = (anchorRect.top + anchorRect.height);
  }

  var popup = openWindow(url, name, features);

  popup.classList.add('popup');
  return popup;
}

function closePopup(popup) {
  if (!popup || !popup.classList.contains('popup')) {
    return;
  }

  closeWindow(popup);
}

function openWindow(url, name, features) {
  'use strict';

  var win = document.querySelector('iframe[name=' + name + ']');

  // First, look for a window with the same name. Iff none, create a
  // new one.
  if (!win) {
    var container = document.createElement('div');
    container.className = 'window';

    var arrow = document.createElement('div');
    arrow.className = 'arrow';
    
    win = document.createElement('iframe');
    win.setAttribute('mozbrowser', true);
    win.setAttribute('name', name);
    win.setAttribute('mozpasspointerevents', 'true');
    win.setAttribute('ignoreuserfocus', 'true');
    win.setAttribute('transparent', 'true');

    if (features.rect) {
      const DEFAULT_RECT = {
        left: 0,
        top: 0,
        width: 100,
        height: 80
      };

      container.style.height = (features.rect.height || DEFAULT_RECT.height) + 'px';
      container.style.width = (features.rect.width || DEFAULT_RECT.width) + 'px';
      container.style.top = (features.rect.top || DEFAULT_RECT.top) + 'px';
      container.style.left = (features.rect.left || DEFAULT_RECT.left) + 'px';
    }

    container.appendChild(win);
    container.appendChild(arrow);
    document.body.appendChild(container);
  }

  win.src = url;
  return container;
}


function closeWindow(win) {
  if (!win) {
    return;
  }

  document.body.removeChild(win);
}
