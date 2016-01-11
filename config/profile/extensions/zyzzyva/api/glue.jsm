
Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/PromiseUtils.jsm');

var EXPORTED_SYMBOLS = ['WindowUtils'];

var WindowUtils = {
  emit: function(service, action, options) {
    let data = this.cloneInto(options);
    this.getService(service).method(action, data);
  },

  on: function(service, action, cb) {
    let func = this.cloneFunction(cb);
    this.getService(service).on(action, func);
  },

  ready: function() {
    let deferred = PromiseUtils.defer();

    this.getWindow().wrappedJSObject.Services.ready.then(() => {
      deferred.resolve();
    });

    return deferred.promise;
  },

  getWindow: function() {
    return Services.wm
                   .getMostRecentWindow('navigator:browser')
                   .frames[0];
  },

  getService: function(name) {
    return this.getWindow().wrappedJSObject.Services[name];
  },

  cloneFunction: function(obj) {
    return Components.utils.cloneInto(obj, WindowUtils.getWindow(), {
      cloneFunctions: true
    });
  },

  cloneInto: function(obj) {
    return Components.utils.cloneInto(obj, WindowUtils.getWindow());
  },
};
