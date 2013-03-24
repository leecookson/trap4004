var _ = require('underscore');

module.exports = exports = formatRes;

function formatRes(value) {
  var val = parseInt(value, 10);
  if (_.isNaN(val)) return -1;

  if (val === 0) return '0';

  var div = 1, shift = 0, mag = ' ';

  if (val >= 1000000000.0) {
    shift = 9;
    div = 1000000000;
    mag = 'b';
  } else if (val >= 1000000.0) {
    shift = 6;
    div = 1000000;
    mag = 'm';
  } else if (val >= 1000.0) {
    shift = 3;
    div = 1000;
    mag = 'k';
  }
  var prec = (val / div).toPrecision(3);
  prec = ('' + prec).substring(0, 3);
  if (prec.substring(prec.length - 2) === '.0') {
    prec = '' + prec.substring(0, 1);
  }
  if (prec.substring(prec.length - 1) === '.') {
    prec = '' + prec.substring(0, 2);
  }
  return '' + prec + mag;
  // TODO: handle pos and negative

}
