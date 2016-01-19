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
    'about:config':
      {
        parent: '/src/about/home/js/scripts/parent.js',
        child: '/src/about/home/js/scripts/content.js'
      }
  };

  let contents = {
  };
  
  return {
    get: function(url) {
      let script = scripts[url];
      if (!script) {
        return null;
      }

      let content = contents[script.child];
      if (!content) {
        // Register the parent script
        require([script.parent]);


        // Get the content of the child script
        let xhr = new XMLHttpRequest();
        xhr.open('GET', script.child, false);
        xhr.send();
        contents[url] = content = xhr.responseText;
      }

      return content;
    }
  }
})
