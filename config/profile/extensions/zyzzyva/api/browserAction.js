
dump('browserAction\n');

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("resource://gre/modules/ExtensionUtils.jsm");

var {
    EventManager,
    runSafe,
} = ExtensionUtils;

function getChannel(name, callback) {
  let window = Services.wm.getMostRecentWindow(null);
  if (window.document.readyState != "complete") {
    window.setTimeout(getChannel, 1000, name, callback);
    return;
  }
  // As window is an xray, attributes on it are not visible to the content
  let channel = window["BroadcastChannel-" + name];
  if (!channel) {
    channel = window["BroadcastChannel-" + name] = new window.BroadcastChannel(name);
  }
  callback(channel);
}

function dispatch(name, action, options) {
  getChannel(name, channel => {
    channel.postMessage({ action, options });
  });
}

function listen(name, event, callback) {
  getChannel(name, channel => {
    channel.addEventListener("message", function ({data}) {
      if (data.event == event) {
        callback(event, data.args);
      }
    });
  });
}

let browserActionMap = new Map();

const INTEGER = /^[1-9]\d*$/;
function normalize(path, extension) {
  let result = {};
  if (typeof path != "object") {
    path = {"19": path};
  }

  let baseURI = extension.baseURI;

  for (let size of Object.keys(path)) {
    if (!INTEGER.test(size)) {
      throw new Error(`Invalid icon size ${size}, must be an integer`);
    }

    let url = baseURI.resolve(path[size]);

    // The Chrome documentation specifies these parameters as
    // relative paths. We currently accept absolute URLs as well,
    // which means we need to check that the extension is allowed
    // to load them. This will throw an error if it's not allowed.
    /*
    Services.scriptSecurityManager.checkLoadURIStrWithPrincipal(
      extension.principal, url,
      Services.scriptSecurityManager.DISALLOW_SCRIPT);
    */

    result[size] = url;
  }
  return result;
}

let btnCount = 1;
function BrowserAction(options, extension) {
  let title = extension.localize(options.default_title || "");
  let popup = extension.localize(options.default_popup || "");
  if (popup) {
    popup = extension.baseURI.resolve(popup)
  }
  this._defaults = {
    id: btnCount++,
    enabled: true,
    title: title,
    badgeText: "",
    badgeBackgroundColor: null,
    icon: normalize(options.default_icon, extension),
    popup: popup,
  };
  this._data = this._defaults;
  this._build();
  this._listeners = new Set();
  this.onClick = this.onClick.bind(this);
}
BrowserAction.prototype = {
  _build() {
    dispatch("browserAction", "update", this._data);
    listen("browserAction", "click", this.onClick.bind(this));
  },
  onClick(_, {buttonId}) {
    if (buttonId != this._data.id) {
      return;
    }
    if (this._data.popup) {
      dispatch("browserAction", "openPopup", { id: this._data.id, popup: this._data.popup });
    }
    for(let listener of this._listeners) {
      listener();
    }
  },
  _update(data) {
    dispatch("browserAction", "update", data);
  },
  getProperty(name, tabId) {
    return this._data[name];
  },
  setProperty(name, value, tabId) {
    this._data[name] = value;
    this._update(this.data);
  },
  addClickListener(listener) {
    dump(" add click listener\n");
    this._listeners.add(listener);
  },
  removeClickListener(listener) {
    this._listeners.delete(listener);
  }
};

let onManifest = (type, directive, extension, manifest) => {
  let browserAction = new BrowserAction(manifest.browser_action, extension);
  browserActionMap.set(extension, browserAction);
};
extensions.on("manifest_browser_action", onManifest);

extensions.registerAPI((extension, context) => {
  function getProperty(property, value, tabIdOrDetails) {
    let tabId = typeof(tabIdOrDetails) == "object" && tabIdOrDetails.tabId ?
                tabIdOrDetails.tabId : tabIdOrDetails;
    browserActionMap.get(extension).getProperty(property, value, tabId);
  }
  function setProperty(property, value, tabIdOrDetails) {
    let tabId = typeof(tabIdOrDetails) == "object" && tabIdOrDetails.tabId ?
                tabIdOrDetails.tabId : tabIdOrDetails;
    browserActionMap.get(extension).setProperty(property, tabId);
  }
  let browserAction = {
    onClicked: new EventManager(context, "browserAction.onClicked", fire => {
      let listener = () => {
        let tab;
        fire(tab);
      };
      browserActionMap.get(extension).addClickListener(listener);
      return () => {
        browserActionMap.get(extension).removeClickListener(listener);
      };
    }).api(),
    enable(tabId) {
      setProperty("enabled", true, tabId);
    },
    disable(tabId) {
      setProperty("enabled", true, tabId);
    },
    setTitle(details) {
      setProperty("title", details.title, details);
    },
    getTitle(details, callback) {
      getProperty("title", details.title, details);
    },
    setIcon(details, callback) {
      setProperty("icon", details.icon, details);
    },
    setBadgeText(details) {
      setProperty("badgeText", details.text);
    },
    getBadgeText(details, callback) {
      getProperty("badgeText", details);
    },
    setPopup(details) {
      let url = details.popup;
      setProperty("popup", url, details);
    },
    getPopup(details, callback) {
      getProperty("popup", details);
    },
    setBadgeBackgroundColor(details) {
      setProperty("popup", details.color, details);
    },
    getBadgeBackgroundColor(details, callback) {
      getProperty("popup", details);
    },
  }
  return { browserAction };
});

dump("browserAction.js: parsed\n");
