// src/CountingSet.ts
var CountingSet = class {
  _map = /* @__PURE__ */ new Map();
  _set = /* @__PURE__ */ new Set();
  add(value) {
    const count = this._map.get(value) || 0;
    this._map.set(value, count + 1);
    this._set.add(value);
    return this;
  }
  delete(value) {
    if (this._map.has(value)) {
      const count = this._map.get(value);
      if (count > 1) {
        this._map.set(value, count - 1);
      } else {
        this._map.delete(value);
        this._set.delete(value);
      }
      return true;
    }
    return false;
  }
  has(value) {
    return this._set.has(value);
  }
  count(value) {
    return this._map.get(value) || 0;
  }
  clear() {
    this._map.clear();
    this._set.clear();
  }
  get size() {
    return this._set.size;
  }
  [Symbol.iterator]() {
    return this._set[Symbol.iterator]();
  }
  forEach(callbackfn, thisArg) {
    this._set.forEach(callbackfn, thisArg);
  }
};

// src/Container.ts
var Container = class _Container {
  constructor(_parentContainer) {
    this._parentContainer = _parentContainer;
  }
  _registry = /* @__PURE__ */ new Map();
  _resolvers = /* @__PURE__ */ new Map();
  _transient = /* @__PURE__ */ new Set();
  static build() {
    return new _Container();
  }
  copy(rootContext = {}) {
    const keys = Array.from(this._resolvers.keys());
    const context = keys.reduce((acc, key) => {
      if (rootContext.hasOwnProperty(key)) {
        acc[key] = rootContext[key];
      } else if (this._registry.has(key)) {
        acc[key] = this._registry.get(key);
      } else {
        acc[key] = this.resolve(key);
      }
      return acc;
    }, {});
    return {
      ...context,
      ...rootContext
    };
  }
  context(rootContext = {}, resolved = new CountingSet()) {
    const cache = {};
    const handler = {
      get: (target, key) => {
        if (cache.hasOwnProperty(key))
          return cache[key];
        if (target.hasOwnProperty(key))
          return target[key];
        return this.resolve(key, resolved);
      },
      set: (_target, key, value) => {
        cache[key] = value;
        return true;
      }
    };
    const proxy = new Proxy(rootContext, handler);
    return proxy;
  }
  // Add a subcontext to a property of this context
  group(key, decorator) {
    const nestedContainer = new _Container(this._parentContainer ?? this);
    const value = decorator(nestedContainer).context();
    this.register(key, () => value);
    return this;
  }
  static group(key, decorator) {
    return _Container.build().group(key, decorator);
  }
  instance(key, ClassConstructor, ...args) {
    this.register(key, (context) => new ClassConstructor(context, ...args));
    return this;
  }
  static instance(key, ClassConstructor, ...args) {
    return _Container.build().instance(key, ClassConstructor, ...args);
  }
  register(key, resolver, { transient } = { transient: false }) {
    if (transient)
      this._transient.add(key);
    this._resolvers.set(key, resolver);
    return this;
  }
  static register(key, value, options) {
    return _Container.build().register(key, value, options);
  }
  unregister(key) {
    this._resolvers.delete(key);
    this._registry.delete(key);
    this._transient.delete(key);
    return this;
  }
  static unregister(key) {
    return _Container.build().unregister(key);
  }
  resolve(key, resolved = new CountingSet()) {
    var _a;
    if (this._registry.has(key)) {
      return this._registry.get(key);
    }
    const resolver = this._resolvers.get(key);
    if (!resolver)
      return void 0;
    if (resolved.count(resolver) > 1)
      return void 0;
    const context = this.context(void 0, resolved.add(resolver));
    const value = resolver(
      ((_a = this._parentContainer) == null ? void 0 : _a.context(void 0, resolved)) ?? context,
      resolved.add(resolver)
    );
    resolved.delete(resolver);
    if (!this._transient.has(key)) {
      this._registry.set(key, value);
    }
    return value;
  }
};

// src/Injected.ts
var Injected = class {
  constructor(_context) {
    this._context = _context;
  }
};
export {
  Container,
  Injected
};
//# sourceMappingURL=index.js.map
