'use strict';

importScripts('/src/shared/js/bridge/service.js');

const URL = 'http://ff.search.yahoo.com/gossip?output=fxjson&command=';

var runningXHR = null;

bridge.service('suggestions')
  .method('get', function(value) {
    if (runningXHR && runningXHR.cancel) {
      runningXHR.cancel();
    }

    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest({mozSystem: true});
      xhr.open('GET', URL + value, true);
      xhr.send();
      runningXHR = xhr; 
      dump(URL + value + '\n');

      xhr.onload = function() {
        runningXHR = null;
        resolve(JSON.parse(xhr.response)[1]);
      }
    });
  })
  .listen(new BroadcastChannel('suggestions'));
