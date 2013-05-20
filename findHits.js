var _ = require('underscore'),
  colors = require('colors'),
  path = require('path'),
  fs = require('fs'),
  util = require('util'),
  hogan = require('hogan.js'),
  traverse = require('traverse');

var Data = require('./data');
var dist = require('./dist');
var formatRes = require('./format_res');
var printf = require('printf');

var userName = process.argv[2] || 'all';

console.log('report for user:', userName);

var startDaysAgo = process.argv[3] || 1;

console.log('start days ago:', startDaysAgo);

var ourAlliance = "15740";

var gameHoursShift = 0;

var minLootForReport = -1;

var now = new Date();

var startReportTime = new Date();
startReportTime.setDate(now.getDate() - startDaysAgo);

var logLevel = 1; // 0 = nothing, 1 = normal, 2 = info
var data = new Data();

var earliestTime = new Date();
var latestTime = startReportTime;

process.on('uncaughtException', function(err) {
  console.log('Caught exception:', err, err.stack);
  process.exit(-1);
});

// TODO: filter reports by startDate
data.loadDB('report', {query: {'reportUnixTime': {$gt: (Math.floor(startReportTime.getTime() / 1000)).toString()}}},
  function (err, reports) {
    data.loadDB('user', {query: {}}, function (err, users) {

    var userHash = {};
    users.forEach(function(u) {
      userHash[u.id] = u;
    });

    console.log(reports.length, 'reports');
    console.log(users.length, 'users');
    var reportsSorted = _.sortBy(reports, function(item) {
      return -(item.reportUnixTime);
    });

    if (userName === 'all') {
      console.log('looping over all users');

      users.forEach(function(user) {
        if (user.a === ourAlliance) {
          getUserHits(reportsSorted, userHash, user);
        }
      });

    } else {


      var user = (_.findWhere(users, {
        'n': userName
      }));
      if (!user) {
        console.error('User', userName, 'Not Found');
        process.exit(-1);
      }
      console.log('report for', user.n);
      getUserHits(reportsSorted, userHash, user);
    }

    data.closeDB();
    process.exit();
  });
});


function getUserHits(reports, users, user) {
  var farmers = {};
  var losers = {};

  var totalLootFarmed = totalLootLost = totalMightLost = totalMightKilled = 0;
  var outputPrefix = 'ally';

  if (user.a !== ourAlliance) {
    outputPrefix = 'enemy';
  }
  var userNameForFile = user.n;
  userNameForFile = user.n[0].toUpperCase() + user.n.substring(1);

  var outputFileName = path.resolve('reports', outputPrefix, userNameForFile + '.txt');
  var htmlFileName = path.resolve('reports', outputPrefix, userNameForFile + '.html');

  var outputReport = [];
  var userCoords = [];

  var reportData = {'name': user.n, table: []};

  // TODO: write this out to a specific file automatically, not std out
  var counter = 0;
  if (logLevel > 1) console.log(reports.length, 'reports');

  console.log('reports for', user.n);
  outputReport.push(outputHeader());

  reports.forEach(function(item) {
    var user0, user1;
    var reportDate = new Date(item.reportUnixTime * 1000);
    var stats;

    if (reportDate.getTime() > startReportTime.getTime()) {

      if (reportDate.getTime() < earliestTime.getTime()) earliestTime = reportDate;
      if (reportDate.getTime() > latestTime.getTime()) latestTime = reportDate;

      try {

        user0 = users['u' + item.side0PlayerId] || {
          n: 'unknown'
        };
        user1 = users['u' + item.side1PlayerId] || {
          n: 'unknown'
        };


        item.boxContent.n = user0.n;

        // TODO: filter by alliance, not user, optional
        if (user1 && user1.n === user.n) {

          if (!farmers[user0.id]) farmers[user0.id] = {
            'n': user0.n,
            xCoord: item.side0XCoord,
            yCoord: item.side0YCoord,
            xCoordFrom: item.side1XCoord,
            yCoordFrom: item.side1YCoord
          };

          stats = {
            n: user0.n,
            xCoord: item.side0XCoord,
            yCoord: item.side0YCoord,
            xCoordFrom: item.side1XCoord,
            yCoordFrom: item.side1YCoord,
            reportUnixTime: item.reportUnixTime
          };
          stats.loot = refactorLoot(item.boxContent.loot);

          stats.attUnits = stats.defUnits = 0;
          if (item.boxContent.fght) {
            var s0 = item.boxContent.fght.s0;
            var s1 = item.boxContent.fght.s1;
            stats.attUnits = countUnits(s1);
            stats.attMightLost = calculateMightLost(s1);
            stats.defUnits = countUnits(s0);
            stats.defMightLost = calculateMightLost(s0);
          }

          if (stats.loot.total >= minLootForReport) {
            outputReport.push('  hit ===> ' + formatStats(stats));
            reportData.table.push('  hit ===> ' + formatStats(stats));
	  }
          totalLootFarmed += stats.loot.total;

          userCoords[item.side1XCoord + ',' + item.side1YCoord] = item.side1XCoord + ',' + item.side1YCoord;
        }

        if (user0 && user0.n === user.n) {

          if (!losers[user1.id]) {
            losers[user1.id] = {
              'n': user1.n,
              xCoord: item.side1XCoord,
              yCoord: item.side1YCoord,
              xCoordFrom: item.side0XCoord,
              yCoordFrom: item.side0YCoord
            };
          }
          stats = {
            n: user1.n,
            xCoord: item.side1XCoord,
            yCoord: item.side1YCoord,
            xCoordFrom: item.side0XCoord,
            yCoordFrom: item.side0YCoord,
            reportUnixTime: item.reportUnixTime
          };
          stats.loot = refactorLoot(item.boxContent.loot);

          stats.attUnits = stats.defUnits = 0;
          if (item.boxContent.fght) {
            var s0 = item.boxContent.fght.s0;
            var s1 = item.boxContent.fght.s1;
            stats.attUnits = countUnits(s1);
            stats.attMightLost = calculateMightLost(s1);
            stats.defUnits = countUnits(s0);
            stats.defMightLost = calculateMightLost(s0);
          }

          if (stats.loot.total >= minLootForReport) {
            outputReport.push('<== hit by ' + formatStats(stats));
            reportData.table.push('<== hit by ' + formatStats(stats));
          }
          totalLootLost += stats.loot.total;
          totalMightLost += stats.attMightLost;
          totalMightKilled += stats.attMightKilled;

          userCoords[item.side0XCoord + ',' + item.side0YCoord] = item.side0XCoord + ',' + item.side0YCoord;
        }
      } catch (e) {
        console.error(e, e.stack);
      }
    }
  });

  reportData.earliestTime = toSimpleTime(toGameTime(earliestTime));
  reportData.latestTime = toSimpleTime(toGameTime(latestTime));
  reportData.gameTime = toSimpleTime(toGameTime(gameTime));
  reportData.totalResFarmed = formatRes(totalLootFarmed);
  reportData.totalResLost = formatRes(totalLootLost);
  reportData.totalMightKilled = formatRes(totalMightKilled);
  reportData.totalMightLost = formatRes(totalMightLost);
  reportData.table = reportData.table.join('\n');

  outputReport.push('  ------------             --------- ----- ------- ----- --------- ------- ------- -----');
  outputReport.push('Start Time:     ' + toSimpleTime(toGameTime(earliestTime)) + ' ' + earliestTime.getDayName());
  outputReport.push('End Time:       ' + toSimpleTime(toGameTime(latestTime)) + ' ' + latestTime.getDayName());
  var gameTime = toGameTime(now);
  outputReport.push('Game Time Now:  ' + toSimpleTime(gameTime));

  if (user.lastLoginTimestamp) {
    var llTime = new Date(user.lastLoginTimestamp * 1000);
    outputReport.push('Last Login:     ' + toSimpleTime(toGameTime(llTime)) + ' ' + llTime.getDayName());
  }

  outputReport.push('');
  outputReport.push('Loot Farmed: ' + formatRes(totalLootFarmed));
  outputReport.push('Loot Lost:   ' + formatRes(totalLootLost));
  outputReport.push('Might Farmed: ' + formatRes(totalMightKilled));
  outputReport.push('Might Lost:   ' + formatRes(totalMightLost));
  outputReport.push('');

  outputReport.push(userName + ' city coords ' + util.inspect(_.keys(userCoords)));
  //console.log(outputReport.join('\n'));

  fs.writeFileSync(outputFileName, outputReport.join('\n'));

  fs.writeFileSync(htmlFileName, generateReport(reportData));

}

var reportFormat = '%4s  %4s  %4s  %4s %4s  %s %s';
var hitReportFormat = '%-15s (%3d %3d)  %4s %7s %s (%3d %3d) %7d %7d %4.1f';

function outputHeader() {
 return '  hit opponent             opp coord   res unitSnt time  own coord mgtLost mgtKild ratio\n' +
        '  ------------             --------- ----- ------- ----- --------- ------- ------- -----';
}


function formatStats(stats) {
  if (stats.loot) {
    try {
      var attMightLost = stats.attMightLost || 0;
      var defMightLost = stats.defMightLost || 0;
      var ratio = defMightLost / attMightLost;
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
        toSimpleTime(toGameTime(new Date(stats.reportUnixTime * 1000))),
        stats.xCoordFrom,
        stats.yCoordFrom,
        attMightLost,
        defMightLost,
        ratio
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
  console.log(printf(reportFormat, formatRes(stats.food), formatRes(stats.wood), formatRes(stats.stone), formatRes(stats.ore), formatRes(stats.total), 'Totals'));
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

/*
 * boxContent.fght.s0 (receiver)
 * boxContent.fght.s1 (attacker)
 * boxContent.fght.s1.r1 (own troops?)
 * boxContent.fght.s1.r2 (reinforcements?)
 * boxContent.fght.s1.r2.u2 (wagons)
 * boxContent.fght.s1.r2.u2[0] sent
 * boxContent.fght.s1.r2.u2[1] survived
 * boxContent.fght.s1.r2.u2[2] lost
 *
 *
 * u1 = Porters
 * u2 = Wagons
 * u4 = Mounted Elves, Dwarves
 * u5 = Elvin Militia, Dwarven
 * u6 = Elvin Archers, Axe Throwers
 * u7 = Elvin Warriors
 * u8 = Mounted Hunters, Boar Rider
 * u9 = Supply Carts
 * u10 = Rams
 * u11 = Scorpions, Seige Crossbows
 * u12 = Ents, Catapults
 * u13 = Galadhrim, Heavy Boar Riders
 *
 * u52 = Def Trebuchet - yes
 * u53 = Traps - yes
 * u54 = Caltrops - yes
 * u55 = Def Crossbows - yes
 * u56 = Rock Droppers - yes
 * u57 = Dragon's Teeth - yes
 * u58 = Fire Droppers, Boiling Lead - yes
 * u59 = Mist Globes
 * u60 = Fire Throwers - yes
 *
 * t0 = u[1-2,9]
 * t1 = u[4-6]
 * t2 = u[7-8,11]
 * t4 = u[10,12-13]
 * w1 = u[52-54]
 */
function calculateMightLost(fightSide) {

  var troops = fightSide.r1;
  var reins = fightSide.r2;

  return calculateMightLostRank(troops) + calculateMightLostRank(reins);
}

function calculateMightLostRank (rank) {
  if (!rank) {
    return 0;
  }

  var totalMightLost = 0;

  for (var u in might) {
    var unitList = rank[u];
    if (unitList) {
      var unitsLost = unitList[2];
      if (unitsLost) {
        totalMightLost += (unitsLost * might[u]);
      }
    }
  }
  return totalMightLost;
}


var might = {
  'u1': 1,
  'u2': 0,
  'u3': 0,
  'u4': 4,
  'u5': 4,
  'u6': 4,
  'u7': 16,
  'u8': 16,
  'u9': 0,
  'u10': 24,
  'u11': 16,
  'u12': 24,
  'u13': 24,
  'u52': 30,
  'u53': 18,
  'u54': 18,
  'u55': 18,
  'u56': 30,
  'u57': 30,
  'u58': 56,
  'u59': 56,
  'u60': 56
};

function countUnits(fightSide) {

  var totalUnits = 0;
  traverse(fightSide).forEach(function(x) {
    if (this.key && this.key.match(/u[0-9]+/)) {
      totalUnits += parseInt(x[0], 10);
    }
  });

  return totalUnits;
}

function toGameTime(date) {
  if (!date) return new Date();

  var gameTime = new Date(date);
  gameTime.setHours(date.getHours() - gameHoursShift);
  return gameTime;
}

function toSimpleTime(date) {
  if (!date) return '00:00';
  return printf('%02d:%02d', date.getHours(), date.getMinutes());
}

function generateReport(reportData) {
  var templateFile = fs.readFileSync('hits.mu').toString();

//  console.log(reportData);
  // compile template
  var template = hogan.compile(templateFile);

  return template.render(reportData);

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
