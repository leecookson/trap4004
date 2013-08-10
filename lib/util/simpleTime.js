var printf = require('printf');

module.exports = exports = toSimpleTime;

function toSimpleTime(date) {
  if (!date) return '00:00';
  return printf('%02d:%02d', date.getHours(), date.getMinutes());
}
