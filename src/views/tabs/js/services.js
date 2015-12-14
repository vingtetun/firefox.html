/**
 * services.js
 *
 *
 * Bootstrap core services.
 *
 */

define(['/src/shared/js/bridge/service.js'], function(Bridge) {
  // Startup core services early.
  new SharedWorker('/src/workers/worker.js');

  // Attach some debugging shortcuts
  Bridge.service('debug')
    .method('reload', () => document.location.reload(true))
    .listen(new BroadcastChannel('debug'));
});
