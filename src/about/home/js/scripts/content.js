
(function() {
  'use strict';

  var iframe = document.createElementNS('http://www.w3.org/1999/xhtml', 'iframe');
  iframe.src = 'http://browserhtml.org/src/about/home/content/index.html';
  iframe.setAttribute('mozbrowser', 'true');
  iframe.setAttribute('width', '0');
  iframe.setAttribute('height', '0');

  addEventListener('load', function onload() {
    removeEventListener('load', onload);
    let root = document.body || document.firstElementChild;
    root.appendChild(iframe);
  });
})();
