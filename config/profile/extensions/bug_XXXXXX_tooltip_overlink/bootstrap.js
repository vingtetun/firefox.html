dump('bug_XXXXXX\n');

const Cu = Components.utils;
const Ci = Components.interfaces;
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Services.jsm');
XPCOMUtils.defineLazyModuleGetter(this, 'WindowUtils',
                                  'resource://webextensions/glue.jsm');

function startup() {
  let XULBrowserWindow = {
    setOverLink: function(url, anchorElm) {
      let data = {
        id: 'overlink',
        url: url
      };

      if (url) {
        WindowUtils.emit('popups', 'openOverLink', data);
      } else {
        WindowUtils.emit('popups', 'close', data);
      }
    },

    showTooltip: function (x, y, tooltip) {
      let data = {
        id: 'tooltip',
        x: this.x,
        y: this.y,
        tooltip: tooltip
      };

      WindowUtils.emit('popups', 'openTooltip', data);
    },

    hideTooltip: function() {
      let data = {
        id: 'tooltip'
      }
      WindowUtils.emit('popups', 'close', data);
    },

    x: 0,
    y: 0,
    trackMouseCursor(aWindow) {
      aWindow.addEventListener('mousemove', e => {
        this.x = (e.screenX - aWindow.mozInnerScreenX);
        this.y = (e.screenY - aWindow.mozInnerScreenY);
      });
    }
  };

  function configureXULWindow(aXULWindow) {
    let window = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                           .getInterface(Ci.nsIDOMWindow);

    window.QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsIWebNavigation)
          .QueryInterface(Ci.nsIDocShellTreeItem).treeOwner
          .QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsIXULWindow)
          .XULBrowserWindow = XULBrowserWindow;
    
    XULBrowserWindow.trackMouseCursor(window);
  }

  Services.wm.addListener({
    onOpenWindow: configureXULWindow,
    onCloseWindow: function(aXULWindow) {},
    onWindowTitleChange: function(aXULWindow, aNewTitle) {}
  });
}

function install() {
}

function shutdown() {
}
