(function() {
  'use strict';

  function getSharedWorker() {
    return new SharedWorker('/src/workers/worker.js');
  }

  var Services = {
    get history() {
      delete this.history;
      return this.history = bridge.client('history', getSharedWorker());
    }
  };

  window.Services = Services;
})();
