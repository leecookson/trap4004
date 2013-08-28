var _ = require('underscore'),
  path = require('path'),
  fs = require('fs'),
  util = require('util'),
  hogan = require('hogan.js'),
  traverse = require('traverse'),
  toGameTime = require('../util/gameTime'),
  toSimpleTime = require('../util/simpleTime'),
  toSimpleDate = require('../util/simpleDate');

require('colors');
var Data = require('../data/data'),
  dist = require('../util/dist'),
  formatRes = require('../util/format_res'),
  printf = require('printf');

var numParams = process.argv.length;

var userNames = [];
var startDaysAgo = 1;

// Usage:
//   findHits [startDaysAgo] name [name ...]
if (numParams > 3) {
  if (typeof process.argv[2].match(/[0-9]+/)) {
    startDaysAgo = process.argv[2];
  }
  userNames = process.argv.slice(3);
} else {
  userNames.push(process.argv[2] || 'all');
}

var incomingMode = (userNames[0] === 'incoming');
var outgoingMode = (userNames[0] === 'outgoing');

console.log('report for users:', userNames);

//TODO: change this to a command flag (optimist, maybe)

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
data.loadDB('report', {
  query: {
    'reportUnixTime': {
      $gt: (Math.floor(startReportTime.getTime() / 1000)).toString()
    }
  }
}, function(err, reports) {
  data.loadDB('user', {
    query: {}
  }, function(err, users) {
    data.loadDB('alliance', {
      query: {}
    }, function(err, alliances) {

    var userHash = {};
    users.forEach(function(u) {
      userHash[u.id] = u;
    });

    var allianceHash = {};
    alliances.forEach(function(a) {
      allianceHash[a.id] = a;
//      console.log('a', a);
//      console.log('allianceHash', allianceHash);
    });

//    console.log(reports.length, 'reports');
//    console.log(users.length, 'users');
//    console.log(alliances.length, 'alliances');
    var reportsSorted = _.sortBy(reports, function(item) {
      return -(item.reportUnixTime);
    });

    if (userNames[0] === 'all') {
      console.log('looping over all users');

      users.forEach(function(user) {
        if (user.a === ourAlliance) {
          getUserHits(reportsSorted, userHash, user);
        }
      });

    } else if (incomingMode) {

      getAllianceHits(reportsSorted, userHash, allianceHash, true);

    } else if (outgoingMode) {

      getAllianceHits(reportsSorted, userHash, allianceHash, false);

    } else {


      userNames.forEach(function (name) {
        name = name.replace('&#39;', '\'');
        var user = (_.findWhere(users, {
          'n': name
        }));
        if (!user) {
          console.error('User',name, 'Not Found');
          return;
        }
        console.log('report for', user.n);
        getUserHits(reportsSorted, userHash, user);
      });
    }

    console.log('ENDING');
    data.closeDB();
    process.exit();
  });
  });
});

function getUserHits(reports, users, user) {
  var farmers = {};
  var losers = {};

  var totalLootFarmed = 0,
    totalLootLost = 0,
    totalMightLost = 0,
    totalMightKilled = 0;
  var outputPrefix = 'ally';

  if (user.a !== ourAlliance) {
    outputPrefix = 'enemy';
  }
  var userNameForFile = user.n;
  userNameForFile = user.n[0].toUpperCase() + user.n.substring(1);

//  var outputFileName = path.resolve('reports', outputPrefix, userNameForFile + '.txt');
  var htmlFileName = path.resolve(process.env.HOME, 'reports', outputPrefix, userNameForFile + '.html');

  var outputReport = [];
  var userCoords = [];

  var reportData = {
    'name': user.n,
    'userMight': user.m,
    table: [],
    reports: []
  };

  // TODO: write this out to a specific file automatically, not std out
  var counter = 0;
  if (logLevel > 1) console.log(reports.length, 'reports');

  outputReport.push(outputHeader());

  reports.forEach(function(item) {
    var report;
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
/*
"boxContent" : { "s0Kid" : "0",
    "s1Kid" : "316497",
    "s1KLv" : "85",
    "s0KCombatLv" : "None",
    "s1KCombatLv" : "85",
    "fght" : { "s0" : [],
      "s1" : { "r2" : { "u2" : [
            "333",
            "333",
            0 ] } } },
    "rnds" : 1,
    "winner" : 2,
    "wall" : 100,
    "s0atkBoost" : 0,
    "s0defBoost" : 0,
    "s1atkBoost" : 0.2,
    "s1defBoost" : 0.2,
    "loot" : [
      0,
      60884,
      71023,
      65474,
      0,
      0,
      0,
      0,
      0,
      [] ] }
*/
        if (user1 && user1.n === user.n) {

          if (!farmers[user0.id]) farmers[user0.id] = {
            n: user0.n,
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

          if (item.boxContent) {
            stats.heroLvl = item.boxContent.s1KCombatLv || 0;
            stats.heroLvlOther = item.boxContent.s0KCombatLv || 0;
            stats.defBoost = item.boxContent.s1defBoost || 0;
            stats.atkBoost = item.boxContent.s1atkBoost || 0;
            stats.defBoostOther = item.boxContent.s0defBoost || 0;
            stats.atkBoostOther = item.boxContent.s0atkBoost || 0;
          }

          stats.attUnits = stats.defUnits = 0;
          if (item.boxContent.fght) {
            var s0 = item.boxContent.fght.s0;
            var s1 = item.boxContent.fght.s1;
            stats.attUnits = countUnits(s1);
            stats.attMightLost = calculateMightLost(s1);
            stats.defUnits = countUnits(s0);
            stats.defMightLost = calculateMightLost(s0);
          }

          if (stats.loot.total > -1) {
            var statRow = formatStats(stats);
            outputReport.push('  hit ===> ' + statRow);
            reportData.table.push('  hit ===> ' + statRow);
          }
          totalLootFarmed += stats.loot.total;
          totalMightLost += (stats.attMightLost || 0);
          totalMightKilled += (stats.defMightLost || 0);

          item.s0defBoostSym = boostSymbol(item.boxContent.s0defBoost, 'def');
          item.s0atkBoostSym = boostSymbol(item.boxContent.s0atkBoost, 'att');
          item.s1defBoostSym = boostSymbol(item.boxContent.s1defBoost, 'def');
          item.s1atkBoostSym = boostSymbol(item.boxContent.s1atkBoost, 'att');
          item.s0hero = shortenHeroLvl(item.boxContent.s0KCombatLv);
          item.s1hero = shortenHeroLvl(item.boxContent.s1KCombatLv);

          var user1Coord = item.side1XCoord + ',' + item.side1YCoord;
          userCoords[user1Coord] = user1Coord;
          report = {
            inOut: 'outgoing',
            item: item,
            stats: stats,
            totalLootFarmed: totalLootFarmed,
            totalMightLost: totalMightLost,
            totalMightKilled: totalMightKilled,
            userCoord: userCoord,
            onLink: '/enemy/' + user0.n + '.html',
            byLink: '/ally/' + user1.n + '.html'
          };
        }

        if (user0 && user0.n === user.n) {

          if (!losers[user1.id]) {
            losers[user1.id] = {
              n: user1.n,
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

          if (item.boxContent) {
            stats.heroLvlOther = item.boxContent.s1KCombatLv || 0;
            stats.heroLvl = item.boxContent.s0KCombatLv || 0;
            stats.defBoost = item.boxContent.s0defBoost || 0;
            stats.atkBoost = item.boxContent.s0atkBoost || 0;
            stats.defBoostOther = item.boxContent.s1defBoost || 0;
            stats.atkBoostOther = item.boxContent.s1atkBoost || 0;
          }

          stats.attUnits = stats.defUnits = 0;
          if (item.boxContent.fght) {
            var s0 = item.boxContent.fght.s0;
            var s1 = item.boxContent.fght.s1;
            stats.attUnits = countUnits(s1);
            stats.attMightLost = calculateMightLost(s1);
            stats.defUnits = countUnits(s0);
            stats.defMightLost = calculateMightLost(s0);
          }

          if (stats.loot.total > -1) {
            var statRow = formatStats(stats);
            outputReport.push('<== hit by ' + statRow);
            reportData.table.push('<== hit by ' + statRow);
          }
          totalLootLost += stats.loot.total;
          totalMightLost += (stats.defMightLost || 0);
          totalMightKilled += (stats.attMightLost || 0);

          item.s0defBoostSym = boostSymbol(item.boxContent.s0defBoost, 'def');
          item.s0atkBoostSym = boostSymbol(item.boxContent.s0atkBoost, 'att');
          item.s1defBoostSym = boostSymbol(item.boxContent.s1defBoost, 'def');
          item.s1atkBoostSym = boostSymbol(item.boxContent.s1atkBoost, 'att');
          item.s0hero = shortenHeroLvl(item.boxContent.s0KCombatLv);
          item.s1hero = shortenHeroLvl(item.boxContent.s1KCombatLv);

          var userCoord = item.side0XCoord + ',' + item.side0YCoord;
          userCoords[userCoord] = userCoord;
          report = {
            inOut: 'incoming',
            item: item,
            stats: stats,
            totalLootLost: totalLootLost,
            totalMightLost: totalMightLost,
            totalMightKilled: totalMightKilled,
            userCoord: userCoord,
            onLink: '/ally/' + user0.n + '.html',
            byLink: '/enemy/' + user1.n + '.html'
          };
        }
        if (report) {
          report.by = user1.n;
          report.on = user0.n;
          reportData.reports.push(report);
        }
      } catch (e) {
        console.error(e, e.stack);
      }
    }
  });

  var gameTime = toGameTime(now);
  reportData.earliestTime = toSimpleTime(toGameTime(earliestTime));
  reportData.latestTime = toSimpleTime(toGameTime(latestTime));
  reportData.latestDate = toSimpleDate(toGameTime(latestTime));
  reportData.gameTime = toSimpleTime(toGameTime(gameTime));
  reportData.gameDate = toSimpleDate(toGameTime(gameTime));
  reportData.totalResFarmed = formatRes(totalLootFarmed);
  reportData.totalResLost = formatRes(totalLootLost);
  reportData.totalMightKilled = formatRes(totalMightKilled);
  reportData.totalMightLost = formatRes(totalMightLost);
  reportData.table = reportData.table.join('\n');

  outputReport.push('  ------------             --------- ----- ------- ----- --------- ------- ------- -----');
  outputReport.push('Start Time:     ' + toSimpleTime(toGameTime(earliestTime)) + ' ' + earliestTime.getDayName());
  outputReport.push('End Time:       ' + toSimpleTime(toGameTime(latestTime)) + ' ' + latestTime.getDayName());
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

  outputReport.push(user.n + ' city coords ' + util.inspect(_.keys(userCoords)));
  //console.log(outputReport.join('\n'));
//  fs.writeFileSync(outputFileName, outputReport.join('\n'));

  fs.writeFileSync(htmlFileName, generateReport(reportData));

}

function getAllianceHits(reports, users, alliances, incoming) {
  var reportData = {};
  var allianceHits = {};

  var gameTime = toGameTime(now);
  reports.forEach(function (item) {
    var reportDate = new Date(item.reportUnixTime * 1000);

    if (item.side0AllianceId === ourAlliance && incoming) {

      if (reportDate.getTime() < earliestTime.getTime()) earliestTime = reportDate;
      if (reportDate.getTime() > latestTime.getTime()) latestTime = reportDate;

      var alliance = alliances[item.side1AllianceId];
      if (alliance) {
        if (!allianceHits[item.side1AllianceId]) {
          allianceHits[item.side1AllianceId] = {
            hits:[],
            allianceId: item.side1AllianceId,
            id: alliance.id,
            name: alliance.name,
            a: item.side1AllianceId,
            totalLootFarmed: 0,
            totalMightLost: 0,
            totalMightKilled: 0
          };
        }
        addAllianceHit(allianceHits[item.side1AllianceId], item, users, alliances);
      }
    }
    if (item.side1AllianceId === ourAlliance && !incoming) {

      if (reportDate.getTime() < earliestTime.getTime()) earliestTime = reportDate;
      if (reportDate.getTime() > latestTime.getTime()) latestTime = reportDate;

      var alliance = alliances[item.side0AllianceId];
      if (alliance) {
        if (!allianceHits[item.side0AllianceId]) {
          allianceHits[item.side0AllianceId] = {
            hits:[],
            allianceId: item.side0AllianceId,
            id: alliance.id,
            name: alliance.name,
            a: item.side0AllianceId,
            totalLootFarmed: 0,
            totalMightLost: 0,
            totalMightKilled: 0
          };
        }
        addAllianceHit(allianceHits[item.side0AllianceId], item, users, alliances);
      }
    }
  });

  reportData.allianceHits = _.toArray(allianceHits);
  reportData.earliestTime = toSimpleTime(toGameTime(earliestTime));
  reportData.latestTime = toSimpleTime(toGameTime(latestTime));
  reportData.gameTime = toSimpleTime(toGameTime(gameTime));

  _.each(allianceHits, function (item) {
    console.log('\n==', item.name, '==');
    item.totalLootFarmed = formatRes(item.totalLootFarmed);
    item.totalMightKilled = formatRes(item.totalMightKilled);
    item.totalMightLost = formatRes(item.totalMightLost);
    _.each(item.hits, function (hit) {
      if (hit.boxContent) {
        if (incoming) {
          hit.stats.heroLvl = hit.boxContent.s0KCombatLv || 0;
          hit.stats.heroLvlOther = hit.boxContent.s1KCombatLv || 0;
          hit.stats.defBoost = hit.boxContent.s0defBoost || 0;
          hit.stats.atkBoost = hit.boxContent.s0atkBoost || 0;
          hit.stats.defBoostOther = hit.boxContent.s1defBoost || 0;
          hit.stats.atkBoostOther = hit.boxContent.s1atkBoost || 0;
        } else {
          hit.stats.heroLvl = hit.boxContent.s1KCombatLv || 0;
          hit.stats.heroLvlOther = hit.boxContent.s0KCombatLv || 0;
          hit.stats.defBoost = hit.boxContent.s1defBoost || 0;
          hit.stats.atkBoost = hit.boxContent.s1atkBoost || 0;
          hit.stats.defBoostOther = hit.boxContent.s0defBoost || 0;
          hit.stats.atkBoostOther = hit.boxContent.s0atkBoost || 0;
        }
      }

      hit.stats.loot = refactorLoot(hit.boxContent.loot);
      hit.reportLine = 'hit ==> ' + formatStats(hit.stats) + '  ' + hit.by;
      console.log('hit ==>', formatStats(hit.stats));
    });

  });

  reportData.allianceHits = _.sortBy(reportData.allianceHits, function (item) {
    return -item.hits.length;
  });

  var filePrefix = incoming ? 'incoming' : 'outgoing';
  var htmlFileName = path.resolve(process.env.HOME, 'reports', filePrefix + 'ByAlliance.html');
  fs.writeFileSync(htmlFileName, generateIncomingReport(reportData, incoming));
}

function addAllianceHit(allianceHit, hit, users, alliances, incoming) {
  var user0, user1;
  allianceHit.hits.push(hit);

  user0 = users['u' + hit.side0PlayerId] || {
    n: 'unknown'
  };
  user1 = users['u' + hit.side1PlayerId] || {
    n: 'unknown'
  };

  hit.on = user0.n;
  hit.by = user1.n;

  hit.stats = {
    n: user0.n,
    xCoord: hit.side0XCoord,
    yCoord: hit.side0YCoord,
    xCoordFrom: hit.side1XCoord,
    yCoordFrom: hit.side1YCoord,
    reportUnixTime: hit.reportUnixTime
  };

  hit.boxContent.n = user0.n;
  hit.stats.loot = refactorLoot(hit.boxContent.loot);

  hit.stats.attUnits = hit.stats.defUnits = 0;
  if (hit.boxContent.fght) {
    var s0 = hit.boxContent.fght.s0;
    var s1 = hit.boxContent.fght.s1;
    hit.stats.attUnits = countUnits(s1);
    hit.stats.attMightLost = calculateMightLost(s1);
    hit.stats.defUnits = countUnits(s0);
    hit.stats.defMightLost = calculateMightLost(s0);
  }

  allianceHit.totalLootFarmed += hit.stats.loot.total;
  if (hit.stats.attMightLost)
    allianceHit.totalMightLost += hit.stats.attMightLost;
  if (hit.stats.defMightLost)
    allianceHit.totalMightKilled += hit.stats.defMightLost;

}

var reportFormat = '%4s  %4s  %4s  %4s %4s  %s %s';

var hitReportFormat = '%-15s (%3d %3d)  %4s %7s %s (%3d %3d) %7d %7d %4.1f  %3s %s%s  %3s %s%s';

function outputHeader() {
  return '  hit opponent             opp coord   res unitSnt time  own coord mgtLost mgtKild ratio Hero Bst  Other  Bst\n' + '  ------------             --------- ----- ------- ----- --------- ------- ------- ----- --- ---- ------ ----';
}


function formatStats(stats) {
  if (stats.loot) {
    try {
      stats.attMightLost = stats.attMightLost || 0;
      stats.defMightLost = stats.defMightLost || 0;
      stats.ratio = stats.defMightLost / stats.attMightLost;
      stats.ratioShort = printf("%4.1f", stats.ratio);
      stats.attMightLost = formatRes(stats.attMightLost);
      stats.defMightLost = formatRes(stats.defMightLost);

      stats.defSymbol = boostSymbol(stats.defBoost, 'def');
      stats.attSymbol = boostSymbol(stats.attBoost, 'att');

      stats.defSymbolOther = boostSymbol(stats.defBoostOther, 'def');
      stats.attSymbolOther = boostSymbol(stats.attBoostOther, 'att');

      stats.totalFarmed = formatRes(stats.loot.total);
      stats.max = stats.attUnits * 9000 <= stats.loot.total;
      stats.capacity = stats.attUnits * 9000;
      stats.hitTime = toSimpleTime(toGameTime(new Date(stats.reportUnixTime * 1000)));
      stats.heroLvl = shortenHeroLvl(stats.heroLvl);
      stats.heroLvlOther = shortenHeroLvl(stats.heroLvlOther);

      return printf(hitReportFormat, stats.n, stats.xCoord, stats.yCoord,
      /*        formatRes(stats.loot.food),
        formatRes(stats.loot.wood),
        formatRes(stats.loot.stone),
        formatRes(stats.loot.ore),*/
      formatRes(stats.loot.total), stats.attUnits, toSimpleTime(toGameTime(new Date(stats.reportUnixTime * 1000))), stats.xCoordFrom, stats.yCoordFrom, stats.attMightLost, stats.defMightLost, stats.ratio, stats.heroLvl, stats.attSymbol, stats.defSymbol, stats.heroLvlOther, stats.attSymbolOther, stats.defSymbolOther);
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

function calculateMightLostRank(rank) {
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
  'u14': 28,
  'u15': 28,
  'u16': 28,
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

function generateReport(reportData) {
  var templateFile = fs.readFileSync('/home/ec2-user/trap4004/view/hits.mu', 'utf-8').toString();
  var headerFile = fs.readFileSync('/home/ec2-user/trap4004/view/header.mu', 'utf-8').toString();

  // compile template
  var template = hogan.compile(templateFile);
  var header = hogan.compile(headerFile);

  return template.render(reportData, {
    'header': header
  });

}

function generateIncomingReport(allianceHits, incoming) {
  var filePrefix = incoming ? 'incoming' : 'outgoing';
  var templateFile = fs.readFileSync('/home/ec2-user/trap4004/view/' + filePrefix + '.mu', 'utf-8').toString();
  var headerFile = fs.readFileSync('/home/ec2-user/trap4004/view/header.mu', 'utf-8').toString();

  // compile template
  var template = hogan.compile(templateFile);
  var header = hogan.compile(headerFile);

  return template.render(allianceHits, {
    'header': header
  });

}

function shortenHeroLvl(lvl) {
  if (typeof lvl !== 'string') return lvl;
  if (lvl === 'Higher') return 'Hgr';
  return lvl.substring(0,3);
}

function boostSymbol(boost, type) {
  type = type || 'att';
  var boostSym = {'att': ['a', 'A'], 'def': ['d', 'D']};
  var boost20 = boost <= 0.21 && boost > 0;
  var boost100 = boost > 0.9;
  return boost100 ? boostSym[type][1] : boost20 ? boostSym[type][0] : ' ';
}

// Extend Date prototype to add getMonthName and getDayName
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

