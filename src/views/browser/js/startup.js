require.config({
  scriptType: 'text/javascript;version=1.8'
});

require([
  'navbar',
  'findbar',
  'webextensions/browserAction'
]);

addEventListener('load', function() {
  window.frameElement.ready = true;
  window.frameElement.dispatchEvent(new CustomEvent('load'));
});
