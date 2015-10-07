var wire = require('../../');

wire(require('./config'), function(err, app) { // Composite root
  if (err) throw err;
  app.packages.server.bootstrap(1337);
});