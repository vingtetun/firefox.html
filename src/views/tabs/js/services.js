/**
 * services.js
 *
 *
 * Bootstrap core services.
 *
 */

define([], function() {
  new SharedWorker('/src/workers/worker.js');
});
