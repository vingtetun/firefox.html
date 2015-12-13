require.config({
  scriptType: 'text/javascript;version=1.8'
});

require([
  'tabstrip',
  'shortcuts',
  'webextensions/tabs'
]);

// Start Services early
new SharedWorker('/src/workers/worker.js');
