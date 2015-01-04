'use strict';

window.addEventListener('mozbrowserlocationchange', function(e) {
  if (!PlacesDatabase.isReady()) {
    // XXX Should just be postpone instead and we should
    // be careful about session store.
    return;
  }

  PlacesDatabase.incrementVisitCount(e.detail);
  PlacesDatabase.updateTimestamp(e.detail, Date.now());
});

var PlacesDatabase = {
  db: null,
  _saveTimeout: 0
};

PlacesDatabase.isReady = function() {
  return !!this.db;
};

PlacesDatabase.start = function() {
  this.db = null;

  this.restore();
};

PlacesDatabase.stop = function() {
  this.db = null;
};

PlacesDatabase.restore = function() {
  asyncStorage.getItem('places_history', (function(data) {
    dump(JSON.stringify(data));
    this.db = data || {};
  }).bind(this));
};

PlacesDatabase.save = function() {
  window.clearTimeout(this._saveTimeout);
  this._saveTimeout = window.setTimeout(function(self) {
    asyncStorage.setItem('places_history', self.db);
  }, 500, this);
};

PlacesDatabase.updateTitle = function(url, title) {
  var entry = this.getEntry(url);
  entry.title = title;

  this.save();
};

PlacesDatabase.updateTimestamp = function(url, timestamp) {
  var entry = this.getEntry(url);
  entry.last_visit_time = timestamp;

  this.save();
};

PlacesDatabase.incrementTypedCount = function(url) {
  var entry = this.getEntry(url);
  entry.typed_count++;

  this.save();
};

PlacesDatabase.incrementVisitCount = function(url) {
  var entry = this.getEntry(url);
  entry.visit_count++;

  this.save();
};

PlacesDatabase.getEntry = function(url) {
  if (!this.db[url]) {
    this.db[url] = {
      title: '',
      visit_count: 0,
      typed_count: 0,
      last_visit_time: 0
    };
  }

  return this.db[url];
};

PlacesDatabase.getMatches = function(value) {
  var results = [];

  for (var key in this.db) {
    if (key.indexOf(value) != -1) {
      results.push({url: key, title: this.db[key].title});
    }
  }

  return results;
};


PlacesDatabase.start();
