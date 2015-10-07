module.exports.needs = ['koa', 'winston', 'http'];
module.exports.fn = function($) {
  var app = $.koa();
  var server = $.http.Server(app.callback())

  var bootstrap = function(port) {
    server.listen(port);
    $.winston.info("Server started on port %s", port);
    return server;
  }

  return {
    bootstrap: bootstrap
  };
}