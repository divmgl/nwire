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

    var load = function(name) { // Responsible for loading packages
      if (typeof(name) !== 'string') throw "Invalid package definition.";

      if (!definitions[name]) return undefined;

      // If a package already exists with the same name, do not attempt to
      // overwrite it. Return the existing package.
      var loaded = self.packages[name];
      if (loaded) return loaded;

      var pkg, imports = {};

      try { // Try to load a system module first
        pkg = require(definitions[name])
      } catch (e) {
        try { // Try to load an NPM module
          pkg = require(path.join(base, 'node_modules', definitions[name]));
        } catch (er) { // Try to load the module through the base directory
          try {
            pkg = require(path.join(base, definitions[name]));  
          } catch(err){
            return null;
          }
        }
      }

      // If a package is dependent on other packages, it's time to load them.
      if (pkg.hasOwnProperty('needs') && pkg.needs instanceof Array)
        pkg.needs.forEach(function(dependencyName) {
          self.packages[dependencyName] = load(dependencyName);
          imports[dependencyName] = self.packages[dependencyName];
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