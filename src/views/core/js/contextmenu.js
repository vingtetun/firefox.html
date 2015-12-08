
window.addEventListener('mozbrowsercontextmenu', function(e) {
  dump(e.detail.screenX + '\n');
  dump(e.detail.screenY + '\n');
  for (var p in e.detail.rect) {
    dump(p + ': ' + e.detail.rect[p] + '\n');
  }

  var win = openWindow('/src/views/contextmenu/index.html',
                       'contextmenu');

  var data = e.detail;
  win.addEventListener('mozbrowserloadend', function onLoad(e) {
    win.removeEventListener(e.type, onLoad);
    setTimeout(function() {
    win.contentWindow.postMessage({
      infos: data
    }, '*');
    }, 500);
  });
});
