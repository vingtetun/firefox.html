/**
 * navbar.js
 *
 * Code handling the navigation bar. The navigation bar includes
 * the back/forward/stop/reload buttons and the url bar.
 *
 */

define(
  [
    '/src/shared/js/urlhelper.js',
    '/src/shared/js/bridge/service.js',
    'browsers',
    'popuphelper'
],
function(UrlHelper, Bridge, Browsers, PopupHelper) {

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
    if (resultWindow) {
      PopupHelper.close(resultWindow);
      resultWindow = null;
    }

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
      resultWindow.forward({keycode: e.keyCode});
      e.preventDefault();
    }
  });

  window.addEventListener('message', function(e) {
    if (e.data && e.data.selected_value) {
      urlinput.value = e.data.selected_value;
    }
  });

  urlinput.addEventListener('input', () => {
    Browsers.getSelected().userInput = urlinput.value;
    UrlInputChanged();
  });

  Bridge.service('urlbar')
    .method('focus', () => {
      urlinput.focus();
      urlinput.select();
    })
    .listen(new BroadcastChannel('urlbar'));

  var resultWindow = null;
  function UrlInputChanged() {
    let text = urlinput.value;
    if (text === '') {
      if (resultWindow) {
        PopupHelper.close(resultWindow);
        resultWindow = null;
      }
      return;
    }

    if (resultWindow === null) {
      resultWindow = PopupHelper.open({
        url: '/src/views/places/index.html',
        name: 'places',
        anchor: navbar,
        data: { value: text }
      });
    } else {
      resultWindow.forward({ value: text });
    }
  }

  function UrlInputValidated() {
    if (resultWindow) {
      PopupHelper.close(resultWindow);
      resultWindow = null;
    }

    let text = urlinput.value;
    let url = PreprocessUrlInput(text);
    let browser = Browsers.getSelected();
    browser.setLocation(url);
    browser.focus();
  }

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


  return {
    get height() {
      return navbar.getBoundingClientRect().height;
    }
  }
});
