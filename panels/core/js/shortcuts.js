

require([
  '/shared/js/keybindings.js',
  'browsers'
], function(
  RegisterKeyBindings,
  Browsers
) {

  RegisterKeyBindings(
    ['',              'Esc',        () => Browsers.getSelected().stop()],
    ['',              'F5',         () => Browsers.getSelected().reload()],
    ['Ctrl',          'i',          () => Browsers.getSelected().toggleDevtools()]
  );

  if (window.OS == 'linux' || window.OS == 'windows') {
    RegisterKeyBindings(
      ['Ctrl',          'r',          () => Browsers.getSelected().reload()],
      ['Alt',           'Left',       () => Browsers.getSelected().goBack()],
      ['Alt',           'Right',      () => Browsers.getSelected().goForward()],
      ['Ctrl Shift',    '+',          () => Browsers.getSelected().zoomIn()],
      ['Ctrl',          '=',          () => Browsers.getSelected().zoomIn()],
      ['Ctrl',          '-',          () => Browsers.getSelected().zoomOut()],
      ['Ctrl',          '0',          () => Browsers.getSelected().resetZoom()]
    );
  }

  if (window.OS == 'osx') {
    RegisterKeyBindings(
      ['Cmd',       'r',          () => Browsers.getSelected().reload()],
      ['Cmd',       'Left',       () => Browsers.getSelected().goBack()],
      ['Cmd',       'Right',      () => Browsers.getSelected().goForward()],
      ['Cmd Shift', '+',          () => Browsers.getSelected().zoomIn()],
      ['Cmd',       '=',          () => Browsers.getSelected().zoomIn()],
      ['Cmd',       '-',          () => Browsers.getSelected().zoomOut()],
      ['Cmd',       '0',          () => Browsers.getSelected().resetZoom()]
    );
  }

});
