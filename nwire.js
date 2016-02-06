module.exports = function(config, callback) {
  var $ = config || {}; // Composite root

  if (typeof callback !== "function")
    throw new Error("Please provide a callback function.")

  var Declaration = function(root, parent) {
    this.root = root;
    this.parent = parent;
  }

  Declaration.prototype.resolve = function(name) {
    var self = this;
    var decl = self.root[name];

    // Return the object found if contract implementation is not met
    if (!decl || decl.ignore) return self.root;

    if (!decl.fn || !decl.needs || typeof decl.fn !== "function"
        || !(decl.needs instanceof Array))
    {
      if (typeof decl === 'object' && !(decl instanceof Array))
        for (var member in decl) {
          var declaration = new Declaration(decl, self);
          self.root[name] = declaration.resolve(member);
        }

      return self.root;
    }

    var needs = {};

    decl.needs.forEach(function(need) {
      Object.defineProperty(needs, need, {
        get: function() {
          var parent = self.parent || { root: {} };
          return self.root[need] || parent.root[need];
        }
      });
    });

    if (!decl.construct) self.root[name] = self.root[name].fn(needs);
    else Object.defineProperty(self.root, name, {
      get: function() {
        return new decl.fn(needs);
      }
    });

    return self.root;
  }

  try {
    var member, declaration;

    for(member in $) {
      declaration = new Declaration($);
      $ = declaration.resolve(member);
    }

    callback(null, $);
  } catch (err) {
    callback(err, null);
  }
};

