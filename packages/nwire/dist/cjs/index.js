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
  Injected: () => Injected
});
module.exports = __toCommonJS(src_exports);

// src/Container.ts
var Container = class _Container {
  constructor(_parentContainer) {
    this._parentContainer = _parentContainer;
    this._transient = /* @__PURE__ */ new Set();
    this._registry = /* @__PURE__ */ new Map();
    this._map = /* @__PURE__ */ new Map();
  }
  _registry;
  _map;
  _transient;
  static build() {
    return new _Container();
  }
  copy(rootContext = {}) {
    const keys = Array.from(this._map.keys());
    const context = keys.reduce((acc, key) => {
      if (rootContext.hasOwnProperty(key)) {
        acc[key] = rootContext[key];
      } else if (this._registry.has(key)) {
        acc[key] = this._registry.get(key);
      } else {
        acc[key] = this._map.get(key)(this.context());
      }
      return acc;
    }, {});
    return {
      ...rootContext,
      ...handleCircularReferences(
        context
      )
    };
  }
  context(rootContext = {}, resolving = /* @__PURE__ */ new Set()) {
    const cache = {};
    const handler = {
      get: (target, key) => {
        const generator = this._map.get(key);
        if (resolving.has(generator))
          return void 0;
        if (cache.hasOwnProperty(key))
          return cache[key];
        if (rootContext.hasOwnProperty(key))
          return rootContext[key];
        if (!this._map.has(key))
          return target[key];
        if (this._registry.has(key))
          return this._registry.get(key);
        resolving.add(generator);
        const instance = generator(this.context(rootContext, resolving));
        resolving.delete(generator);
        if (!this._transient.has(key))
          this._registry.set(key, instance);
        return instance;
      },
      set: (target, key, value) => {
        cache[key] = value;
        return true;
      }
    };
    const proxy = new Proxy({}, handler);
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
  instance(key, ValueClass, ...args) {
    this._map.set(
      key,
      () => new ValueClass((this._parentContainer ?? this).context(), ...args)
    );
    return this;
  }
  static instance(key, ValueClass, ...args) {
    return _Container.build().instance(key, ValueClass, ...args);
  }
  register(key, value, { transient } = { transient: false }) {
    this._map.set(
      key,
      () => value(
        (this._parentContainer ?? this).context()
      )
    );
    if (transient)
      this._transient.add(key);
    return this;
  }
  static register(key, value, options) {
    return _Container.build().register(key, value, options);
  }
  unregister(key) {
    this._map.delete(key);
    this._registry.delete(key);
    this._transient.delete(key);
    return this;
  }
  static unregister(key) {
    return _Container.build().unregister(key);
  }
  resolve(key) {
    var _a;
    return (_a = this._map.get(key)) == null ? void 0 : _a(this.context());
  }
};
function handleCircularReferences(obj, path = []) {
  if (obj === null)
    return null;
  if (typeof obj !== "object")
    return obj;
  const occurrence = path.filter((p) => p === obj).length;
  if (occurrence > 1) {
    return void 0;
  }
  path.push(obj);
  let result;
  if (Array.isArray(obj)) {
    result = obj.map(
      (item) => handleCircularReferences(item, path.slice())
    );
  } else {
    result = {};
    for (let key in obj) {
      ;
      result[key] = handleCircularReferences(
        obj[key],
        path.slice()
      );
    }
  }
  path.pop();
  return result;
}

// src/Injected.ts
var Injected = class {
  constructor(_context) {
    this._context = _context;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Container,
  Injected
});
//# sourceMappingURL=index.js.map
