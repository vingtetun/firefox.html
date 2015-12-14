
dump("Tabs\n");

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("resource://gre/modules/ExtensionUtils.jsm");
var {
    EventManager,
    runSafe,
} = ExtensionUtils;

function dispatch(name, event, options) {
  let window = Services.wm.getMostRecentWindow(null);
  // As window is an xray, attributes on it are not visible to the content
  let channel = window["BroadcastChannel-" + name];
  if (!channel) {
    channel = window["BroadcastChannel-" + name] = new window.BroadcastChannel(name);
  }
  channel.postMessage({ action: event, options });
}


function getSender(context, target, sender) {
  // The message was sent from a content script to a <browser> element.
  // We can just get the |tab| from |target|.
  if (target.tagName == "IFRAME") {
    // The message came from a content script.
    sender.tab = TabManager.convert(context.extension, target);
  } else if ("tabId" in sender) {
    // The message came from an ExtensionPage. In that case, it should
    // include a tabId property (which is filled in by the page-open
    // listener below).
    sender.tab = TabManager.convert(context.extension, TabManager.getTab(sender.tabId));
    delete sender.tabId;
  }
}

/* eslint-disable mozilla/balanced-listeners */
// This listener fires whenever an extension page opens in a tab
// (either initiated by the extension or the user). Its job is to fill
// in some tab-specific details and keep data around about the
// ExtensionPage.
extensions.on("page-load", (type, page, params, sender, delegate) => {
  if (params.type == "tab" || params.type == "popup") {
    let browser = params.docShell.chromeEventHandler;

    //let parentWindow = browser.ownerDocument.defaultView;
    //page.windowId = WindowManager.getId(parentWindow);

    if (params.type == "tab") {
      page.tabId = sender.tabId = TabManager.getId(browser);
    }

    //pageDataMap.set(page, {tab, parentWindow});
  }

  delegate.getSender = getSender;
});

extensions.registerSchemaAPI('tabs', null, (extension, context) => {
  return {
    tabs: {
      onClicked: new EventManager(context, "browserAction.onClicked", fire => {
          let listener = () => {
            let tab;
            fire(tab);
          };
          //add listener
          return () => {
            //remove listener
          };
        }).api(),

      create(createProperties) {
        dispatch("tabs", "create", createProperties);
      },
    },
  };
});

dump("Tabs.js: parsed\n");
