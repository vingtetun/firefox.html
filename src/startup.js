
(function onBrowserStartup(global) {
  'use strict';

  const HOMEPAGE = 'about:home';

  let url = new URL(document.location.href).searchParams.get('url');

  Services.tabs.method('add', {
    url: url || HOMEPAGE,
    loading: true,
    select: true
  });

})(self);
