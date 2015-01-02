/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * navbar.js
 *
 * Code handling the navigation bar. The navigation bar includes
 * the back/forward/stop/reload buttons and the url bar.
 *
 */

require(['js/urlhelper', 'js/tabiframedeck', 'js/keybindings'],
function(UrlHelper, TabIframeDeck, RegisterKeyBindings) {

  'use strict';

  let link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/navbar.css';
  let defaultStyleSheet = document.querySelector('link[title=default]');
  document.head.insertBefore(link, defaultStyleSheet.nextSibling);

  let html = `
    <hbox class='navbar toolbar' align='center'>
      <button class='back-button' title='Go back one page'></button>
      <button class='forward-button' title='Go forward one page'></button>
      <button class='reload-button' title='Reload current page'></button>
      <button class='stop-button' title='Stop loading this page'></button>
      <hbox class='urlbar' flex='1' align='center'>
        <div class='identity'></div>
        <input placeholder='Search or enter address' class='urlinput' flex='1'>
      </hbox>
    </hbox>
  `;
  let outervbox = document.querySelector('#outervbox');
  let outerhbox = document.querySelector('#outerhbox');
  let placeholder = document.createElement('hbox');
  outervbox.insertBefore(placeholder, outerhbox);
  placeholder.outerHTML = html;

  let navbar = document.querySelector('.navbar');

  let urlTemplate = 'https://search.yahoo.com/search?p={searchTerms}';

  let urlbar = navbar.querySelector('.urlbar');
  let urlinput = navbar.querySelector('.urlinput');
  let backButton = navbar.querySelector('.back-button')
  let forwardButton = navbar.querySelector('.forward-button')
  let reloadButton = navbar.querySelector('.reload-button');
  let stopButton = navbar.querySelector('.stop-button');

  backButton.onclick = () => TabIframeDeck.getSelected().goBack();
  forwardButton.onclick = () => TabIframeDeck.getSelected().goForward();
  reloadButton.onclick = () => TabIframeDeck.getSelected().reload();
  stopButton.onclick = () => TabIframeDeck.getSelected().stop();

  urlinput.addEventListener('focus', () => {
    urlinput.select();
    urlbar.classList.add('focus');
  })

  urlinput.addEventListener('blur', () => {
    closeWindow(resultWindow);
    resultWindow = null;
    urlbar.classList.remove('focus');
  })

  urlinput.addEventListener('keypress', (e) => {
    if (e.keyCode == 13) {
      UrlInputValidated()
    }
  });

  urlinput.addEventListener('input', () => {
    TabIframeDeck.getSelected().userInput = urlinput.value;
    UrlInputChanged();
  });

  let mod = window.OS == 'osx' ? 'Cmd' : 'Ctrl';

  RegisterKeyBindings(
    [mod,    'l',   () => {
      urlinput.focus();
      urlinput.select();
    }],
    [mod,    'k',   () => {
      urlinput.focus();
      urlinput.select();
    }]
  );

  var resultWindow = null;
  function UrlInputChanged() {
    let text = urlinput.value;
    if (text === '') {
      closeWindow(resultWindow);
      resultWindow = null;
      return;
    }

    if (resultWindow === null) {
      resultWindow = openWindow('panels/places/main.html',
                                'places',
                                'left=0,top=66, height=100');
    }
  }

  function UrlInputValidated() {
    closeWindow(resultWindow);
    resultWindow = null;

    let text = urlinput.value;
    let url = PreprocessUrlInput(text);
    let tabIframe = TabIframeDeck.getSelected();
    tabIframe.setLocation(url);
    tabIframe.focus();
  }

  TabIframeDeck.on('select', OnTabSelected);

  let lastSelectedTab = null;

  let events = [
    'mozbrowserloadstart',
    'mozbrowserloadend',
    'mozbrowserlocationchange',
    'mozbrowsererror',
    'mozbrowsersecuritychange',
  ];

  function OnTabSelected() {
    let selectedTabIframe = TabIframeDeck.getSelected();
    if (lastSelectedTab) {
      for (let e of events) {
        lastSelectedTab.off(e, UpdateTab);
      }
    }
    lastSelectedTab = selectedTabIframe;
    if (selectedTabIframe) {
      if (!selectedTabIframe.location) {
        urlinput.focus();
        urlinput.select();
      }
      for (let e of events) {
        lastSelectedTab.on(e, UpdateTab);
      }
      UpdateTab(null, null, selectedTabIframe);
    }
  }

  OnTabSelected();

  function UpdateTab(eventName, event, tabIframe) {
    if (tabIframe != TabIframeDeck.getSelected()) {
      return;
    }

    if (tabIframe.loading) {
      navbar.classList.add('loading');
    } else {
      navbar.classList.remove('loading');
    }

    if (tabIframe.userInput) {
      urlinput.value = tabIframe.userInput;
    } else if (tabIframe.location) {
      urlinput.value = UrlHelper.trim(tabIframe.location);
    } else if (eventName === null) {
      urlinput.value = '';
    }

    if (!window.IS_PRIVILEGED) {
      return;
    }

    if (tabIframe.securityState == 'secure') {
      navbar.classList.add('ssl');
      navbar.classList.toggle('sslev', tabIframe.securityExtendedValidation);
    } else {
      navbar.classList.remove('ssl');
      navbar.classList.remove('sslev');
    }

    tabIframe.canGoBack().then(canGoBack => {
      // Make sure iframe is still selected
      if (tabIframe != TabIframeDeck.getSelected()) {
        return;
      }
      if (canGoBack) {
        backButton.classList.remove('disabled');
      } else {
        backButton.classList.add('disabled');
      }
    });

    tabIframe.canGoForward().then(canGoForward => {
      // Make sure iframe is still selected
      if (tabIframe != TabIframeDeck.getSelected()) {
        return;
      }
      if (canGoForward) {
        forwardButton.classList.remove('disabled');
      } else {
        forwardButton.classList.add('disabled');
      }
    });
  };

  function PreprocessUrlInput(input) {
    if (UrlHelper.isNotURL(input)) {
      return urlTemplate.replace('{searchTerms}', encodeURIComponent(input));
    }

    if (!UrlHelper.hasScheme(input)) {
      input = 'http://' + input;
    }

    return input;
  };

});
