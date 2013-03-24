#!/usr/bin/env node
var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , Data = require('./data');

var file = process.argv[2];

console.log('Trap file:', file);

var inData = fs.readFileSync(file);
inData = JSON.parse(inData);


var data = new Data();

data.loadAll(function (err) {

  var mapData = data.get('map')
    , userData = data.get('user')
    , playerData = data.get('player')
    , bookmarkData = data.get('bookmark')
    , allyData = data.get('ally');

  _.each(inData, function (value, key, list) {
    if (key === '/ajax/fetchMapTiles.php') {
      value.forEach(function (mapObj) {
        _.extend(mapData, mapObj.data);
        _.extend(userData, mapObj.userInfo);
        _.extend(allyData, mapObj.allianceNames);
        _.each(mapObj.allianceMights, function (value, key, list) {
          updateAlliance(allyData, key, {might: value});
        });
      });
    }
    if (key === '/ajax/listReports.php') {
      value.forEach(function (report) {

        _.each(report.arPlayerNames, function (value, key, list) {
          updateUser(userData, key, value);
        });

        _.each(report.arAllianceNames, function (value, key, list) {
          updateAlliance(allyData, key, value);
        });
      });
    }
    if (key === '/ajax/updateSeed.php') {
      _.extend(playerData, {"self": value[value.length - 1]});
    }
    if (key === '/ajax/allianceGetOtherInfo.php') {
      value.forEach(function (report) {
        _.each(report.otherAlliances, function (value, key, list) {
          updateAlliance(allyData, key, value);
        });
      });
    }
    if (key === '/ajax/getReport.php') {
    }
    if (key === '/ajax/tileBookmark.php') {
      if (value && value.length > 1) {
        _.extend(bookmarkData, value[value.length - 1].bookmarkInfo);
      }
    }
  });

  data.saveAll(function (err) {
    if (err) return console.error(err);
    console.log('Data Saved');
  });
});

function updateAlliance(allyData, key, newInfo) {
  var allyKey;
  // for some reason, otherAlliances uses just numbers
  if (key[0] >= '0' && key[0] <= '9') {
    allyKey = 'a' + key;
  } else {
    allyKey = 'a' + key.slice(1);
  }

  if (allyData[allyKey]) {
    if (typeof allyData[allyKey] === 'string') {
      // fix up old data
      allyData[allyKey] =  {'name': allyData[allyKey]};
    }

    if (typeof newInfo !== 'string') {
      // do not handle simple alliance names if alliance already exists
      _.extend(allyData[allyKey], newInfo);
    }
  } else {
    // Alliance doesn't exist yet
    if (typeof newInfo === 'string') {
      allyData[allyKey] =  {'name': newInfo};
    } else {
      allyData[allyKey] = newInfo;
    }
  }

}

function updateUser(userData, key, newInfo) {
  var userKey = 'u' + key.slice(1);
  if (key[0] === 'u') {
    // This is a user record, merge it in to existing
    _.extend(userData[userKey], newInfo);
  }

  if (key[0] === 'p') {
    // Just a user name
    if (!userData[userKey]) {
      userData[userKey] = { 'u': newInfo };
    } else {
      userData[userKey].u = newInfo;
    }
  }
  if (key[0] === 'g') {
    // Just a user gender/sex
    if (!userData[userKey]) {
      userData[userKey] = { 's': newInfo };
    } else {
      userData[userKey].s = newInfo;
    }
  }
  if (key[0] === 'r') {
    // Just a user race (elf/dwarf)
    if (!userData[userKey]) {
      userData[userKey] = { 'r': newInfo };
    } else {
      userData[userKey].r = newInfo;
    }
  }

}
