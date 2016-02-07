module.exports = function nwire(config, callback) {
  var container = {};

  var Package = function(object, parent) {
    var self = this;

    this.object = object;
    this.parent = parent;

    if (typeof object !== "object") return;
    if (object instanceof Array) return;
    if (object.ignore) return;

    if (object.fn && object.needs) {
      var needs = {};

      object.needs.forEach(function(need) {
        needs[need] = Package.prototype.resolve.call(parent, need);
      });

      this.object = object.fn(needs);
      return;
    }

    for (var member in object) {
      object[member] = new Package(object[member], self).object;
    }
  }

  Package.prototype.resolve = function(name) {
    if (!this.object) return undefined;
    return this.object[name] || Package.prototype.resolve.call(this.parent, name);
  }

  try {
    container = new Package(config).object;
    callback(null, container);
  } catch (err) {
    callback(err, null);
  }
}