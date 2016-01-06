
(function() {
  'use strict';

  var bc = new BroadcastChannel('SearchService');
  bc.postMessage({type: 'Yo'});
  dump(bc + '\n');
})();
