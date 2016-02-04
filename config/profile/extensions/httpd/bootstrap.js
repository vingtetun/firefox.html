/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

function startup(data, reason) {
  const CC = Components.Constructor;
  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;
  const Cm = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

  Cu.import('resource://gre/modules/Services.jsm');

  const LocalFile = CC('@mozilla.org/file/local;1',
                       'nsILocalFile',
                       'initWithPath');

  let baseDir = Cc['@mozilla.org/process/environment;1']
                  .getService(Ci.nsIEnvironment)
                  .get('MOZ_BASE_DIR');

  if (!baseDir) {
    dump('You must specify the directory where the UI comes from.\n');
    dump('Use MOZ_BASE_DIR as an env variable.\n');
    return;
  }
  baseDir = new LocalFile(baseDir);

  dump("baseDir > "+baseDir.path+"\n");
  const httpdURL = 'chrome://httpd.js/content/httpd.js';
  let httpd = {};
  Services.scriptloader.loadSubScript(httpdURL, httpd);
  let server = new httpd.nsHttpServer();
  server.registerDirectory('/', baseDir);
  server.start(8081);
  server.identity.add("https", "browserhtml.org", 8081);
}

function shutdown(data, reason) {
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
