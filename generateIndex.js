var path = require('path'),
  fs = require('fs'),
  hogan = require('hogan.js'),
  toGameTime = require('./gameTime'),
  toSimpleTime = require('./simpleTime');

var templateFileName = path.resolve('index.mu');
var indexFileName = path.resolve('reports', 'index.html');

var templateFile = fs.readFileSync(templateFileName, 'utf-8').toString();
var headerFile = fs.readFileSync('header.mu', 'utf-8').toString();

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


