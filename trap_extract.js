var async = require('async'),
  _ = require('underscore'),
  AllianceData = require('./alliance_data'),
  BookmarkData = require('./bookmark_data'),
  MapData = require('./map_data'),
  ReportData = require('./report_data'),
  UserData = require('./user_data'),
  exec = require('child_process').exec;

module.exports = TrapExtract;

function TrapExtract(path) {
  this.path = path;
  this.handle = this.handlers[path] || this.defaultHandler;
}

TrapExtract.prototype.defaultHandler = function (data, cb) {
  cb(new Error('UnhandledPath', this.path));
};

TrapExtract.prototype.handlers = {};

TrapExtract.prototype.handlers['/ajax/fetchMapTiles.php'] = function (mapObj, cb) {

  // console.log('map data', mapObj.data);
  var userData = new UserData();
  var mapData = new MapData();

  async.waterfall(
    [
      function (next) {
        userData.handleMapUsers(mapObj.userInfo, next);
      },
      function (next) {
        mapData.handleMap(mapObj.data, cb);
      }
    ],
    function (err) {
      mapData.close();
      userData.close();
      cb(err);
    }
  );
//    _.extend(userData, mapObj.userInfo);
//    _.extend(allyData, mapObj.allianceNames);
//    _.each(mapObj.allianceMights, function (value, key, list) {
//      updateAlliance(allyData, key, {might: value});
//    });
//  });

};

TrapExtract.prototype.handlers['/ajax/listReports.php'] = function (report, cb) {

  //console.log('report data', report);
  var userData = new UserData();

  userData.handleReportUsers(report.arPlayerNames, function () {

    var reportData = new ReportData();

    reportData.handleReports(report.arReports, function (err) {
      var allianceData = new AllianceData();

      allianceData.handleReportAlliances(report.arAllianceNames, function (err) {

        allianceData.close();
        reportData.close();
        userData.close();
        cb(err);
      });
    });
  });
};


TrapExtract.prototype.handlers['/ajax/allianceGetMembersInfo.php'] = function (report, cb) {

  //console.log('report data', report);
  var userData = new UserData();

  userData.handleAllianceUsers(report.memberInfo, function (err) {
      userData.close();
      cb(err);
    });

};

TrapExtract.prototype.handlers['/ajax/getLeaderboard.php'] = function (report, cb) {

  //console.log('report data', report);
  var userData = new UserData();

  userData.handleLeaderboard(report.leaderboard, function (err) {
      userData.close();
      cb(err);
    }
  );

  console.log('leaderboard, about to run reports');

  runReports();

};

TrapExtract.prototype.handlers['/ajax/tileBookmark.php'] = function (report, cb) {

  //console.log('report data', report);
  var bookmarkData = new BookmarkData();

  bookmarkData.handleBookmarks(report.bookmarkInfo, function (err) {
    bookmarkData.close();
    cb(err);
  });

};

TrapExtract.prototype.handlers['/ajax/allianceGetOtherInfo.php'] = function (report, cb) {

  //console.log('report data', report);
  var allianceData = new AllianceData();

  allianceData.handleAlliances(report.otherAlliances, function (err) {
    allianceData.close();
    cb(err);
  });

};

var runLimit = false;

function runReports() {
  if (runLimit) return;

  console.log('running reports', new Date());
  runLimit = true;
  setTimeout(function () {runLimit = false;}, 120000);

  exec('./fa', function (err, stdout, stderr) {
    console.log('stdout');
    console.log('reports run');
  });
}
