module.exports.needs = ['express'];
module.exports.fn = function(imports) {
  var express = imports.express;
  var app = express();
  return app;
}