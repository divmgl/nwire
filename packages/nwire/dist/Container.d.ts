export type Context = {
    [key: string]: unknown;
};
export type Instance<TValue> = {
    new (context: any, ...args: any[]): TValue;
};
type Flatten<T> = {} & {
    [P in keyof T]: T[P];
};
type AppendContext<TExisting, TKey extends string, TValue> = Flatten<TExisting & {
    [P in TKey]: TValue;
}>;
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
    transient?: boolean;
};
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
export declare class Container<TContext extends Context = {}> {
    private _registry;
    private _resolvers;
    private _cache;
    private _transient;
    private _base;
    private _rootContainer;
    private _parentContainer;
    /**
     * Creates a new `Container`.
     *
     * @deprecated Use `Container.new()` instead.
     * @hideconstructor
     * @param rootContainer The root container. You'll never need to set this manually.
     * @param parentContainer The parent container. You'll never need to set this manually.
     */
    constructor(rootContainer?: Container, parentContainer?: Container);
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
    get root(): this | Container<{}>;
    /**
     * Populated with the parent container of a group container. You'll likely never need this.
     */
    protected get parent(): this | Container<{}>;
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
    static new<T extends Context = {}>(): Container<T>;
    /**
     * Alias for `Container.new()`.
     *
     * @deprecated Use `Container.new()` instead
     */
    static build<T extends Context = {}>(): Container<T>;
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
    base<TBase extends Context>(base: TBase): Container<TContext & TBase>;
    private createContextProxy;
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
    context<TWriteContext extends Context = TContext, TOverride extends Context = {}>(override?: TOverride | {}): Flatten<TWriteContext & TOverride>;
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
    group<TNewKey extends string, TNewContext extends Context>(key: TNewKey, decorator: (container: Container<{}>) => Container<TNewContext>): Container<TContext & { [key in TNewKey]: TNewContext; }>;
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
    singleton<TNewKey extends string, TValue>(key: TNewKey, ClassConstructor: Instance<TValue>, ...args: any[]): Container<TContext & { [P_1 in TNewKey]: TValue; } extends infer T ? { [P in keyof T]: (TContext & { [P_1 in TNewKey]: TValue; })[P]; } : never>;
    /**
     * Alias for `Container.singleton()`.
     *
     * @deprecated Use `Container.singleton()` instead.
     */
    instance<TNewKey extends string, TValue>(key: TNewKey, ClassConstructor: Instance<TValue>, ...args: any[]): Container<TContext & { [P_1 in TNewKey]: TValue; } extends infer T ? { [P in keyof T]: (TContext & { [P_1 in TNewKey]: TValue; })[P]; } : never>;
    /**
     * Registers a factory to use when resolving a dependency under a given key.
     *
     * `Container.prototype.group` and `Container.prototype.singleton` use this under the hood.
     *
     * @param key key to register the dependency on
     * @param factory The factory that creates the dependency. Used during lazy resolution.
     * @returns
     */
    register<TNewKey extends string, TValue>(key: TNewKey, factory: (context: TContext) => TValue, { transient }?: RegistrationOptions): Container<AppendContext<TContext, TNewKey, TValue>>;
    /**
     * Removes a dependency from the container on a given key.
     *
     * @param key key to unregister the dependency on
     */
    unregister<TNewKey extends string>(key: TNewKey): Container<Omit<TContext, TNewKey>>;
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
    resolve<TValue>(key: keyof TContext): TValue;
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
    pipe<TNewContext extends Context>(pipe: (container: Container<TContext>) => Container<TNewContext>): Container<TNewContext>;
}
export {};
