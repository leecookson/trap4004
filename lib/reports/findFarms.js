var _ = require('underscore');

var Data = require('./data');

var data = new Data();
var dist = require('./dist');

var origin = {'x': process.argv[2] || 112, 'y': process.argv[3] || 121}; // TODO: make command line args

data.loadAll(function (err) {
  var users = data.get('user');
  var map = data.get('map');
  var farms = [];

  _.each(map, function (value, index) {
    var user; // = users['u' + value.tileUserId];
    user = _.find(users, function (item) {return item.id === 'u' + value.tileUserId; });
    if (user && user.t * 1 > 10 && (user.t * 150 > user.m) && value.cityName) {
      var coords = {x: value.xCoord, y: value.yCoord};
      farms.push({coords: coords, user: user, distance: dist(coords.x, coords.y, origin.x, origin.y)});
    }
  });

  farms = _.sortBy(farms, 'distance');
  // TODO: write this out to a specific file automatically, not std out
  _.each(farms, function (value, key) {
    console.log(value.coords.x, value.coords.y, value.user.n, value.user.t, value.user.m, Math.round(value.distance));
  });
  process.exit();
});

function getCoords(mapKey) {
  var p = /l_([0-9]+)_t_([0-9]+)/;
  var r = mapKey.match(p);
  return {x: r[1], y: r[2]};
}

