var _ = require('underscore');

var Data = require('./data');
var dist = require('./dist');

var data = new Data();

var origin = {'x': process.argv[2] || 112, 'y': process.argv[3] || 121}; // TODO: make command line args

console.log('sorting from', origin);

data.loadAll(function (err) {
  var bookmarks = data.get('bookmark');
  var map = data.get('map');
  var bookmarksSorted = [];

  bookmarks = _.toArray(bookmarks);

  bookmarksSorted = _.sortBy(bookmarks, function (bookmark) {
    bookmark.dist = dist(bookmark.xCoord, bookmark.yCoord, origin.x, origin.y);
    return bookmark.dist;
  });

  // TODO: write this out to a specific file automatically, not std out
  var counter = 0;
  _.each(bookmarksSorted, function (value, key) {
    if (value.name.indexOf('Farm') === 0) {
      console.log(value.xCoord, value.yCoord, "Farm", Math.floor(value.dist * 10));
    }
  });
  process.exit();
});

function getCoords(mapKey) {
  var p = /l_([0-9]+)_t_([0-9]+)/;
  var r = mapKey.match(p);
  return {x: r[1], y: r[2]};
}

