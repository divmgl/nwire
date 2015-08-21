var wire = require('../../');
var config = require('./config');

wire(config, function(err, app) { // Composite root
  if (err) throw err;
  app.packages.server.bootstrap(1337);
});