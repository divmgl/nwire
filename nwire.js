module.exports = function nwire(config) {
  var Package = function(object, parent) {
    var self = this;

    self.object = object;
    self.parent = parent;

    if (typeof object !== "object" || object instanceof Array) return;
    
    for (var member in object) {
      var package = object[member];

      if (package.fn && package.needs && !package.ignore) {
        var needs = {};

        package.needs.forEach(function(need) {
          Object.defineProperty(needs, need, {
            get: self.resolve.bind(self, need)
          });
        });

        Object.defineProperty(self.object, member, {
          get: package.fn.bind(self, needs)
        });

        continue;
      }

      self.object[member] = new Package(package, self).object;
    }
  }

  Package.prototype.resolve = function(name) {
    return this.object ?
      this.object[name] || Package.prototype.resolve.call(this.parent, name) :
      undefined;
  }

  return new Package(config).object;
}