require.config({
  scriptType: 'text/javascript;version=1.8'
});

require([
  'popuphelper'
], function(PopupHelper) {

  PopupHelper
    .service
    .method('openTooltip', PopupHelper.openTooltip.bind(PopupHelper))
    .method('openContextMenu', PopupHelper.openContextMenu.bind(PopupHelper))
    .method('openPanel', PopupHelper.openPanel.bind(PopupHelper))
    .method('openPopup', PopupHelper.openPopup.bind(PopupHelper))
    .method('update', PopupHelper.update.bind(PopupHelper))
    .method('close', PopupHelper.close.bind(PopupHelper))
    .listen(new BroadcastChannel('popups'));
});
