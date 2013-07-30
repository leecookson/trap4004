var fs = require('fs'),
  async = require('async'),
  _ = require('underscore'),
  Data = require('./data'),
  mongodb = require('mongodb');

module.exports = exports = BookmarkData;

function BookmarkData(domain) {

  this.me = 'BookmarkData';
  this.data = new Data({domain: domain});
}

BookmarkData.prototype.close = function () {
  this.data.closeDB();
};

BookmarkData.prototype.find = function (id, cb) {
  var self = this;

  self.data.findItem(id, 'bookmark', cb);
};

BookmarkData.prototype.update = function (id, item, cb) {
  var self = this;

  //console.log('updating user', id, item, 'user', typeof cb);
  self.data.saveItem(id, item, 'bookmark', cb);
};

BookmarkData.prototype.handleBookmarks = function (BookmarkData, cb) {
  var self = this;

  async.each(
    _.keys(BookmarkData),
   function (key, next) {
      //console.log('key', key);
      var bookmark = BookmarkData[key];
      bookmark.id = key;
      self.update(key, bookmark, function (err, data) {
        next(err, data);
      });
    },
    function (err) {
      cb(err);
    }
  );
};

