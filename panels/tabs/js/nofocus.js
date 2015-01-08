
require([], function() {
  // Ensure the panel can not get user focus from mouse.
  window.addEventListener('mousedown', function(e) {
    e.preventDefault();
  });
});
