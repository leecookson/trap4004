var Proxy    = require('mitm-proxy')
  , url      = require('url')
  , fs       = require('fs')
  , readline = require('readline')
  , rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

var port = process.argv[2] || 80;

var captures = {};

function Processor(proxy) {
  var res = {}, path, handle = false;
  proxy.on('response', function (response) {
    res = response;
    var host = res.socket._httpMessage._headers.host;
    path = res.socket._httpMessage.path;
    if (host.indexOf('hobbitmobile.com') !== -1) {
      handle = true;
      // console.log('headers', res.headers);
      res.rawData = '';
    }

  });
  proxy.on('response_data', function (data) {
    if (handle) {
      // console.log('data', data.toString());
      res.rawData += data.toString();
    }
  });
  proxy.on('response_end', function () {
    if (handle) {
      // console.log('data_end');

      var data;
      if (res.rawData[0] === '{') {
        data = JSON.parse(res.rawData);
      } else {
        data = res.rawData.split(':')[1];
      }
      captures[path] ? null : captures[path] = [];
      captures[path].push(data);
      console.log('path', path);
      console.log('data', data);
    }
  });
}

function saveData() {
  var saveFileName = 'KoM_' + process.pid + '.json';
  console.log('Saving:', saveFileName);
  fs.writeFileSync(saveFileName, JSON.stringify(captures));

  console.log('Saved:', saveFileName);
  process.exit(0);
}

process.on('SIGINT', function () {
  saveData();
});

rl.on('SIGINT', function () {
  saveData();
});

console.log('Starting on port', port);

new Proxy({proxy_port: 80, mitm_port: 4003}, Processor);
