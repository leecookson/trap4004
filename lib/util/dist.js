module.exports = exports = dist;

function dist(x1, y1, x2, y2)
{
  var aa = (Math.pow((x2 - x1), 2)) + (Math.pow((y2 - y1), 2));
  return Math.sqrt(aa);
}

