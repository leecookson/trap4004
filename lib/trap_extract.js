var async = require('async'),
  _ = require('underscore'),
  AllianceData = require('./data/alliance_data'),
  BookmarkData = require('./data/bookmark_data'),
  MapData = require('./data/map_data'),
  ReportData = require('./data/report_data'),
  UserData = require('./data/user_data'),
  exec = require('child_process').exec;

module.exports = TrapExtract;

function TrapExtract(host, path) {
  this.host = host; // in form www{gameNumber}.{gameDomain}
  this.path = path;
  this.handle = this.handlers[path] || this.defaultHandler;
}

TrapExtract.prototype.defaultHandler = function (data, cb) {
  cb(new Error('UnhandledPath', this.path));
};

TrapExtract.prototype.handlers = {};

TrapExtract.prototype.handlers['/ajax/fetchMapTiles.php'] = function (mapObj, cb) {
  var self = this;

  // console.log('map data', mapObj.data);
  var userData = new UserData(self.host);
  var mapData = new MapData(self.host);

  async.waterfall(
    [
      function (next) {
        userData.handleMapUsers(mapObj.userInfo, next);
      },
      function (next) {
        mapData.handleMap(mapObj.data, next);
      }
    ],
    function (err) {
      mapData.close();
      userData.close();
      cb(err);
    }
  );

};

TrapExtract.prototype.handlers['/ajax/listReports.php'] = function (report, cb) {

  var self = this;

  //console.log('report data', report);
  var userData = new UserData(self.host);

  userData.handleReportUsers(report.arPlayerNames, function (err) {
    if (err) console.log('error handling report users', err, err.stack);

    var reportData = new ReportData(self.host);

    reportData.handleReports(report.arReports, function (err) {
      if (err) console.log('error handling reports', err, err.stack);

      var allianceData = new AllianceData(self.host);

      allianceData.handleReportAlliances(report.arAllianceNames, function (err) {
        if (err) console.log('error handling report alliances', err, err.stack);

        allianceData.close();
        reportData.close();
        userData.close();
        cb(err);
      });
    });
  });
};


TrapExtract.prototype.handlers['/ajax/allianceGetMembersInfo.php'] = function (report, cb) {
  var self = this;

  //console.log('report data', report);
  var userData = new UserData(self.host);

  process.nextTick(cb);
  userData.handleAllianceUsers(report.allianceId, report.memberInfo, function (err) {
      userData.close();
    }
  );

};

TrapExtract.prototype.handlers['/ajax/getLeaderboard.php'] = function (report, cb) {
  var self = this;

  //console.log('report data', report);
  var userData = new UserData(self.host);

  // Fire and forget, proxy to server immediately, and store this with no error handling.
  process.nextTick(cb);
  userData.handleLeaderboard(report.leaderboard, function (err) {
      userData.close();
    }
  );

  console.log('leaderboard, about to run reports');

  runReports();

};

TrapExtract.prototype.handlers['/ajax/tileBookmark.php'] = function (report, cb) {
  var self = this;

  //console.log('report data', report);
  var bookmarkData = new BookmarkData(self.host);

  bookmarkData.handleBookmarks(report.bookmarkInfo, function (err) {
    bookmarkData.close();
    cb(err);
  });

};

TrapExtract.prototype.handlers['/ajax/allianceGetOtherInfo.php'] = function (report, cb) {
  var self = this;

  //console.log('report data', report);
  var allianceData = new AllianceData(self.host);

  allianceData.handleAlliances(report.otherAlliances, function (err) {
    allianceData.close();
    cb(err);
  });

};


//TODO: refactor this to it's own class
var runLimit = false;
function runReports() {
  if (runLimit) return;

  console.log('running reports', new Date());
  runLimit = true;
  setTimeout(function () {runLimit = false;}, 120000);

  exec('bin/fa', function (err, stdout, stderr) {
    if (err) console.log(err, stderr, process.cwd());
    console.log('stdout');
    console.log('reports run');
  });
}
