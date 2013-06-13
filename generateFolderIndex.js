var path = require('path'),
  fs = require('fs'),
  hogan = require('hogan.js'),
  toGameTime = require('./gameTime'),
  toSimpleTime = require('./simpleTime');

var reportFolder = process.argv[2] || 'ally'
var templateFileName = path.resolve('folderIndex.mu');
var indexFileName = path.resolve('reports', reportFolder, 'index.html');
var folderPath = path.resolve('reports', reportFolder);

var templateSource = fs.readFileSync(templateFileName, 'utf-8').toString();

var template = hogan.compile(templateSource);

var indexData = {
  name: reportFolder,
  now: toSimpleTime(toGameTime(new Date())),
  files: []
};

var folderPath = path.resolve('reports', reportFolder);

var files = fs.readdirSync(folderPath);

files.forEach(function (item) {
  var name = path.basename(item, '.html');
  if (name !== 'index') {
    indexData.files.push({name: name, file: item});
  }
});

fs.writeFileSync(indexFileName, template.render(indexData), 'utf-8');


