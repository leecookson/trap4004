var path = require('path'),
  fs = require('fs'),
  hogan = require('hogan.js'),
  _ = require('underscore'),
  toGameTime = require('./gameTime'),
  toSimpleTime = require('./simpleTime'),
  toSimpleDate = require('./simpleDate');

var reportFolder = process.argv[2] || 'ally'
var templateFileName = path.resolve('folderIndex.mu');
var indexFileName = path.resolve('reports', reportFolder, 'index.html');
var folderPath = path.resolve('reports', reportFolder);

var templateSource = fs.readFileSync(templateFileName, 'utf-8').toString();
var headerFile = fs.readFileSync('header.mu', 'utf-8').toString();

var template = hogan.compile(templateSource);
var header = hogan.compile(headerFile);

var indexData = {
  name: reportFolder,
  now: toSimpleTime(toGameTime(new Date())),
  files: []
};

var folderPath = path.resolve('reports', reportFolder);

var files = fs.readdirSync(folderPath);

files.sort();

files.forEach(function (item) {
  var name = path.basename(item, '.html');
  var file = path.resolve('reports', reportFolder, item);
  if (item[0] !== '.' && item !== 'index.html') {
    var fileData = {name: name, file: item, stats: fs.statSync(file)};
    fileData.stats.mTime = toSimpleTime(toGameTime(fileData.stats.mtime));
    fileData.stats.mDate = toSimpleDate(toGameTime(fileData.stats.mtime));
    indexData.files.push(fileData);
  }
});

indexData.fileCount = indexData.files.length;

fs.writeFileSync(indexFileName, template.render(indexData, {
  'header': header
}), 'utf-8');


