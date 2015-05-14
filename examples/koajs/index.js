var wire = require('../../');
var http = require('http');
var config = require('./config');

wire(config, function(err, app) {
  var server = http.Server(app.packages.server.callback());
  server.listen(80);
});

// // Require all necessary libraries
// var path = require('path');
// var http = require('http');
// var architect = require('architect'); // DI framework
// var winston = require('winston'); // Logger

// // Winston will allow us to keep a detailed track
// // of all of the events that occur within an application's
// // lifecycle
// var consoleTransport = new winston.transports.Console({
//   colorize: true,
//   json: false,
//   humanReadableUnhandledException: true
// });
// // Handle all exceptions through Winston
// winston.handleExceptions(consoleTransport);

// // Application bootstrap
// var bootstrap = function(err, app) {
//   winston.info('Bootstrapping application...');

//   var application = app.getService("app"); // Get the application service
//   // Get the callback from Koa.js
//   var server = http.Server(application.callback());
//   var port = process.env.PORT || 80;

//   server.listen(port); // Create the HTTP server

//   winston.log('info', 'Application is now running on port ' + port + '.');
// }

// // Begin the injection process and start filling all needed modules
// var configPath = path.join(__dirname, 'config.js');
// winston.info('Loading configuration...');
// var config = architect.loadConfig(configPath); // Architect configuration

// // This is the composite root
// architect.createApp(config, bootstrap);