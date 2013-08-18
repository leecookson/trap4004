var path = require('path'),
  fs = require('fs'),
  hogan = require('hogan.js'),
  toGameTime = require('../util/gameTime'),
  toSimpleTime = require('../util/simpleTime');

var templateFileName = path.resolve(process.env.HOME, 'trap4004', 'view/index.mu');
var indexFileName = path.resolve(process.env.HOME, 'reports', 'index.html');

var templateFile = fs.readFileSync(templateFileName, 'utf-8').toString();
var headerFile = fs.readFileSync('/home/ec2-user/trap4004/view/header.mu', 'utf-8').toString();

// compile template
var template = hogan.compile(templateFile);
var header = hogan.compile(headerFile);


var indexData = {
  now: toSimpleTime(toGameTime(new Date()))
};

indexContent = template.render(indexData, {
  'header': header
});

fs.writeFileSync(indexFileName, indexContent, 'utf-8');


