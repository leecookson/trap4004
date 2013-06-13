var async = require('async'),
  _ = require('underscore'),
  Data = require('./data');

module.exports = exports = AllianceData;

function AllianceData() {

  this.me = 'AllianceData';
  this.data = new Data();
}

AllianceData.prototype.close = function () {
  this.data.closeDB();
};

AllianceData.prototype.find = function (id, cb) {
  var self = this;

  self.data.findItem(id, 'alliance', cb);
};

AllianceData.prototype.update = function (id, item, cb) {
  var self = this;

  //console.log('updating user', id, item, 'user', typeof cb);
  self.data.saveItem(id, item, 'alliance', cb);
};

AllianceData.prototype.handleAlliances = function (allianceData, cb) {
  var self = this;

  async.each(
    _.keys(allianceData),
   function (key, next) {
      //console.log('key', key);
      var alliance = allianceData[key];
      alliance.id = key;
      var do_it = _.once(function (err, data) {next(err, data); });
      self.update(key, alliance, function (err, data) {
        do_it(err, data);
      });
    },
    function (err) {
      cb(err);
    }
  );
};


AllianceData.prototype.handleReportAlliances = function (allianceData, cb) {
  var self = this;

  async.each(
  _.keys(allianceData), function (key, next) {
    var allianceId = key.substring(1);
    var allianceName = allianceData[key];
    var alliance = {
      id: allianceId,
      allianceId: allianceId,
      name: allianceName
    };
    self.update(key, alliance, function (err, data) {
      next(err, data);
    });

    },
    function (err) {
      cb(err);
    }
  );
};
