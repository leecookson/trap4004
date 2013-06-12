
var currentScore = process.argv[2] || 1;
var currentNext = process.argv[3] || 20;

currentScore = parseInt(currentScore, 10);
currentNext = parseInt(currentNext, 10);

var nextMap = [];
var nextXp = [];

var xp = 0;
for (var lvl = 1; lvl < 216; lvl++) {
  var lvlPts = lvl * 20;
  xp += lvlPts;
  //console.log('lvl', lvl + ',  needed for next level', lvlPts + ',   next level XP', xp);
  nextMap[lvlPts] = lvl;
  nextXp[lvl] = xp;
}

var maxGoodXp = nextXp[199] - 20;

console.log('current score  :', currentScore);
console.log('current next   :', currentNext);
console.log('--------------------------');

var currentLevel = nextMap[currentNext];
if (currentLevel) {
  var currentXp = nextXp[currentLevel - 1] + currentScore;
  var xpNeeded = maxGoodXp - currentXp;

  console.log('current Level   :', currentLevel);
  console.log('current XP      :', currentXp);
  //  console.log('next level XP   :', nextXp[currentLevel]);
  console.log('max to get 199  :', maxGoodXp);
  console.log('XP needed       :', xpNeeded);
  console.log('--------------------------');

  var trainsNeeded = calcTrains(xpNeeded);
  console.log('Gandalfs Needed :', trainsNeeded[0]);
  console.log('Archers Needed  :', trainsNeeded[1]);
  console.log('Warriors Needed :', trainsNeeded[2]);
  console.log('Hits Needed     :', trainsNeeded[3]);
} else {
  console.log('Next ', currentNext, 'is not valid');
}

/* returns array [ gandalfs, archers, warriors, hits ] */
function calcTrains(xpNeeded) {

  var returnVal = [0, 0, 0, 0];

  while (xpNeeded > 50000) {
    returnVal[0]++;
    xpNeeded -= 50000;
  }

  while (xpNeeded > 10000) {
    returnVal[1]++;
    xpNeeded -= 10000;
  }

  while (xpNeeded > 1000) {
    returnVal[2]++;
    xpNeeded -= 1000;
  }

  returnVal[3] = Math.floor(xpNeeded / 20);

  return returnVal;

}
