
//
// Startup prefs
//

//user_pref("toolkit.defaultChromeURI", "http://browserhtml.org/hidden.html");
user_pref("browser.chromeURL", "http://browserhtml.org/index.html");
user_pref("permissions.manager.defaultsUrl", "http://browserhtml.org/config/permissions");
user_pref("network.dns.localDomains", "browserhtml.org");

//
// Multi-Process prefs
//

user_pref("browser.tabs.remote.autostart", true);
user_pref("dom.ipc.processCount", 10000);

// Enable pre-launching content processes for improved startup time
// (hiding latency).
user_pref("dom.ipc.processPrelaunch.enabled", true);
// Wait this long before pre-launching a new subprocess.
user_pref("dom.ipc.processPrelaunch.delayMs", 5000);

//
// Additional dom apis
//

user_pref("dom.webcomponents.enabled", true);
user_pref("dom.mozBrowserFramesEnabled", true);
user_pref("dom.webextensions-uiglue.enabled", true);

//
// GFX Prefs
//
user_pref("layers.compositor-lru-size", 10);

//
// Extensions
//
user_pref("extensions.autoDisableScopes", 0);
user_pref("xpinstall.signatures.required", false);

//
// Debugging Prefs
//

// Disable caching for html content
user_pref("browser.cache.disk.enable", false);

// Ctrl-C to kill the browser ends up triggering
// the sage mode window. It's really annoying while
// hacking, so let disable that.
user_pref("toolkit.startup.max_resumed_crashes", -1);

// window.dump() on the console
user_pref("browser.dom.window.dump.enabled", true);

// Allow -jsdebugger flag
user_pref("devtools.debugger.remote-enabled", true);
user_pref("devtools.chrome.enabled", true);
user_pref("devtools.debugger.prompt-connection", false);

