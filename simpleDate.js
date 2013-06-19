var printf = require('printf');

module.exports = exports = toSimpleDate;

function toSimpleDate(date) {
  if (!date) return '01/01';
  return printf('%02d/%02d', date.getMonth() + 1, date.getDate());
}
