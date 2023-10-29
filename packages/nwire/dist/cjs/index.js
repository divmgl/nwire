"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Container: () => Container,
  Singleton: () => Singleton,
  WithContextProperties: () => WithContextProperties
});
module.exports = __toCommonJS(src_exports);

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
  _registry = /* @__PURE__ */ new Map();
  _resolvers = /* @__PURE__ */ new Map();
  _cache = /* @__PURE__ */ new Map();
  _transient = /* @__PURE__ */ new Set();
  _base = {};
  _rootContainer;
  _parentContainer;
  constructor(rootContainer, _parentContainer) {
    this._rootContainer = rootContainer ?? this;
    this._parentContainer = _parentContainer ?? this._rootContainer;
  }
  get root() {
    return this._rootContainer;
  }
  get parent() {
    return this._parentContainer;
  }
  static new() {
    return new _Container();
  }
  static build() {
    return _Container.new();
  }
  base(base) {
    this._base = base;
    return this;
  }
  createContextProxy() {
    const cache = {};
    const resolving = new CountingSet();
    const handler = {
      get: (target, key) => {
        if (cache.hasOwnProperty(key))
          return cache[key];
        if (target.hasOwnProperty(key))
          return target[key];
        return resolve(key);
      },
      set: (_target, key, value) => {
        cache[key] = value;
        return true;
      }
    };
    const proxy = new Proxy({}, handler);
    const resolve = (key) => {
      var _a;
      if ((_a = this._base) == null ? void 0 : _a[key])
        return this._base[key];
      const resolver = this._resolvers.get(key);
      if (this._registry.has(key)) {
        resolving.delete(resolver);
        return this._registry.get(key);
      }
      if (resolving.count(resolver) > 1) {
        resolving.delete(resolver);
        return this._cache.get(resolver);
      }
      const value = resolver == null ? void 0 : resolver(
        this._rootContainer.context()
      );
      resolving.delete(resolver);
      if (!this._transient.has(key)) {
        this._registry.set(key, value);
        this._parentContainer._registry.set(key, value);
        this._cache.set(resolver, value);
      }
      return value;
    };
    return proxy;
  }
  context(override = {}) {
    const keys = Array.from(this._resolvers.keys());
    const proxy = this.createContextProxy();
    const context = keys.reduce(
      (acc, key) => {
        Object.defineProperty(acc, key, {
          get: () => {
            return proxy[key];
          },
          enumerable: true
        });
        return acc;
      },
      { ...this._base }
    );
    return Object.assign(context, override);
  }
  // Add a subcontext to a property of this context
  group(key, decorator) {
    const groupContainer = decorator(new _Container(this._rootContainer, this));
    const groupContext = groupContainer.context();
    this.register(key, () => groupContext);
    const grouping = Array.from(groupContainer._resolvers.keys()).reduce(
      (acc, key2) => {
        return {
          ...acc,
          get [key2]() {
            return groupContext[key2];
          }
        };
      },
      {}
    );
    this._registry.set(key, grouping);
    return this;
  }
  singleton(key, ClassConstructor, ...args) {
    return this.register(
      key,
      (context) => new ClassConstructor(context, ...args)
    );
  }
  instance(key, ClassConstructor, ...args) {
    return this.singleton(key, ClassConstructor, ...args);
  }
  register(key, resolver, { transient } = { transient: false }) {
    if (transient)
      this._transient.add(key);
    this._resolvers.set(key, resolver);
    return this;
  }
  unregister(key) {
    this._resolvers.delete(key);
    this._registry.delete(key);
    this._transient.delete(key);
    return this;
  }
  resolve(key) {
    const resolver = this._resolvers.get(key);
    if (!resolver)
      throw new Error(`dependency ${String(key)} not registered`);
    return resolver(this._rootContainer.context());
  }
  middleware(middleware) {
    return middleware(this);
  }
};

// src/Singleton.ts
function WithContextProperties(Base) {
  return class extends Base {
    constructor(context) {
      super(context);
      for (const key in context) {
        Object.defineProperty(this, key, {
          get: function() {
            return context[key];
          },
          enumerable: true
        });
      }
    }
  };
}
var Singleton = class {
  _context;
  constructor(context) {
    this._context = context;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Container,
  Singleton,
  WithContextProperties
});
//# sourceMappingURL=index.js.map
