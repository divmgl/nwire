var wire = require('../../');
var config = require('./config');

wire(config, function(err, app) { // Composite root
  app.packages.server.listen(3000);
});