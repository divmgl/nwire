module.exports.needs = ['express', 'winston'];
module.exports.fn = function($) {
  var app = $.express();

  var bootstrap = function(port) {
    return app.listen(port, function() {
      $.winston.info("Server started on port %s", port)
    });
  }

  return {
    bootstrap: bootstrap
  };
}