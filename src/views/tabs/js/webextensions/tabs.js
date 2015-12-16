/**
 *
 * Implement the tabs WebExtension API
 *
 * Allow addons to manage browser tabs.
 *
 */

define([], function() {
  let channel = new BroadcastChannel("tabs");
  channel.onmessage = function ({data}) {
    if (data.action == "create") {
      Services.tabs.method('add', {select: true, url: data.options.url});
    }
  };
});
