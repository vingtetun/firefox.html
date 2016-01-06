/**
 * content-scripts.js
 *
 * Utility Helper to register scripts that should be injected into
 * remote content at runtime.
 *
 */

define([], function() {
  'use strict';

  let scripts = {
    'http://browserhtml.org/src/about/home/':
      {
        parent: '/src/about/home/js/scripts/parent.js',
        child: '/src/about/home/js/scripts/content.js'
      }
  };

  let contents = {
  };
  
  return {
    get: function(url) {
      dump('Get: ' + url + '\n');
      let script = scripts[url];
      if (!script) {
        return null;
      }

      let content = contents[script.child];
      dump('Looking for content for: ' + script + '\n');
      if (!content) {
        // Register the parent script
        require([script.parent]);


        // Get the content of the child script
        let xhr = new XMLHttpRequest();
        xhr.open('GET', script.child, false);
        xhr.send();
        contents[url] = content = xhr.responseText;
      }
      dump('content: ' + content + '\n');

      return content;
    }
  }
})
