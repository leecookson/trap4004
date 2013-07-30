var http = require('http'),
  util = require('util'),
  _ = require('underscore'),
  fs = require('fs'),
  TrapExtract = require('./trap_extract');

var captures = {};

var port = process.argv[3] || 4004;
var gameDomain = process.argv[2] || 'hobbitmobile';

if (process.env['SUBDOMAIN']) {
    port = 80;
}

function saveData() {
  var saveFileName = 'KoM_' + process.pid + '.json';
  console.log('Saving:', saveFileName);
  fs.writeFileSync(saveFileName, JSON.stringify(captures));

  console.log('Saved:', saveFileName);
  process.exit(0);
}

console.log('Listening on port', port, 'for game', gameDomain);

process.on('SIGINT', function () {
  console.log('SIGINT');
  process.exit();
});


process.on('uncaughtException', function (err, msg) {
  console.log('uncaught', err, msg, err.stack);
});

http.createServer(function (req, res) {
  // console.log('in handler for createServer', req);
  var host = req.headers['host'];
  var proxy = http.createClient(80, req.headers['host']);
  var handle = false;

//  console.log(host);

  if (host.indexOf(gameDomain) !== -1) {
    handle = true;
    // console.log('headers', res.headers);
    res.rawData = '';
  }

//  console.log('handle', handle);
//  console.log(req.url);
  if (handle) {
    var hostPos = req.url.indexOf(host) + host.length;
    var path = req.url.substring(hostPos);

    var trap_extract = new TrapExtract(req.headers.host, path);
  }

  var proxy_req = proxy.request(req.method, req.url, req.headers);

  proxy_req.addListener('response', function (proxy_res) {

    proxy_res.addListener('data', function (chunk) {
      if (handle) res.rawData += chunk.toString();

      res.write(chunk, 'binary');
    });

    proxy_res.addListener('end', function () {
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
//        console.log('path', path);

        trap_extract.handle(data, function (err) {
          if (err) {
            if (err.message === 'UnhandledPath') {
              //console.log(Date(), 'unhandled path', path);
            } else {
              console.log('error extracting', err);
            }
          } else {
            console.log(Date(), 'handled path', path);
          }
        });
      }

      res.end();
    });
    res.writeHead(proxy_res.statusCode, proxy_res.headers);
  });

  req.addListener('data', function (chunk) {
    proxy_req.write(chunk, 'binary');
  });

  req.addListener('end', function () {
    proxy_req.end();
  });
}).listen(port);
