var async = require('async'),
  _ = require('underscore'),
  Data = require('./data');

module.exports = exports = UserData;

var allianceId = '15740';

function UserData() {

  this.me = 'UserData';
  this.data = new Data();
}

UserData.prototype.close = function () {
  this.data.closeDB();
};

UserData.prototype.find = function (id, cb) {
  var self = this;

  self.data.findItem(id, 'user', cb);
};

UserData.prototype.update = function (id, item, cb) {
  var self = this;

  //console.log('updating user', id, item, 'user', typeof cb);
  self.data.saveItem(id, item, 'user', cb);
};

UserData.prototype.handleMapUsers = function (mapUsers, cb) {
  var self = this;

  async.eachSeries(
    _.keys(mapUsers),
   function (key, next) {
      //console.log('key', key);
      var user = mapUsers[key];
      user.id = key;
      var do_it = _.once(function (err, data) { next(err, data); });
      self.update(key, user, function (err, data) {
        do_it(err, data);
      });
    },
    function (err) {
      cb(err);
    }
  );
};

UserData.prototype.handleReportUsers = function (reportUsers, cb) {
  var self = this;

  var users = this.blendUser(reportUsers);

  async.each(
    _.keys(users),
    function (key, next) {
      var user = users[key];
      user.id = key;
      self.update(key, user, function (err, data) {
        next(err, data);
      });
    },
    function (err) {
      cb(err);
    }
  );
};
UserData.prototype.handleAllianceUsers = function (allyUsers, cb) {
  var self = this;


  async.eachSeries(
    _.keys(allyUsers),
    function (key, next) {
      var user = allyUsers[key];
      user.id = 'u' + key;
      user.n = user.name;
      user.m = user.might;
      user.r = user.race;
      self.update(user.id, user, function (err, data) {
        next(err, data);
      });
    },
    function (err) {
      cb(err);
    }
  );
    user.a = allianceId;
};
/*
  leaderboard:
   [ { userId: '137590',
       race: '2',
       rank: '31',
       displayName: 'Lord_Hades',
       might: '38531651',
       title: '57',
       allianceId: '8936',
       allianceName: 'The Immortals' }
*/
UserData.prototype.handleLeaderboard = function (leaderboard, cb) {
  var self = this;

  async.eachSeries(
    leaderboard,
    function (item, next) {
      var user = {};
      user.id = 'u' + item.userId;
      user.m = item.might;
      user.r = item.race;
      user.a = item.allianceId;
      user.n = item.displayName;
      var do_it = _.once(function (err, data) { next(err, data); });
      self.update(user.id, user, function (err, data) {
        do_it(err, data);
      });
    }
  );
};

UserData.prototype.blendUser = function (userData) {

  var users = {};

  _.each(userData, function (value, key) {
    var userKey = 'u' + key.slice(1);

    if (!users[userKey]) {
      users[userKey] = {id: userKey};
    }

    if (key[0] === 'g') {
      // Just a user gender/sex
      users[userKey].s = value;
    }
    if (key[0] === 'r') {
      // Just a user race (elf/dwarf)
      users[userKey].r = value;
    }
    if (key[0] === 'p') {
      // Just a user name
      users[userKey].n = value;
    }
  });

  return users;
};
