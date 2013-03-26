var _ = require('underscore')
  , colors = require('colors')
  , path = require('path')
  , fs = require('fs')
  , util = require('util')
  , traverse = require('traverse');

var Data = require('./data');
var dist = require('./dist');
var formatRes = require('./format_res');
var printf = require('printf');

var userName = process.argv[2] || 'all';

var ourAlliance = "1018";

var gameHoursShift = -4;

var now = new Date();

var startDaysAgo = 1;
var startReportTime = new Date();
startReportTime.setDate(now.getDate() - startDaysAgo);

var logLevel = 1; // 0 = nothing, 1 = normal, 2 = info
var data = new Data();

var earliestTime = new Date();
var latestTime = startReportTime;

process.on('uncaughtException', function (err) {
  console.log('Caught exception:', err, err.stack);
  process.exit(-1);
});

// TODO: filter reports by startDate
data.loadDB('report', {query: {'reportUnixTime': {$gt: (Math.floor(startReportTime.getTime() / 1000)).toString()}}}, function (err, reports) {
  data.loadDB('user', {query: {}}, function (err, users) {

    var reportsSorted = _.sortBy(reports, function (item) {return -(item.reportUnixTime); });

    if (userName === 'all') {
      console.log('looping over all users');

      users.forEach(function (user) {
        if (user.a === ourAlliance) {
          getUserHits(reportsSorted, users, user);
        }
      });

    } else {


      var user = (_.findWhere(users, {'n': userName}));
      if (!user) {
        console.error('User', userName, 'Not Found');
        process.exit(-1);
      }
      console.log('report for', user.n);
      getUserHits(reportsSorted, users, user);
    }

    data.closeDB();
    process.exit();
  });
});


function getUserHits(reports, users, user) {
  var farmers = {};
  var losers = {};

  var outputFileName = path.resolve('reports', 'hits' + user.n + '.txt');
  var outputReport = [];
  var userCoords = [];

  // TODO: write this out to a specific file automatically, not std out
  var counter = 0;
  if (logLevel > 1) console.log(reports.length, 'reports');

  console.log('reports for', user.n);
  reports.forEach(function (item) {
    var user0, user1;
    var reportDate = new Date(item.reportUnixTime * 1000);
    var stats;

    if (reportDate.getTime() > startReportTime.getTime()) {

      if (reportDate.getTime() < earliestTime.getTime()) earliestTime = reportDate;
      if (reportDate.getTime() > latestTime.getTime()) latestTime = reportDate;

      try {

        user0 = (_.findWhere(users, {'id': 'u' + item.side0PlayerId})) || {n: 'unknown' };
        user1 = (_.findWhere(users, {'id': 'u' + item.side1PlayerId})) || {n: 'unknown' };

        item.boxContent.n = user0.n;

        // TODO: filter by alliance, not user, optional
        if (item.side1AllianceId === ourAlliance && user1 && user1.n === user.n) {

          if (!farmers[user0.id]) farmers[user0.id] = {'n': user0.n, xCoord: item.side0XCoord, yCoord: item.side0YCoord};

          stats = {n: user0.n, xCoord: item.side0XCoord, yCoord: item.side0YCoord, reportUnixTime: item.reportUnixTime};
          stats.loot = refactorLoot(item.boxContent.loot);

          if (item.boxContent.fght) {
            stats.attUnits = countUnits(item.boxContent.fght.s1);
            stats.defUnits = countUnits(item.boxContent.fght.s0);
          }

          if (stats.loot.total > 0) {
            outputReport.push('  hit ===> ' + formatStats(stats));
          }

          userCoords[item.side1XCoord + ',' + item.side1YCoord] = item.side1XCoord + ',' + item.side1YCoord;
        }

        if (item.side0AllianceId === ourAlliance && user0 && user0.n === user.n) {

          if (!losers[user1.id]) losers[user1.id] = {'n': user1.n,  xCoord: item.side1XCoord, yCoord: item.side1YCoord};
          stats = {n: user1.n, xCoord: item.side1XCoord, yCoord: item.side1YCoord, reportUnixTime: item.reportUnixTime};
          stats.loot = refactorLoot(item.boxContent.loot);

          if (item.boxContent.fght) {
            stats.attUnits = countUnits(item.boxContent.fght.s1);
            stats.defUnits = countUnits(item.boxContent.fght.s0);
          }

          if (stats.loot.total > 0) {
            outputReport.push('<== hit by ' + formatStats(stats));
          }

          userCoords[item.side0XCoord + ',' + item.side0YCoord] = item.side0XCoord + ',' + item.side0YCoord;
        }
      } catch (e) {
        console.error(e, e.stack);
      }
    }
  });

  outputReport.push('Start Time:     ' + toSimpleTime(toGameTime(earliestTime)) + ' ' + earliestTime.getDayName());
  outputReport.push('End Time:       ' + toSimpleTime(toGameTime(latestTime)) + ' ' + latestTime.getDayName());
  var gameTime = toGameTime(now);
  outputReport.push('Game Time Now:  ' + toSimpleTime(gameTime));
  outputReport.push(userName + ' city coords ' + util.inspect(_.keys(userCoords)));
  //console.log(outputReport.join('\n'));

  fs.writeFileSync(outputFileName, outputReport.join('\n'));

}

var reportFormat = '%4s  %4s  %4s  %4s %4s  %s %s';
var hitReportFormat = '%-15s (%3d %3d)  %4s %7s %s';
function formatHeader() {
  console.log(printf(reportFormat,
        '  F ', '  W ', '  S ', '  O ', '  T ', 'Totals'));
}

function formatStats(stats) {
  if (stats.loot) {
    try {
      console.log
      return printf(hitReportFormat,
        stats.n,
        stats.xCoord,
        stats.yCoord,
/*        formatRes(stats.loot.food),
        formatRes(stats.loot.wood),
        formatRes(stats.loot.stone),
        formatRes(stats.loot.ore),*/
        formatRes(stats.loot.total),
        stats.attUnits,
        toSimpleTime(toGameTime(new Date(stats.reportUnixTime * 1000)))
      );
    } catch (e) {
      console.error(e, e.stack);
      return "error";
    }
  } else {
    return 'no loot';
  }
}

function formatTotals(stats) {
  console.log(printf(reportFormat,
    formatRes(stats.food),
    formatRes(stats.wood),
    formatRes(stats.stone),
    formatRes(stats.ore),
    formatRes(stats.total),
    'Totals'
  ));
}

function refactorLoot(loot) {
  var newLoot = {
    gold: 0,
    food: 0,
    wood: 0,
    stone: 0,
    ore: 0,
    total: 0
  };
  if (!loot || loot.length === 0) return newLoot;

  newLoot.gold += loot[0] || 0;
  newLoot.food += loot[1] || 0;
  newLoot.wood += loot[2] || 0;
  newLoot.stone += loot[3] || 0;
  newLoot.ore += loot[4] || 0;
  newLoot.total = newLoot.food + newLoot.wood + newLoot.stone + newLoot.ore;
  return newLoot;
}

function countUnits(fightSide) {

  var totalUnits = 0;
  traverse(fightSide).forEach(function (x) {
    if (this.key && this.key.match(/u[0-9]+/)) {
      totalUnits += parseInt(x[0], 10);
    }
  });

  return totalUnits;
}

function toGameTime(date) {
  var gameTime = new Date(date);
  gameTime.setHours(date.getHours() - gameHoursShift);
  return gameTime;
}

function toSimpleTime(date) {
  return printf('%02d:%02d',  date.getHours(), date.getMinutes());
}

(function () {
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  Date.prototype.getMonthName = function () {
    return months[this.getMonth()];
  };
  Date.prototype.getDayName = function () {
    return days[this.getDay()];
  };
})();
