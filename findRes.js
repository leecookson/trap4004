var _ = require('underscore');

var Data = require('./data');
var dist = require('./dist');
var formatRes = require('./format_res');
var path = require('path');
var printf = require('printf');
var fs = require('fs');
var hogan = require('hogan.js');

var alliance = "15740";
var farmMode = process.argv[2] || 0; // 1 = farm, 0 = lose

var gameHoursShift = 0;

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

console.log('Starting       ====', new Date());

data.loadDB('report', {
  query: {
    'reportUnixTime': {
      $gt: (Math.floor(startReportTime.getTime() / 1000)).toString()
    }
  }
}, function (err, reports) {
  console.log('Reports Loaded ====', new Date(), reports.length);

  data.loadDB('user', {
    query: {}
  }, function (err, users) {
    console.log('Users Loaded   ====', new Date(), users.length, '\n');

    var reportsSorted = [];
    var globalLoot = {
      food: 0,
      wood: 0,
      stone: 0,
      ore: 0,
      total: 0,
      hits: 0
    };
    var players = {};

    console.log('before sort', new Date());
    reportsSorted = _.sortBy(reports, function (item) {
      return -(item.reportUnixTime);
    });
    console.log('after sort', new Date());

    // TODO: write this out to a specific file automatically, not std out
    if (logLevel > 1) console.log(reports.length, 'reports');

    reportsSorted.forEach(function (item) {
      var loser, farmer;
      var reportDate = new Date(item.reportUnixTime * 1000);

      if (reportDate.getTime() > startReportTime.getTime()) {

        if (reportDate.getTime() < earliestTime.getTime()) earliestTime = reportDate;
        if (reportDate.getTime() > latestTime.getTime()) latestTime = reportDate;

        try {
          loser = (_.findWhere(users, {
            'id': 'u' + item.side0PlayerId
          }));
          farmer = (_.findWhere(users, {
            'id': 'u' + item.side1PlayerId
          }));

          if (item.side1AllianceId === alliance && farmer || item.side0AllianceId === alliance && loser) {

            if (farmMode && item.side1AllianceId === alliance && farmer) {
              if (!players[farmer.id]) {
                players[farmer.id] = {
                  'n': farmer.n,
                  xCoord: item.side1XCoord,
                  yCoord: item.side1YCoord
                };
              }
              aggregateRes(globalLoot, players[farmer.id], item.boxContent.loot);
            } else if (!farmMode && item.side0AllianceId === alliance && loser) {
              if (!players[loser.id]) {
                players[loser.id] = {
                  'n': loser.n,
                  xCoord: item.side0XCoord,
                  yCoord: item.side0YCoord
                };
              }
              aggregateRes(globalLoot, players[loser.id], item.boxContent.loot);
            }

            if (logLevel > 1) {
              if (farmer) {
                console.log('farmer', farmer.n || farmer.name);
              } else {
                console.log('farmer', item.side1PlayerId, 'not found');
              }
              if (loser) {
                console.log('loser', loser.n || loser.name);
              } else {
                console.log('loser', item.side0PlayerId, 'not found');
              }
            }

          }

        } catch (e) {
          console.error(e);
        }
      }
    });

    var gameTime = toGameTime(now);
    var reportData = {};
    reportData.startTime = {
      time: toSimpleTime(toGameTime(earliestTime)),
      dayOfWeek: earliestTime.getDayName()
    };
    reportData.endTime = {
      time: toSimpleTime(toGameTime(latestTime)),
      dayOfWeek: latestTime.getDayName()
    };
    reportData.nowTime = {
      time: toSimpleTime(gameTime),
    };
    reportData.players = [];

    console.log('Start Time:    ', toSimpleTime(toGameTime(earliestTime)), earliestTime.getDayName());
    console.log('End Time:      ', toSimpleTime(toGameTime(latestTime)), latestTime.getDayName());
    console.log('Game Time Now: ', toSimpleTime(gameTime));
    if (farmMode) {
      reportData.titleLabel = 'Farmers';
      console.log('\nFarmers');
    } else {
      reportData.titleLabel = 'Losers';
      console.log('\nLosers');
    }
    console.log('======');
    formatHeader();
    var sortPlayers = _.sortBy(players, function (item) {
      return -item.loot.total;
    });
    _.each(sortPlayers, function (player, id) {
      formatStats(player);
      reportData.players.push(player);
    });
    formatTotals(globalLoot);
    reportData.totals = globalLoot;
    reportData.farmMode = farmMode;

    var outputFile = path.resolve('reports', farmMode ? 'farmers.html' : 'losers.html');
    fs.writeFileSync(outputFile, generateReport(reportData));

    process.exit();
  });
});

var reportFormat = '%4s  %4s  %4s  %4s  %4s  %s';

function formatHeader() {
  console.log(printf(reportFormat, '  F ', '  W ', '  S ', '  O ', '  T ', 'Totals'));
}

function formatStats(stats) {
  stats.loot.foodStr = formatRes(stats.loot.food);
  stats.loot.woodStr = formatRes(stats.loot.wood);
  stats.loot.stoneStr = formatRes(stats.loot.stone);
  stats.loot.oreStr = formatRes(stats.loot.ore);
  stats.loot.totalStr = formatRes(stats.loot.total);

  try {
    console.log(printf(reportFormat, stats.loot.foodStr, stats.loot.woodStr, stats.loot.stoneStr, stats.loot.oreStr, stats.loot.totalStr, stats.n, stats.xCoord, stats.yCoord));
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }
}

function formatTotals(stats) {
  stats.foodStr = formatRes(stats.food);
  stats.woodStr = formatRes(stats.wood);
  stats.stoneStr = formatRes(stats.stone);
  stats.oreStr = formatRes(stats.ore);
  stats.totalStr = formatRes(stats.total);

  console.log(printf(reportFormat, stats.foodStr, stats.woodStr, stats.stoneStr, stats.oreStr, stats.totalStr, 'Totals'));
}

function aggregateRes(global, user, loot) {
  if (!user) {
    return;
  }
  if (!user.loot) {
    user.loot = {
      gold: 0,
      food: 0,
      wood: 0,
      stone: 0,
      ore: 0,
      total: 0,
      hits: 0
    };
  }

  if (loot) {
    user.loot.gold += loot[0] || 0;
    user.loot.food += loot[1] || 0;
    user.loot.wood += loot[2] || 0;
    user.loot.stone += loot[3] || 0;
    user.loot.ore += loot[4] || 0;
    user.loot.hits++;

    user.loot.total = user.loot.food + user.loot.wood + user.loot.stone + user.loot.ore;

    global.gold += loot[0] || 0;
    global.food += loot[1] || 0;
    global.wood += loot[2] || 0;
    global.stone += loot[3] || 0;
    global.ore += loot[4] || 0;
    global.hits++;

    global.total = global.food + global.wood + global.stone + global.ore;
  }
}

function toGameTime(date) {
  var gameTime = new Date(date);
  gameTime.setHours(date.getHours() - gameHoursShift);
  return gameTime;
}

function toSimpleTime(date) {
  return printf('%02d:%02d', date.getHours(), date.getMinutes());
}

function generateReport(reportData) {
  var templateFile = fs.readFileSync('farmerLoser.mu', 'utf-8').toString();
  var headerFile = fs.readFileSync('header.mu', 'utf-8').toString();

  // compile template
  var template = hogan.compile(templateFile);
  var header = hogan.compile(headerFile);

  return template.render(reportData, {
    'header': header
  });
}

(function () {
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  Date.prototype.getMonthName = function () {
    return months[this.getMonth()];
  };
  Date.prototype.getDayName = function () {
    return days[this.getDay()];
  };
})();
