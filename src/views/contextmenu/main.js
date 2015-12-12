window.addEventListener('message', function(e) {
  var data = e.data.infos;

  var element = document.querySelector('.contextmenu');
  element.style.left = data.clientX + 'px';
  element.style.top = (data.clientY + 39) + 'px';
  element.style.visibility = 'visible';
});

addEventListener('load', function(e) {
  window.frameElement.dispatchEvent(new CustomEvent('load'));
});
