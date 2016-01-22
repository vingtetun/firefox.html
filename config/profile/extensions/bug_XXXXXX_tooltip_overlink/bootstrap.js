dump('bug_XXXXXX\n');

const Cu = Components.utils;
const Ci = Components.interfaces;
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://webextensions/glue.jsm');

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

  function checkWebProgressStatus(webProgress, flags) {
    if (!webProgress.isTopLevel) {
      return false;
    }

    if (!(flags & Ci.nsIWebProgressListener.STATE_STOP)) {
      return false;
    }

    return true;
  }

  function installProgressListener(aXULWindow) {
    let progressListener = {
      onStateChange: function (webProgress, req, flags, status) {
        checkWebProgressStatus(webProgress, flags) && configureXULWindow(aXULWindow);
      },

      QueryInterface: XPCOMUtils.generateQI(['nsISupportsWeakReference'])
    };

    let wp = aXULWindow.docShell.QueryInterface(Ci.nsIWebProgress);
    wp.addProgressListener(progressListener, wp.NOTIFY_STATE_WINDOW);
  }

  Services.wm.addListener({
    onOpenWindow: installProgressListener,
    onCloseWindow: function(aXULWindow) {},
    onWindowTitleChange: function(aXULWindow, aNewTitle) {}
  });
}

function install() {
}

function shutdown() {
}
