/**
 *
 * Implement the tabs WebExtension API
 *
 * Allow addons to manage browser tabs.
 *
 */

define(['tabs'], function(Tabs) {
  let channel = new BroadcastChannel("tabs");
  channel.onmessage = function ({data}) {
    if (data.action == "create") {
      Tabs.add({select: true, url: data.options.url});
    }
  };
});
