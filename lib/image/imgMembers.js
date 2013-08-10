var fs = require('fs');

var im = require('imagemagick');

var standardOptions = [
  '-fill', 'black',
  '-font', 'DejaVu-LGC-Sans-Mono-Bold',
  '-pointsize', '14',
  '-linewidth', '3'
];


var height = 30,
  width = 420,
  yPos = 5,
  lineHeight = 16,
  size = '';

var inputFileName = process.argv[2] || 'reports/allies.txt',
  outputFileName = process.argv[3] || 'reports/members.jpg',
  title = process.argv[4] || 'Current Member Might';

var cmd = [];

cmd.push('-draw');
cmd.push('text 10,' + (yPos+=lineHeight) +' \'' + title + '\'');

var inputText = fs.readFileSync(inputFileName, 'utf-8');

var inputLines = inputText.split('\n');

for (var i in inputLines) {
  var line = inputLines[i].replace("'", "\\'");
  cmd.push('-draw');
  cmd.push('text 10,' + (yPos+=lineHeight) + " '" + line + "'");
  height += lineHeight;
}

size = width + 'x' + height;

var init = [
  '-size',
  size,
  'xc:white'
];

var exec = init.concat(standardOptions, cmd, [outputFileName]);
//console.log(exec.slice(0,14).join(' '));

im.convert(exec,
  function (err, stdout) {
    if (err) console.error(err, stdout);
  }
);



