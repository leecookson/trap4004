var _ = require('underscore');

var Data = require('./data');
var dist = require('./dist');
var formatRes = require('./format_res');
var printf = require('printf');

var loserAlliance = "15740";

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

// TODO: filter reports by startDate
data.loadDB('report', {query: {'reportUnixTime': {$gt: (Math.floor(startReportTime.getTime() / 1000)).toString()}}}, function (err, reports) {
  data.loadDB('user', {query: {}}, function (err, users) {
//    var reports = data.get('report');
//    var users = data.get('user');
    var reportsSorted = [];
    var globalLoserLoot = {food: 0, wood: 0, stone: 0, ore: 0, total: 0, hits: 0};
    var losers = {};

    reportsSorted = _.sortBy(reports, function (item) {return -(item.reportUnixTime); });

    // TODO: write this out to a specific file automatically, not std out
    var counter = 0;
    if (logLevel > 1) console.log(reports.length, 'reports');

    reportsSorted.forEach(function (item) {
      var user0, user1;
      var reportDate = new Date(item.reportUnixTime * 1000);

      if (reportDate.getTime() > startReportTime.getTime()) {

        if (reportDate.getTime() < earliestTime.getTime()) earliestTime = reportDate;
        if (reportDate.getTime() > latestTime.getTime()) latestTime = reportDate;

        try {
          user0 = (_.findWhere(users, {'id': 'u' + item.side0PlayerId}));
          user1 = (_.findWhere(users, {'id': 'u' + item.side1PlayerId}));

          if (item.side0AllianceId === loserAlliance && user0) {

            if (!losers[user0.id]) losers[user0.id] = {'n': user0.n,  xCoord: item.side0XCoord, yCoord: item.side0YCoord};
            aggregateRes(globalLoserLoot, losers[user0.id], item.boxContent.loot);

            if (logLevel > 1) {
              if (user1) {
                console.log('attacker', user1.n || user1.name);
              } else {
                console.log('attacker', item.side1PlayerId, 'not found');
              }
              if (user0) {
                console.log('loser ', user0.n || user0.name);
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

    console.log('Start Time:    ', toSimpleTime(toGameTime(earliestTime)), earliestTime.getDayName());
    console.log('End Time:      ', toSimpleTime(toGameTime(latestTime)), latestTime.getDayName());
    var gameTime = toGameTime(now);
    console.log('Game Time Now: ', toSimpleTime(gameTime));
    console.log('\nLosers');
    console.log('======');
    formatHeader();
    var sortLosers = _.sortBy(losers, function (item) { return - item.loot.total; });
    _.each(sortLosers, function (loser, id) {
      formatStats(loser);
    });
    formatTotals(globalLoserLoot);

    process.exit();
  });
});

var reportFormat = '%4s  %4s  %4s  %4s  %4s  %s';
function formatHeader() {
  console.log(printf(reportFormat,
        '  F ', '  W ', '  S ', '  O ', '  T ', 'Totals'));
}

function formatStats(stats) {
  try {
    console.log(printf(reportFormat,
      formatRes(stats.loot.food),
      formatRes(stats.loot.wood),
      formatRes(stats.loot.stone),
      formatRes(stats.loot.ore),
      formatRes(stats.loot.total),
      stats.n,
      stats.xCoord,
      stats.yCoord
    ));
  } catch (e) {
    console.error(e);
    process.exit(-1);
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
  return printf('%02d:%02d',  date.getHours(), date.getMinutes());
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
