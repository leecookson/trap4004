
module.exports = exports = toGameTime;

// difference between game time and local time
var gameHoursShift = 0;

function toGameTime(date) {
  if (!date) return new Date();

  var gameTime = new Date(date);
  gameTime.setHours(date.getHours() - gameHoursShift);
  return gameTime;
}
