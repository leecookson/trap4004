var async = require('async'),
  _ = require('underscore'),
  mongodb = require('mongodb'),
  mongo = require('mongoskin');

module.exports = exports = Data;

var allFiles = ['user', 'ally', 'map', 'bookmark', 'report'];
var DEFAULT_OPTIONS = {
  logLevel: 0
};

function Data(options) {
  var self = this;

  this.me = 'Data';
  this.data = {};
  this.dbStatus = "CLOSED";

  this.options = _.defaults({}, DEFAULT_OPTIONS, options);

  allFiles.forEach(function (file) {
    self.data[file] = {};
  });
}


Data.prototype.get = function (type) {
  return this.data[type];
};

Data.prototype.set = function (type, data) {
  this.data[type] = data;
};


Data.prototype.loadAll = function (cb) {

  var self = this;

  async.map(allFiles, function (item, next) {
    self.loadDB(item, {}, next);
  },
  function (err, results) {
    if (self.options.logLevel) {console.log('    all loaded'); }
    cb(err, null);
  });
};

Data.prototype.saveAll = function (cb) {

  var self = this;

  async.waterfall(
    [
      function (next) {
        self.saveDB('user', next);
      },

      function (next) {
        self.saveDB('ally', next);
      },

      function (next) {
        self.saveDB('map', next);
      },

      function (next) {
        self.saveDB('report', next);
      },

      function (next) {
        self.saveDB('bookmark', next);
      }
    ],

    function (err) {
      cb(err);
    }
  );
};

Data.prototype.loadDB = function (type, options, cb) {
  var self = this;
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  _.defaults(options, {query: {}, limit: 99999});

  if (self.options.logLevel > 1) console.log('  loading', type);

  self.initDB(function (err) {
    if (err) return cb(err);

    // TODO: cache/pool conections?  Don't open close collection each time?
    self.db.collection(type + 'Data', function (err, collection) {
      if (err) {
        console.error('error', err);
        return cb(new Error('db error'));
      }
      collection.ensureIndex('reportUnixTime', true, function (err, replies) {});
      collection.ensureIndex('id', true, function (err, replies) {});


      collection.find(options.query).limit(options.limit).sort('_id').toArray(function (err, data) {
        if (!data) return;
        if (self.options.logLevel) console.log('    loaded', data ? data.length : -1, type);
        self.data[type] = data;
        cb(err, data);
      });
    });
  });

};

Data.prototype.findItem = function (id, type, cb) {
  var self = this;
  self.db.collection(type + 'Data', function (err, collection) {

    collection.findOne({'id': id}).toArray(function (err, data) {
      cb(err, data);
    });
  });

};

Data.prototype.find = function (type, limit, cb) {
  var self = this;
  var l = limit || 150;
// TODO: use collection, not DB
  var results = self.db.find({}).limit(limit).sort({'_id': 1}).toArray(function (err, data) {
    cb(err, data);
  });
};

Data.prototype.saveItem = function (id, item, type, cb) {
  var self = this;

  if (self.options.logLevel > 1) console.log('id', id, 'item', item, 'type', type, typeof cb);
  if (self.options.logLevel > 0) console.log('saving', id);

  db.collection(type + 'Data').update(
      {'id': id},
      {$set: item},
      {'upsert': true},
      function (err, docs) {
        if (err) return cb(err);

        if (self.options.logLevel > 0) console.log('id', id, 'saved');
        cb(null, docs[0]);
      }
    );


};

Data.prototype.saveDB = function (type, cb) {
  var self = this;

  // Convert object with keys to array with key as "id" field.
  var aData = [];
  _.each(self.data[type], function (value, key, list) {
    value.id = key;
    aData.push(value);
  });

  self.initDB(function (err) {
    if (err) return cb(err);

    // TODO: cache collections?  Don't open close collection each time?
    self.db.collection(type + 'Data', function (err, collection) {

      if (err) {
        console.error('error', err);
        return cb(new Error('db error'));
      }
      async.each(aData, function (item, next) {

        self._updateOne(item, type, collection,
          function (err, docs) {
            if (err) return next(err);
            next(null);
          }
        );

      }, function (err) {
        self.db.close();
        self.dbStatus = "CLOSED";
        if (err) {
          console.error('error updating', type, err);
          return cb(err);
        }
        console.log('saved', type);
        cb();
      }
      );
    });
  });
};

Data.prototype.update = function (type, criteria, values, options, cb) {
  this.db.collection(type + 'Data', function (err, collection) {

    if (err) {
      console.error('error', err);
      return cb(new Error('db error'));
    }
    collection.update(
      criteria,
      values,
      options,
      function (err, docs) {
        if (err) return cb(err);
        cb(null, docs[0]);
      }
    );
  });
};

Data.prototype._updateOne = function (id, item, type, collection, cb) {
  collection.update(
    {'id': id},
    {$set: item},
    {'upsert': true},
    function (err, docs) {
      if (err) return cb(err);
      cb(null, docs[0]);
    }
  );

};

Data.prototype.initDB = function (cb) {

  var self = this;
  if (self.dbStatus === "CONNECTED") {
    //console.log('already CONNECTED');
    return cb(null);
  }

  if (self.dbStatus === "ERROR") {
    console.error('DB ERROR');
    return cb(new Error('DB ERROR'));
  }

  if (self.dbStatus === "CONNECTING") {
    //console.log('CONNECTING, retry');
    return setTimeout(function () {
      self.initDB(cb);
    }, 1000);
  }

  self.dbStatus = "CONNECTING";

  if (self.options.logLevel > 1) console.log('CONNECTING on port 21017');

  // mongo ds051977.mongolab.com:51977/nodejitsu_leecookson_nodejitsudb3997674125 -u nodejitsu_leecookson -p oln6511kbfp3q824a54s5akhgo
  /*
  self.db = new mongodb.Db('nodejitsu_leecookson_nodejitsudb3997674125',
    new mongodb.Server('ds051977.mongolab.com', 51977, {}), {w: 1}
  );
  */
  self.db = new mongodb.Db('trap4004',
    new mongodb.Server('localhost', 27017, {}), {w: 1}
  );

  self.db.open(function (err, db_p) {
    if (err) {
      self.dbStatus = "ERROR";
      console.error('open error', err);
      cb(err);
    }

    self.dbStatus = 'CONNECTED';
    if (self.options.logLevel > 1) console.log("You are now connected to mongo.");
    cb(null);
    /*
    console.log('LOGGING IN');
    self.db.authenticate('nodejitsu_leecookson', 'oln6511kbfp3q824a54s5akhgo', function (err, replies) {
      self.dbStatus = 'CONNECTED';
      console.log("You are now connected and authenticated to mongo.");
      cb(null);
    });
    */
  });

};

Data.prototype.closeDB = function () {

  if (this.db) this.db.close();

};

var db = mongo.db('localhost:27017/trap4004', {w: 1});

