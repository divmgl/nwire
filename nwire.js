module.exports = function nwire(config, callback) {
  'use strict';

  // Set up a wiring container that injects all necessary components into
  // the packages provided
  var Wiring = function() {
    // Validate configuration object
    if (!config || typeof config !== 'object')
      throw "Please provide a valid configuration object.";

    var path = require('path');
    var base = config.url || '';
    var definitions = config.packages || {};

    // Validate package definitions
    if (!definitions || definitions instanceof Array ||
      !(definitions instanceof Object)) definitions = {};

    var self = this;
    self.packages = {};

    var load = function(name, skipNeeds) { // Responsible for loading packages
      if (typeof(name) !== 'string') throw "Invalid package definition.";

      if (!definitions[name]) return undefined;

      // If a package already exists with the same name, do not attempt to
      // overwrite it. Return the existing package.
      var loaded = self.packages[name];
      if (loaded) return loaded;

      var pkg, imports = {};

      var resolve = function(name) {
        try { // Try to load a system module first
          return require(name)
        } catch (e) {
          try { // Try to load an NPM module
            return require(path.join(base, 'node_modules', name));
          } catch (er) { // Try to load the module through the base directory
            try {
              return require(path.join(base, name));
            } catch (err) {
              return null;
            }
          }
        }
      }

      pkg = resolve(definitions[name]);
      if (!pkg) return null;

      // If a package is dependent on other packages, it's time to load them.
      if (pkg.hasOwnProperty('needs') && pkg.needs instanceof Array)
        pkg.needs.forEach(function(dependencyName) {
          var definition = resolve(definitions[dependencyName]);
          var skip = false;

          if (definition.needs)
            for(var i = 0; i < definition.needs.length; i++){
              var need = definition.needs[i];
              if (need == name) skip = true;
            }

          if (!skipNeeds) {
            self.packages[dependencyName] = load(dependencyName, skip);
            Object.defineProperty(imports, dependencyName, {
              get: function(){
                return self.packages[dependencyName];
              }
            });
          }
        });

      // If package implements the fn function then inject the necessary
      // packages and replace the package signature with the object it
      // returns
      if (pkg.hasOwnProperty('fn')) pkg = pkg.fn(imports);

      return pkg;
    }

    for (var definition in definitions) {
      if (!definition) continue;
      var fn = load(definition);
      if (fn) self.packages[definition] = fn;
    }
  }

  try {
    var app = new Wiring();
    if (!callback) return app;
    callback(null, app);
  } catch (err) {
    if (!callback) throw err;
    callback(err);
  }
}
