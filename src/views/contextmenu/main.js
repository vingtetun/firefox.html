window.addEventListener('message', function(e) {
  var data = e.data.infos;

  var element = document.querySelector('.contextmenu');
  element.style.left = data.rect.left + 'px';
  element.style.top = data.rect.top + 'px';
});
