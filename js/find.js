
require(['js/tabiframedeck', 'js/keybindings'],
function(TabIframeDeck, RegisterKeyBindings) {
  
  'use strict';

  let link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/findbar.css';
  let defaultStyleSheet = document.querySelector('link[title=default]');
  document.head.insertBefore(link, defaultStyleSheet.nextSibling);


  let html = `
    <div class='search-input'>
      <input class='search'></input>
      <button class='button next'></button>
      <button class='button previous'></button>
    </div>
    <button class='button close'></button>
  `;

  let placeholder = document.createElement('div');
  placeholder.className = 'findbar';
  placeholder.innerHTML = html;
  document.body.appendChild(placeholder);

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
    TabIframeDeck.getSelected().find(urlinput.value, false, false);
  });

  let previous = placeholder.querySelector('button.previous');
  previous.addEventListener('click', (e) => {
    TabIframeDeck.getSelected().find(urlinput.value, false, true);
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
    TabIframeDeck.getSelected().find(urlinput.value, false, false);
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
