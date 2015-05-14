module.exports.needs = ['koa'];
module.exports.fn = function(imports) {
  var koa = imports.koa;
  var app = koa();
  return app;
}

// module.exports = function(options, imports, register) {
//   var koa = require('koa');
//   var app = koa();

//   app.use(require('koa-logger')());
//   app.use(imports.router);

//   // Register the "app" service within the plugin.
//   register(null, {
//     // Expose the Koa.js application to any callers that may want to spin up a 
//     // version of the application. Load balancing potential in the future?
//     app: app
//   });
// }

// // Let Architect know that "app" is an alive and registered service
// module.exports.provides = ["app"];
// module.exports.consumes = ["router"];