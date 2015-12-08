var wire = require('../../');

wire(require('./config'), function(err, app) { // Composite root
  if (err) throw err;
  app.server.bootstrap(3000);
});
