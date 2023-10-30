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
  /**
   * Creates a new `Container`.
   *
   * @deprecated Use `Container.new()` instead.
   * @hideconstructor
   * @param rootContainer The root container. You'll never need to set this manually.
   * @param parentContainer The parent container. You'll never need to set this manually.
   */
  constructor(rootContainer, parentContainer) {
    this._rootContainer = rootContainer ?? this;
    this._parentContainer = parentContainer ?? this._rootContainer;
  }
  /**
   * The root container. You'll only ever need this if manually registering a dependency inside of a
   * group.
   *
   * [**Container** API docs](https://github.com/divmgl/nwire/blob/master/packages/nwire/README.md#container).
   *
   * @example
   * ```ts
   * import { Container } from "nwire"
   *
   * const container = Container.new()
   *   .group("services", (container) =>
   *     container.register("my", () => new MyService(container.root.context()))
   *   )
   *   .context()
   * ```
   */
  get root() {
    return this._rootContainer;
  }
  /**
   * Populated with the parent container of a group container. You'll likely never need this.
   */
  get parent() {
    return this._parentContainer;
  }
  /**
   * Shorthand for creating a container. Equivalent to `(new Container())`. Useful to start the
   * chain in a fluent API call.
   *
   *
   * @example
   * import { Container } from "nwire"
   *
   * type AppContext = {
   *   // ...
   * }
   *
   * // All future registration factories will be type-safe
   * const container = Container.new<AppContext>()
   *   .register("my", (context) => new MyService(context)) // context is AppContext
   *
   * @returns A new container
   */
  static new() {
    return new _Container();
  }
  /**
   * Alias for `Container.new()`.
   *
   * @deprecated Use `Container.new()` instead
   */
  static build() {
    return _Container.new();
  }
  /**
   * Adds a base to your context.
   *
   * Useful when there's expensive dependencies you'd rather create ahead of time. The proxy will always use the registered base as a fallback when keys are not found.
   *
   * *(Introduced in 1.1.2)*
   *
   * @param base The base to add to your context
   *
   * @example
   * import { Container } from "nwire"
   *
   * const context = Container.new()
   *   .base({ db: new Database() })
   *   .register("my", (context) => new MyService(context))
   *   .context()
   *
   * expect(context.db).toEqual(context.db)
   */
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
      if (this._transient.has(key))
        return value;
      if (value) {
        this._registry.set(key, value);
        this._cache.set(resolver, value);
      } else {
        this.unregister(key);
      }
      return value;
    };
    return proxy;
  }
  /**
   * Generates a `Context` object from the registered dependencies.
   *
   * [**Context** API docs](https://github.com/divmgl/nwire/blob/master/packages/nwire/README.md#context).
   *
   * @param override (optional) An object to override the context with. The override will always take precedence over registrations during resolution. Useful for testing.
   *
   * @example
   * import { Container } from "nwire"
   *
   * const context = Container.new()
   *   .register("banner", () => "Hello world!")
   *   .context()
   *
   * // Type of `context`
   * const context = {
   *   banner: string
   * }
   *
   */
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
  /**
   * Add a group of dependencies to your container on a given key.
   *
   * A nested `Container` is created with its context automatically resolved during resolution.
   *
   * @param key The key to register the group on
   * @param decorator A function that receives a new `Container` and returns a decorated `Container`
   *
   * @example
   * import { Container } from "nwire"
   *
   * const context = Container.new()
   *   .group("services", (services) => services.singleton("my", MyService))
   *   .context()
   *
   * // Type of `context`
   * const context = {
   *   services: {
   *     my: MyService
   *   }
   * }
   */
  group(key, decorator) {
    this.register(key, () => {
      const groupContainer = (
        // @ts-expect-error
        decorator(new _Container(this._rootContainer, this))
      );
      const groupContext = groupContainer.context();
      const grouping = Array.from(groupContainer._resolvers.keys()).reduce(
        (acc, key2) => {
          return Object.assign(acc, {
            get [key2]() {
              return groupContext[key2];
            }
          });
        },
        {}
      );
      this._registry.set(key, grouping);
      return groupContainer.context();
    });
    return this;
  }
  /**
   * Registers a `Class` to be used as a factory to create a singleton.
   *
   * @param key The key to register the dependency on
   * @param ClassConstructor The class constructor to use when resolving the singleton
   * @param args Any additional arguments after the `Context` to pass to the class constructor
   *
   * @example
   * import { Container } from "nwire"
   *
   * class MyService extends Service<AppContext>() {
   *   constructor(context: AppContext) {
   *     // ...
   *   }
   *
   *   helloWorld() {
   *     return this.banner
   *   }
   * }
   *
   * const context = Container.new()
   *   .register("banner", () => "Hello world!")
   *   .singleton("my", MyService)
   *
   * // Usage
   * context.my.helloWorld() // => "Hello world!"
   */
  singleton(key, ClassConstructor, ...args) {
    return this.register(
      key,
      (context) => new ClassConstructor(context, ...args)
    );
  }
  /**
   * Alias for `Container.singleton()`.
   *
   * @deprecated Use `Container.singleton()` instead.
   */
  instance(key, ClassConstructor, ...args) {
    return this.singleton(key, ClassConstructor, ...args);
  }
  /**
   * Registers a factory to use when resolving a dependency under a given key.
   *
   * `Container.prototype.group` and `Container.prototype.singleton` use this under the hood.
   *
   * @param key key to register the dependency on
   * @param factory The factory that creates the dependency. Used during lazy resolution.
   * @returns
   */
  register(key, factory, { transient } = { transient: false }) {
    if (transient)
      this._transient.add(key);
    this._resolvers.set(key, factory);
    return this;
  }
  /**
   * Removes a dependency from the container on a given key.
   *
   * @param key key to unregister the dependency on
   */
  unregister(key) {
    this._resolvers.delete(key);
    this._registry.delete(key);
    this._transient.delete(key);
    return this;
  }
  /**
   * Manually resolve a dependency on a given key.
   *
   * There aren't many use cases for invoking this method manually. It is used internally by the proxy created by `Container.prototype.context`.
   *
   * @param key key to resolve the dependency on
   *
   * @example
   * import { Container } from "nwire"
   *
   * const container = Container.new()
   *   .register("banner", () => "Hello world!")
   *   .context()
   *
   * container.resolve("banner") // => "Hello world!"
   */
  resolve(key) {
    const resolver = this._resolvers.get(key);
    if (!resolver)
      throw new Error(`dependency ${String(key)} not registered`);
    return resolver(this._rootContainer.context());
  }
  /**
   * Send your container through a decorator function and capture the result. Useful when you want to create a decorator function that can be used in multiple places or more than once.
   *
   * @param pipe A function that receives a new `Container` and returns a decorated `Container`
   *
   * @example
   * import { Container } from "nwire"
   *
   * function registerMap(name: string, map: Record<string, unknown>) {
   *   return (container: Container) => {
   *     return container.register(name, () => map)
   *   }
   * }
   *
   * let container = Container.new()
   *
   * for (const customerId of customerIds) {
   *   container = container.pipe(
   *     registerMap(`banner-${customerId}`, { banner: "Hello world!" })})
   *   )
   * }
   *
   * // Type of `context`
   * let context = {
   *   ["banner-123"]: string
   *   ["banner-456"]: string
   *   ["banner-789"]: string
   * }
   */
  pipe(pipe) {
    return pipe(this);
  }
};

// src/Singleton.ts
function Service(Base = Singleton) {
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
export {
  Container,
  Service,
  Singleton
};
//# sourceMappingURL=index.js.map
