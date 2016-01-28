
//
// Startup prefs
//

//pref("toolkit.defaultChromeURI", "http://browserhtml.org/hidden.html");
pref("browser.chromeURL", "http://browserhtml.org:8081/index.html");
pref("permissions.manager.defaultsUrl", "http://browserhtml.org:8081/config/permissions");
pref("network.dns.localDomains", "browserhtml.org");

//
// Multi-Process prefs
//

pref("browser.tabs.remote.autostart", true);
pref("dom.ipc.processCount", 10000);

// Enable pre-launching content processes for improved startup time
// (hiding latency).
pref("dom.ipc.processPrelaunch.enabled", true);
// Wait this long before pre-launching a new subprocess.
pref("dom.ipc.processPrelaunch.delayMs", 5000);

//
// Additional dom apis
//

pref("dom.webcomponents.enabled", true);
pref("dom.mozBrowserFramesEnabled", true);
pref("dom.webextensions-uiglue.enabled", true);

//
// GFX Prefs
//
pref("layers.compositor-lru-size", 10);

//
// Extensions
//
pref("extensions.autoDisableScopes", 0);
pref("xpinstall.signatures.required", false);

//
// Debugging Prefs
//

// Disable caching for html content
pref("browser.cache.disk.enable", false);

// Ctrl-C to kill the browser ends up triggering
// the sage mode window. It's really annoying while
// hacking, so let disable that.
pref("toolkit.startup.max_resumed_crashes", -1);

// window.dump() on the console
pref("browser.dom.window.dump.enabled", true);

// Allow -jsdebugger flag
pref("devtools.debugger.remote-enabled", true);
pref("devtools.chrome.enabled", true);
pref("devtools.debugger.prompt-connection", false);

