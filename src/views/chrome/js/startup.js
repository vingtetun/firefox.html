require.config({
  scriptType: 'text/javascript;version=1.8'
});

require([
  'chromes',
  'modal',
  'findbar'
], function() {
  Services.debug.on('reload', () => document.location.reload(true));
});
