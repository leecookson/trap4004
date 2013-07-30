var fs = require('fs');

var im = require('imagemagick');

var standardOptions = [
  '-fill', 'black',
  '-font', 'DejaVu-LGC-Sans-Mono-Bold',
  '-pointsize', '14',
  '-linewidth', '3'
];

var height = 30,
  width = 390,
  yPos = 5,
  lineHeight = 16,
  size = '';

var inputFileName = 'reports/allies.txt',
  outputFileName = 'reports/members.jpg';

var cmd = [];

cmd.push('-draw');
cmd.push('text 10,' + (yPos+=lineHeight) +' \'Current Member Might\'');

var inputText = fs.readFileSync(inputFileName, 'utf-8');

var inputLines = inputText.split('\n');

for (var i in inputLines) {
  var line = inputLines[i].replace("'", "\\'");
  cmd.push('-draw');
  cmd.push('text 10,' + (yPos+=lineHeight) + " '" + line + "'");
  height += lineHeight;
}

size = width + 'x' + height;
console.log(size);

var init = [
  '-size',
  size,
  'xc:white'
];

var exec = init.concat(standardOptions, cmd, [outputFileName]);
console.log(exec.slice(0,14).join(' '));

im.convert(exec,
  function (err,stdout) {
    console.log(err, stdout);
  }
);



