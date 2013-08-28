var async = require('async'),
  _ = require('underscore'),
  mongo = require('mongoskin');

module.exports = exports = Data;

var DEFAULT_OPTIONS = {
  logLevel: 1
};

function Data(options) {

  this.me = 'Data';
  this.data = {};

  this.options = _.defaults({}, DEFAULT_OPTIONS, options || 0);

  this.domain = options.domain || 'www1.hobbitmobile.com';

  this.databaseName = getDatabaseName(this.domain);
}

Data.prototype.get = function (type) {
  return this.data[type];
};

Data.prototype.set = function (type, data) {
  this.data[type] = data;
};


Data.prototype.loadDB = function (type, options, cb) {
  var self = this;
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  _.defaults(options, {
    host: 'kom.trap4004.com',
    port: 27017,
    query: {},
    limit: 999999
  });

  var databaseUrl = options.host + ':' + options.port + '/' + self.databaseName + '?auto_reconnect';

  if (self.options.logLevel > 1) console.log('CONNECTING to', databaseUrl);
  self.db = new mongo.db(databaseUrl, {w: 1});

  if (self.options.logLevel > 1) console.log("You are now connected to mongo.");

  if (self.options.logLevel > 1) console.log('  loading', type);

  self.collection = self.db.collection(type + 'Data').ensureIndex('id', true, function (err) {
/*    if (err) {
      cleanupdups(self.collection);
    }*/
  });

  if (type === 'report') {
    self.collection.ensureIndex('reportUnixTime', {unique: false}, function () {});
  }

  self.collection.find(options.query).limit(options.limit).sort('_id').toArray(function (err, data) {
    if (!data) return;
    if (self.options.logLevel) console.log('    loaded', data ? data.length : -1, type);
    self.data[type] = data;
    cb(err, data);
  });

};

function cleanupdups(collection) {
  collection.ensureIndex('id', true, function (err) {
    if (err) {
      var bits = err.err.split('"');
      console.log('removing', bits[1]);
      collection.remove({id: bits[1]}, true, function () {
        cleanupdups(collection);
      }
      );
    }
  });
}

Data.prototype.findItem = function (id, type, cb) {
  var self = this;
  self.db.collection(type + 'Data', function (err, collection) {

    collection.findOne({
      'id': id
    }).toArray(function (err, data) {
      cb(err, data);
    });
  });

};

Data.prototype.find = function (type, limit, cb) {
  var self = this;
  var l = limit || 150;
  // TODO: use collection, not DB
  self.db.find({}).limit(l).sort({
    '_id': 1
  }).toArray(function (err, data) {
    cb(err, data);
  });
};

Data.prototype.saveItem = function (id, item, type, cb) {
  var self = this;

  self.initDB(function (err) {
    if (err) return cb(err);
    if (self.options.logLevel > 1) console.log('id', id, 'item', item, 'type', type, typeof cb);
    if (self.options.logLevel > 0) console.log('saving', id);

    self.db.collection(type + 'Data').update({
      'id': id
    }, {
      $set: item
    }, {
      'upsert': true
    }, function (err, docs) {
      if (err) return cb(err);

      if (self.options.logLevel > 0) console.log('id', id, 'saved');
      cb(null, docs[0]);
    });
  });


};

Data.prototype.saveDB = function (type, cb) {
  var self = this;

  // Convert object with keys to array with key as "id" field.
  var aData = [];
  _.each(self.data[type], function (value, key) {
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

        self._updateOne(item, type, collection, function (err, docs) {
          if (err) return next(err);
          next(null);
        });

      }, function (err) {
        if (err) {
          console.error('error updating', type, err);
          return cb(err);
        }
        console.log('saved', type);
        cb();
      });
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
    criteria, values, options, function (err, docs) {
      if (err) return cb(err);
      cb(null, docs[0]);
    });
  });
};

Data.prototype._updateOne = function (id, item, type, collection, cb) {
  collection.update({
    'id': id
  }, {
    $set: item
  }, {
    'upsert': true
  }, function (err, docs) {
    if (err) return cb(err);
    cb(null, docs[0]);
  });

};

Data.prototype.initDB = function (cb) {
  var self = this;

  cb(null);


};

function getDatabaseName(domain) {
  var domainParts = domain.split('.');
  var gameNumber = domainParts[0].substring(3);

  var databaseName = domainParts[1] + '-' + gameNumber;
  return databaseName;
}

