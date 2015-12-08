
'use strict';

window.addEventListener('mozbrowsershowmodalprompt', function(e) {
  e.detail.returnValue = true;
  e.unblock();
});
