
require([
  '/src/shared/js/keybindings.js',
  'tabs'
], function(
  RegisterKeyBindings,
  Tabs
) {
  RegisterKeyBindings(
    // Debug Mode
    ['Ctrl',          'z',          () => document.location.reload(true)],

    ['Ctrl',          'Tab',        () => Tabs.selectNext()],
    ['Ctrl Shift',    'code:9',     () => Tabs.selectPrevious()]
  );

  if (window.OS == 'linux' || window.OS == 'windows') {
    RegisterKeyBindings(
      ['Ctrl',          't',          () => Tabs.add({select: true})],
      ['Ctrl',          'w',          () => Tabs.remove(Tabs.getSelected().uuid)],
      ['Ctrl',          'PageUp',     () => Tabs.selectPrevious()],
      ['Ctrl',          'PageDown',   () => Tabs.selectNext()],
      ['Ctrl Shift',    'PageUp',     () => Tabs.movePrevious()],
      ['Ctrl Shift',    'PageDown',   () => Tabs.moveNext()]
    );
  }

  if (window.OS == 'osx') {
    RegisterKeyBindings(
      ['Cmd',       'w',          () => Tabs.remove(Tabs.getSelected().uuid)]
    );
  }
});
