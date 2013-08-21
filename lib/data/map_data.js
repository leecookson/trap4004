var fs = require('fs'),
  async = require('async'),
  _ = require('underscore'),
  Data = require('./data'),
  mongodb = require('mongodb');

module.exports = exports = MapData;

function MapData(domain) {

  this.me = 'MapData';
  this.data = new Data({domain: domain});
}

MapData.prototype.close = function () {
  this.data.closeDB();
};

MapData.prototype.find = function (id, cb) {
  var self = this;

  self.data.findItem(id, 'map', cb);
};

MapData.prototype.update = function (id, item, cb) {
  var self = this;

  self.data.saveItem(id, item, 'map', cb);
};

MapData.prototype.handleMap = function (mapData, cb) {
  var self = this;

  async.each(
    _.keys(mapData),
   function (key, next) {
      var map = mapData[key];
      map.id = key;
      var do_it = _.once(function (err, data) {next(err, data); });
      self.update(key, map, function (err, data) {
        do_it(err, data);
      });
    },
    function (err) {
      cb(err);
    }
  );
};

