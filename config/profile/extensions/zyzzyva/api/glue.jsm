
Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = ['WindowUtils'];

var WindowUtils = {
  getWindow: function() {
    return Services.wm
                   .getMostRecentWindow('navigator:browser')
                   .frames[0];
  },

  getService: function(name) {
    return this.getWindow().wrappedJSObject.Services[name];
  },

  cloneInto: function(obj) {
    return Components.utils.cloneInto(obj, WindowUtils.getWindow());
  },
};
