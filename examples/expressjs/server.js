module.exports.needs = ['express-app', 'winston'];
module.exports.fn = function($) {
  var app = $["express-app"]();

  var bootstrap = function(port) {
    return app.listen(port, function() {
      $.winston.info("Server started on port %s", port)
    });
  }

  return {
    bootstrap: bootstrap
  };
}
