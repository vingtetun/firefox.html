(function installProxyAndForwardEvents() {
  'use strict';

  // This store a reference to the proxy iframe to make it
  // available throught the closure.
  let proxy = null;

  function run() {
    if (document.readyState === 'complete') {
      injectProxy(document.body || document.firstElementChild);
    } else {
      addEventListener('load', function onload() {
        removeEventListener('load', onload);
        injectProxy(document.body || document.firstElementChild);
      });
    }
  }

  function injectProxy(rootElement) {
    proxy = document.createElementNS(
      'http://www.w3.org/1999/xhtml',
      'iframe'
    );

    // The proxy needs to be a mozbrowser iframe in order to:
    //  - ensure it does not inherit the chrome scope
    //  - serve it from the same-origin than core services.
    proxy.setAttribute('mozbrowser', 'true');

    // XXX Needs to find a better way to make it invisible
    proxy.setAttribute('width', '0');
    proxy.setAttribute('height', '0');
    proxy.src = getProxyUrl();

    rootElement.appendChild(proxy);
  }

  // The proxy url is a document that knows how to exchange messages
  // with the core services.
  function getProxyUrl() {
    return 'http://browserhtml.org:8081/src/about/home/proxy.html';
  }

  function forwardToProxy(data) {
    proxy.contentWindow.postMessage(
      data,
      '*'
    );
  }

  //
  // From here the code is dedicated to listen frame events and
  // forward them to the proxy.

  addEventListener('click', listenClickEvents);

  function listenClickEvents(e) {
    let params = {
      url: '',
      isTab: false
    };

    let target = e.originalTarget;
    let targetId = target.getAttribute("id");

    switch (targetId) {
      // XXX Normally this link result into a call to openDialog
      // with some arguments to configure the right panel. Sadly
      // openDialog is chrome only and so it can not be done from
      // our UI context.
      // Fixing places so it accept entrypoint arguments, similarly to
      // about:preferences will likely helps.
      case "bookmarks":
        params.url = 'chrome://browser/content/places/places.xul';
        break;

      // See previous comment.
      case "history":
        params.url = 'chrome://browser/content/places/places.xul';
        break;

      // Because what is mentioned in the previous comments, this link should
      // theorically shows a pane from places in non-private mode, and
      // about:downloads in private mode. But because mapping things to the
      // places UI does not work yet, let's always use about:downloads until
      // it works.
      case "downloads":
        params.url = 'about:downloads';
        break;

      case "addons":
        params.url = 'about:addons';
        params.isTab = true;
        break;

      case "sync":
        params.url = 'about:preferences?entrypoint=abouthome#sync';
        params.isTab = true;
        break;

      case "settings":
        params.url = 'about:preferences';
        params.isTab = true;
        break;
    }

    forwardToProxy(params);
  };

  run();

})();
