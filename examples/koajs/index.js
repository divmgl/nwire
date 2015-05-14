var wire = require('../../');
var http = require('http');
var config = require('./config');

wire(config, function(err, app) {
  var server = http.Server(app.packages.server.callback());
  server.listen(1337);
});