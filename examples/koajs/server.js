module.exports.needs = ['koa'];
module.exports.fn = function(imports) {
  var koa = imports.koa;
  var app = koa();
  return app;
}