var Container = function(config, callback) {
  if (typeof callback !== "function")
    throw new Error("Please provide a callback function.")

  var $ = {}; // Resolved packages
  var decls = config.packages || config;
  if (!decls) return callback(null, $);

  var resolve = function(decl) {
    if ($[decl]) return $[decl];

    var mod = decls[decl];

    if (mod.fn && typeof mod.fn === "function" &&
      mod.needs && mod.needs instanceof Array && !mod.ignore) {
      var needs = {};

      $[decl] = {};

      mod.needs.forEach(function(need) {
        Object.defineProperty(needs, need, {
          get: function() {
            if (!decls[need]) return null;
            return $[need] || resolve(need);
          }
        });
      });

      if (!mod.construct) $[decl] = mod.fn(needs);
      else Object.defineProperty($, decl, {
        get: function() {
          return new mod.fn(needs);
        }
      });
    }

    $[decl] = $[decl] || mod;
    return $[decl];
  }

  try {
    for (var decl in decls) $[decl] = resolve(decl);
    callback(null, $);
  } catch (err) {
    callback(err, null);
  }
}


module.exports = Container;
