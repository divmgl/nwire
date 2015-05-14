'use strict';
var path = require('path');

var Application = function(config) {
  var base = config.url || '';
  var definitions = config.packages;
  var self = this;

  self.packages = {};

  if (definitions == null ||
    definitions instanceof Array ||
    !(definitions instanceof Object)) {
    throw "Invalid package definitions.";
  }

  var loadDefinition = function(definition) {
    var previous = self.packages[definition];
    if (previous != null) return previous;

    if (typeof(definition) !== 'string') throw "Invalid package definition.";

    var pkg, imports = {};

    try {
      pkg = require(path.join(base, 'node_modules', definition));
    } catch (e) {
      pkg = require(path.join(base, definition));
    }

    if (pkg.hasOwnProperty('needs') &&
      pkg.needs instanceof Array) {
      pkg.needs.forEach(function(need) {
        self.packages[need] = loadDefinition(definitions[need]);
        imports[need] = self.packages[need];
      });
    }

    if (pkg.hasOwnProperty('fn')) {
      pkg = pkg.fn(imports);
    }

    // if (pkg.hasOwnProperty('needs') &&
    //   pkg.needs instanceof Array) {

    //   pkg.needs.forEach(function(need) {
    //     self.packages[need] = loadDefinition(definitions[need]);
    //   });
    // }

    // if (pkg.hasOwnProperty('fn')) {
    //   var imports = {};
    //   if (pkg.needs) {
    //     var needs = pkg.needs;

    //     console.log('starting to import');

    //     if (needs != null && !(needs instanceof Array))
    //       throw "Invalid package definition on (needs).";

    //     console.log(needs);

    //     needs.forEach(function(need) {
    //       imports[need] = self.packages[need];
    //     });
    //   }

    //   pkg = pkg.fn(imports);
    // }

    return pkg;
  }

  for (var definition in definitions) {
    self.packages[definition] = loadDefinition(definitions[definition]);
  }
}

module.exports = function nwire(config, callback) {
  if (config == null ||
    config.packages == null) {
    var err = "Please provide a valid configuration object.";
    if (callback) return callback(err);
    else throw err;
  }

  try {
    var app = new Application(config);
    if (callback) callback(null, app);
  } catch (err) {
    if (callback) callback(err);
    else throw err;
  }
}