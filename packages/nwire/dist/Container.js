"use strict";
export class Container {
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
    return new Container();
  }
  context(rootContext = {}) {
    const handler = {
      get: (target, key) => {
        if (rootContext.hasOwnProperty(key)) {
          return rootContext[key];
        } else if (this._registry.has(key)) {
          return this._registry.get(key);
        } else if (this._map.has(key)) {
          const value = this._map.get(key);
          const instance = value(this.context());
          if (!this._transient.has(key))
            this._registry.set(key, instance);
          return instance;
        }
        return target[key];
      }
    };
    const proxy = new Proxy(
      { ...Object.fromEntries(this._map) },
      handler
    );
    return proxy;
  }
  // Add a subcontext to a property of this context
  group(key, decorator) {
    const nestedContainer = new Container(this._parentContainer ?? this);
    const value = decorator(nestedContainer).context();
    this.register(key, () => value);
    return this;
  }
  static group(key, decorator) {
    return Container.build().group(key, decorator);
  }
  instance(key, ValueClass, ...args) {
    this._map.set(
      key,
      () => new ValueClass((this._parentContainer ?? this).context(), ...args)
    );
    return this;
  }
  static instance(key, ValueClass, ...args) {
    return Container.build().instance(key, ValueClass, ...args);
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
    return Container.build().register(key, value, options);
  }
  unregister(key) {
    this._map.delete(key);
    this._registry.delete(key);
    this._transient.delete(key);
    return this;
  }
  static unregister(key) {
    return Container.build().unregister(key);
  }
  resolve(key) {
    return this._map.get(key)?.(this.context());
  }
}
