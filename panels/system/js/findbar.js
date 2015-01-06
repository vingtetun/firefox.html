
require(['/shared/js/keybindings.js', 'browsers'],
function(RegisterKeyBindings, Browsers) {
  
  'use strict';

  let placeholder = document.querySelector('.findbar');
  let urlinput = placeholder.querySelector('input');

  urlinput.addEventListener('keypress', (e) => {
    if (e.keyCode == 13) {
      SearchInputValidated()
    }

    if (e.keyCode == 27) {
      SearchClose();
    }
  });

  let next = placeholder.querySelector('button.next');
  next.addEventListener('click', (e) => {
    Browsers.getSelected().find(urlinput.value, false, false);
  });

  let previous = placeholder.querySelector('button.previous');
  previous.addEventListener('click', (e) => {
    Browsers.getSelected().find(urlinput.value, false, true);
  });

  let close = placeholder.querySelector('button.close');
  close.addEventListener('click', (e) => {
    SearchClose();
  });

  function SearchClose() {
    placeholder.classList.remove('visible');
    urlinput.value = '';
    urlinput.blur();
  }

  function SearchInputValidated() {
    Browsers.getSelected().find(urlinput.value, false, false);
  }

  let mod = window.OS == 'osx' ? 'Cmd' : 'Ctrl';
  RegisterKeyBindings(
    [mod,    'f',   () => {
      placeholder.classList.add('visible');
      urlinput.focus();
      urlinput.select();
    }]
  );
});
