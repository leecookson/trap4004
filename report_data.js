var fs = require('fs'),
  async = require('async'),
  _ = require('underscore'),
  Data = require('./data'),
  traverse = require('traverse'),
  mongodb = require('mongodb');

module.exports = exports = ReportData;

var importantLimit = 10;

function ReportData(domain) {

  this.me = 'ReportData';
  this.data = new Data({domain:domain});
}

ReportData.prototype.close = function () {
  this.data.closeDB();
};

ReportData.prototype.find = function (id, cb) {
  var self = this;
  var query = {'id': id};
  var limit = 150;
  if (typeof id === 'function') {
    query = {};
  }

  self.data.findItem(id, 'report', cb);
};

ReportData.prototype.update = function (id, item, cb) {
  var self = this;

  //console.log('updating report', id, item, 'report', typeof cb);
  self.data.saveItem(id, item, 'report', cb);
};

ReportData.prototype.handleReports = function (reports, cb) {
  var self = this;

  async.each(
    _.keys(reports),
   function (key, next) {
      //console.log('key', key);
      //TODO: filter out reports with less than 10 troops
      var report = reports[key];
      //if (self.isImportant(report)) {
        report.id = key;
        self.update(key, report, function (err, data) {
          next(err, data);
        });
      //} else {
      //  next(null);
      //}
    },
    function (err) {
      cb(err);
    }
  );
};

ReportData.prototype.isImportant = function (report) {
  var totalUnits = 0;

  traverse(report.boxContent.fght).forEach(function (x) {
    if (this.key && this.key.match(/u[0-9]+/)) {
      totalUnits += parseInt(x[0], 10);
    }
  });

  return totalUnits > importantLimit;
};

function countUnits(fightSide) {

  var totalUnits = 0;
  traverse(fightSide).forEach(function (x) {
    if (this.key && this.key.match(/u[0-9]+/)) {
      totalUnits += parseInt(x[0], 10);
    }
  });
}
