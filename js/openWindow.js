

function openWindow(url, name, features) {
  'use strict';

  var win = document.querySelector('iframe[name=' + name + ']');

  // First, look for a window with the same name. Iff none, create a
  // new one.
  if (!win) {
    win = document.createElement('iframe');
    win.setAttribute('mozbrowser', 'true');
    win.setAttribute('mozapp', 'app://browser.gaiamobile.org/manifest.webapp');
    win.setAttribute('name', name);
    win.setAttribute('mozpasspointerevents', 'true');
    win.setAttribute('ignoreuserfocus', 'true');
    win.setAttribute('transparent', 'true');
    win.className = 'window';

    document.body.appendChild(win);
  }

  win.src = url;
  return win;
}


function closeWindow(win) {
  if (!win) {
    return;
  }

  document.body.removeChild(win);
}
