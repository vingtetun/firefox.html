/**
 * navbar.js
 *
 * Code handling the navigation bar. The navigation bar includes
 * the back/forward/stop/reload buttons and the url bar.
 *
 */

require(
  [
    '/src/shared/js/urlhelper.js',
    '/src/shared/js/keybindings.js',
    'browsers'
],
function(UrlHelper, RegisterKeyBindings, Browsers) {

  'use strict';

  let navbar = document.querySelector('.navbar');
  let urlbar = navbar.querySelector('.urlbar');
  let urlinput = navbar.querySelector('.urlinput');
  let backButton = navbar.querySelector('.back-button')
  let forwardButton = navbar.querySelector('.forward-button')
  let reloadButton = navbar.querySelector('.reload-button');
  let stopButton = navbar.querySelector('.stop-button');

  backButton.onclick = () => Browsers.getSelected().goBack();
  forwardButton.onclick = () => Browsers.getSelected().goForward();
  reloadButton.onclick = () => Browsers.getSelected().reload();
  stopButton.onclick = () => Browsers.getSelected().stop();

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

    if (resultWindow && (
        e.keyCode === 9 ||
        e.keyCode === 38 ||
        e.keyCode === 40)) {
      resultWindow.contentWindow.postMessage({
        'keycode': e.keyCode
      }, '*');
      e.preventDefault();
    }
  });

  window.addEventListener('message', function(e) {
    if ('selected_value' in e.data) {
      urlinput.value = e.data.selected_value;
    }
  });

  urlinput.addEventListener('input', () => {
    Browsers.getSelected().userInput = urlinput.value;
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
      resultWindow = openWindow('/src/views/places/index.html',
                                'places');
    }

    resultWindow.contentWindow.postMessage({
      'value': text
    }, '*')
  }

  function UrlInputValidated() {
    closeWindow(resultWindow);
    resultWindow = null;

    let text = urlinput.value;
    let url = PreprocessUrlInput(text);
    let browser = Browsers.getSelected();
    browser.setLocation(url);
    browser.focus();
  }

  Browsers.on('select', OnTabSelected);

  let lastSelectedTab = null;

  let events = [
    'mozbrowserloadstart',
    'mozbrowserloadend',
    'mozbrowserlocationchange',
    'mozbrowsererror',
    'mozbrowsersecuritychange',
  ];

  function OnTabSelected() {
    let selectedTabIframe = Browsers.getSelected();
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

  function UpdateTab(eventName, event, browser) {
    if (browser != Browsers.getSelected()) {
      return;
    }

    if (browser.loading) {
      navbar.classList.add('loading');
    } else {
      navbar.classList.remove('loading');
    }

    if (browser.userInput) {
      urlinput.value = browser.userInput;
    } else if (browser.location) {
      urlinput.value = UrlHelper.trim(browser.location);
    } else if (eventName === null) {
      urlinput.value = '';
    }

    if (!browser.isMozBrowser()) {
      return;
    }

    if (browser.securityState == 'secure') {
      navbar.classList.add('ssl');
      navbar.classList.toggle('sslev', browser.securityExtendedValidation);
    } else {
      navbar.classList.remove('ssl');
      navbar.classList.remove('sslev');
    }

    browser.canGoBack().then(canGoBack => {
      // Make sure iframe is still selected
      if (browser != Browsers.getSelected()) {
        return;
      }
      if (canGoBack) {
        backButton.classList.remove('disabled');
      } else {
        backButton.classList.add('disabled');
      }
    });

    browser.canGoForward().then(canGoForward => {
      // Make sure iframe is still selected
      if (browser != Browsers.getSelected()) {
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
      let urlTemplate = 'https://search.yahoo.com/search?p={searchTerms}';
      return urlTemplate.replace('{searchTerms}', encodeURIComponent(input));
    }

    if (!UrlHelper.hasScheme(input)) {
      input = 'http://' + input;
    }

    return input;
  };

});
