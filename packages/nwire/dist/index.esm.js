// src/Container.ts
var Container = class _Container {
  _map;
  constructor() {
    this._map = /* @__PURE__ */ new Map();
  }
  static build() {
    return new _Container();
  }
  context(rootContext = {}) {
    const handler = {
      get: (target, prop) => {
        if (this._map.has(prop))
          return this._map.get(prop);
        return target[prop];
      }
    };
    const proxy = new Proxy(
      { ...rootContext, ...Object.fromEntries(this._map) },
      handler
    );
    return proxy;
  }
  // Add a subcontext to a property of this context
  group(key, decorator) {
    this._map.set(key, this.context(decorator(this).context()));
    return this;
  }
  static group(key, decorator) {
    return _Container.build().group(key, decorator);
  }
  singleton(key, ValueClass, ...args) {
    this._map.set(key, new ValueClass(this.context(), ...args));
    return this;
  }
  static singleton(key, ValueClass, ...args) {
    return _Container.build().singleton(key, ValueClass, ...args);
  }
  register(key, value) {
    this._map.set(key, value);
    return this;
  }
  static register(key, value) {
    return _Container.build().register(key, value);
  }
  unregister(key) {
    this._map.delete(key);
    return this;
  }
  static unregister(key) {
    return _Container.build().unregister(key);
  }
  resolve(key) {
    return this._map.get(key);
  }
};
export {
  Container
};
