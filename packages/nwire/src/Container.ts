import { CountingSet } from "./CountingSet"

export type Context = {
  [key: string]: unknown
}

export type Instance<TValue> = {
  new (context: any, ...args: any[]): TValue
}

type Flatten<T> = {} & { [P in keyof T]: T[P] }

type AppendContext<TExisting, TKey extends string, TValue> = Flatten<
  TExisting & {
    [P in TKey]: TValue
  }
>

type RegistrationOptions = {
  /**
   * Turn on to resolve the factory and get a new value every single time.
   *
   * @example
   * class RandomizerDependency {
   *   constructor(public id = Math.floor(Math.random() * 1000)) {}
   * }
   *
   * const context = Container.new()
   *   .register("randomizer", () => new RandomizerDependency(), { transient: true })
   *   .context()
   *
   * console.log(context.randomizer.id) // => 123
   * console.log(context.randomizer.id) // => 456
   * console.log(context.randomizer.id) // => 789
   */
  transient?: boolean
}
/**
 * The `Container` is the core of nwire. It is responsible for registering and resolving dependencies.
 *
 * [**Container** API docs](https://github.com/divmgl/nwire/blob/master/packages/nwire/README.md#container).
 *
 * @example
 * ```ts
 * import { Container } from "nwire"
 *
 * // Create a new container
 * const container = Container.new()
 *
 * // Register a dependency
 * container.register("banner", () => "Hello world!")
 *
 * // Resolve a dependency
 * const banner = container.resolve("banner")
 * ```
 */
export class Container<TContext extends Context = {}> {
  private _registry: Map<string, unknown> = new Map<string, unknown>()
  private _resolvers: Map<string, (context: TContext) => unknown> = new Map<
    string,
    (context: TContext) => unknown
  >()
  private _cache: Map<(context: TContext) => unknown, unknown> = new Map()
  private _transient: Set<string> = new Set<string>()
  private _base: Record<string, unknown> = {}
  private _rootContainer: Container | this
  private _parentContainer: Container | this

  /**
   * Creates a new `Container`.
   *
   * @deprecated Use `Container.new()` instead.
   * @hideconstructor
   * @param rootContainer The root container. You'll never need to set this manually.
   * @param parentContainer The parent container. You'll never need to set this manually.
   */
  constructor(rootContainer?: Container, parentContainer?: Container) {
    this._rootContainer = rootContainer ?? this
    this._parentContainer = parentContainer ?? this._rootContainer
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
    return this._rootContainer
  }

  /**
   * Populated with the parent container of a group container. You'll likely never need this.
   */
  protected get parent() {
    return this._parentContainer
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
  static new<T extends Context = {}>(): Container<T> {
    return new Container<T>()
  }

  /**
   * Alias for `Container.new()`.
   *
   * @deprecated Use `Container.new()` instead
   */
  static build<T extends Context = {}>() {
    return Container.new<T>()
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
  base<TBase extends Context>(base: TBase): Container<TContext & TBase> {
    this._base = base
    return this as any
  }

  private createContextProxy() {
    const cache: Record<string, unknown> = {}
    const resolving = new CountingSet<unknown>()

    const handler = {
      get: (target: TContext, key: string) => {
        if (cache.hasOwnProperty(key)) return cache[key]
        if (target.hasOwnProperty(key)) return target[key]

        return resolve(key)
      },
      set: (_target: Context, key: string, value: unknown) => {
        cache[key] = value
        return true
      },
    }

    const proxy = new Proxy({}, handler)

    const resolve = <TValue>(key: keyof TContext) => {
      const resolver = this._resolvers.get(key as string)!

      if (this._registry.has(key as string)) {
        resolving.delete(resolver)
        return this._registry.get(key as string) as unknown as TValue
      }

      if (resolving.count(resolver) > 1) {
        resolving.delete(resolver)
        return this._cache.get(resolver) as unknown as TValue
      }

      const value = resolver?.(
        this._rootContainer.context() as unknown as TContext
      ) as unknown as TValue

      resolving.delete(resolver)

      if (this._transient.has(key as string)) return value

      if (value) {
        this._registry.set(key as string, value)
        this._cache.set(resolver, value)
      } else {
        this.unregister(key as string)
      }

      return value
    }

    return proxy
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
  context<
    TWriteContext extends Context = TContext,
    TOverride extends Context = {}
  >(override: TOverride | {} = {}): Flatten<TWriteContext & TOverride> {
    // Get all of the keys for the resolvers in this container
    const keys = Array.from(this._resolvers.keys())

    const proxy = this.createContextProxy()

    const context = keys.reduce(
      (acc, key) => {
        Object.defineProperty(acc, key, {
          get: () => {
            return proxy[key as keyof typeof proxy]
          },
          enumerable: true,
        })

        return acc
      },
      { ...this._base } as Flatten<TWriteContext & TOverride>
    )

    return Object.assign(context, override)
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
  group<TNewKey extends string, TNewContext extends Context>(
    key: TNewKey,
    decorator: (container: Container<{}>) => Container<TNewContext>
  ) {
    // Create a new container for the group on every resolution and set this container as the parent.
    this.register(key, () => {
      const groupContainer = // @ts-expect-error
        decorator(new Container(this._rootContainer, this))
      const groupContext = groupContainer.context()

      const grouping = Array.from(groupContainer._resolvers.keys()).reduce(
        (acc, key) => {
          return Object.assign(acc, {
            get [key]() {
              return groupContext[key]
            },
          })
        },
        {} as TNewContext
      )

      this._registry.set(key as string, grouping)

      return groupContainer.context()
    })

    return this as Container<TContext & { [key in TNewKey]: TNewContext }>
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
  singleton<TNewKey extends string, TValue>(
    key: TNewKey,
    ClassConstructor: Instance<TValue>,
    ...args: any[]
  ) {
    return this.register(
      key,
      (context) => new ClassConstructor(context, ...args)
    )
  }

  /**
   * Alias for `Container.singleton()`.
   *
   * @deprecated Use `Container.singleton()` instead.
   */
  instance<TNewKey extends string, TValue>(
    key: TNewKey,
    ClassConstructor: Instance<TValue>,
    ...args: any[]
  ) {
    return this.singleton(key, ClassConstructor, ...args)
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
  register<TNewKey extends string, TValue>(
    key: TNewKey,
    factory: (context: TContext) => TValue,
    { transient }: RegistrationOptions = { transient: false }
  ): Container<AppendContext<TContext, TNewKey, TValue>> {
    if (transient) this._transient.add(key)
    this._resolvers.set(key, factory)
    return this as any
  }

  /**
   * Removes a dependency from the container on a given key.
   *
   * @param key key to unregister the dependency on
   */
  unregister<TNewKey extends string>(
    key: TNewKey
  ): Container<Omit<TContext, TNewKey>> {
    this._resolvers.delete(key)
    this._registry.delete(key)
    this._transient.delete(key)

    return this as any
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
  resolve<TValue>(key: keyof TContext): TValue {
    const resolver = this._resolvers.get(key as string)
    if (!resolver) throw new Error(`dependency ${String(key)} not registered`)
    return resolver(this._rootContainer.context() as TContext) as TValue
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
  pipe<TNewContext extends Context>(
    pipe: (container: Container<TContext>) => Container<TNewContext>
  ) {
    return pipe(this)
  }
}
