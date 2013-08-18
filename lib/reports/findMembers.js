var _ = require('underscore')
  , colors = require('colors')
  , path = require('path')
  , fs = require('fs')
  , util = require('util')
  , hogan = require('hogan.js');

var Data = require('../data/data');
var dist = require('../util/dist');
var formatRes = require('../util/format_res');
var printf = require('printf');

var outputFileName = path.resolve(process.env.HOME, 'reports', 'allies.txt');
var outputReport = [];
var userCoords = [];

var searchAlliance = "15740";

var gameHoursShift = 0; //0 for AWS, -4 for local TODO: fix the delta

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

data.loadDB('user', {query: {}}, function (err, users) {

  var usersAllies, usersSorted = [];

  usersAllies = _.filter(users, function (item) {return (item.a === searchAlliance); });
  usersSorted = _.sortBy(usersAllies, function (item) {return -(0 + item.m); });

  // TODO: write this out to a specific file automatically, not std out
  var counter = 0;
  var prevMight = Infinity;
  if (logLevel > 1) console.log(users.length, 'users');

  usersSorted.forEach(function (item, index) {
    var user0, user1;
    var stats;

    try {

      //console.log(item);
      // TODO: filter by alliance, not user, optional
      if (item.a === searchAlliance) {
        if (prevMight === Infinity) {
          delta = '';
        } else {
          delta = formatRes(0 + prevMight - item.m);
        }
        prevMight = item.m
        outputReport.push(formatMember(item, delta, index + 1));
      }

    } catch (e) {
      console.error(e, e.stack);
    }
  });

  var gameTime = toGameTime(now);
  outputReport.push('Game Time Now:  ' + toSimpleTime(gameTime));
  var outputReportText = outputReport.join('\n');
  fs.writeFileSync(outputFileName, outputReportText);

  var reportData = {
    alliList: outputReportText,
    numMembers:  usersSorted.length,
    now: toSimpleTime(gameTime)
  };

  var outputFile = path.resolve(process.env.HOME, 'reports', 'allies.html');
  fs.writeFileSync(outputFile, generateReport(reportData));

  process.exit();
});

var reportFormat = '%4s  %4s  %4s  %4s  %4s  %s';
var hitReportFormat = '%-15s (%3d %3d)  %4s  %4s  %4s  %4s  %4s  %s';
var memberFormat = '%2d %-15s %-10s %s %s %s';
function formatHeader() {
  console.log(printf(reportFormat,
        '  F ', '  W ', '  S ', '  O ', '  T ', 'Totals'));
}

function formatMember(member, delta, index) {
  var d = new Date(member.lastLogin);
  return printf(memberFormat,
      index,
      member.n,
      member.m,
      toSimpleTime(d),
      d.getDayName(),
      delta);
}

function formatStats(stats) {
  if (stats.loot) {
    try {
      return printf(hitReportFormat,
        stats.n,
        stats.xCoord,
        stats.yCoord,
        formatRes(stats.loot.food),
        formatRes(stats.loot.wood),
        formatRes(stats.loot.stone),
        formatRes(stats.loot.ore),
        formatRes(stats.loot.total),
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

function generateReport(reportData) {
  var templateFile = fs.readFileSync('/home/ec2-user/trap4004/view/allies.mu').toString();
  var headerFile = fs.readFileSync('/home/ec2-user/trap4004/view/header.mu', 'utf-8').toString();

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
