

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
    win.className = 'window';
    document.body.appendChild(win);

    win.addEventListener('mozbrowserclose', function onClose(e) {
      win.removeEventListener('mozbrowserclose', onClose);
      document.body.removeChild(win);
    });
  }

  // Turn ',' separated 'key=value' string into object for easy access
  var features =
    features.split(',')
            .reduce(function(acc, feature) {
              feature = feature.split('=')
                               .map(function(featureElem) {
                                 return featureElem.trim();
                               });
              if (feature.length !== 2) {
                return acc;
              }

              acc[decodeURIComponent(feature[0])] =
                decodeURIComponent(feature[1]);
              return acc;
            }, {});

  win.style.top = (features.top || 0) + 'px';
  win.style.left = (features.left || 0) + 'px';
  win.style.width = (features.width || window.innerWidth) + 'px';
  win.style.height = (features.height || 400) + 'px';

  win.src = url;
  return win;
}


function closeWindow(win) {
  if (!win) {
    return;
  }

  document.body.removeChild(win);
}
