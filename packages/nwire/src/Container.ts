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
  transient?: boolean
}

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

  constructor(rootContainer?: Container, _parentContainer?: Container) {
    this._rootContainer = rootContainer ?? this
    this._parentContainer = _parentContainer ?? this._rootContainer
  }

  get root() {
    return this._rootContainer
  }

  get parent() {
    return this._parentContainer
  }

  static new<T extends Context = {}>(): Container<T> {
    return new Container<T>()
  }

  static build<T extends Context = {}>() {
    return Container.new<T>()
  }

  base<TBase extends Context>(base: TBase): Container<TContext & TBase> {
    this._base = base
    return this as any
  }

  createContextProxy() {
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
      if (this._base?.[key as string])
        return this._base[key as string] as TValue

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

      if (!this._transient.has(key as string)) {
        this._registry.set(key as string, value)
        this._parentContainer._registry.set(key as string, value)
        this._cache.set(resolver, value)
      }

      return value
    }

    return proxy
  }

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

  // Add a subcontext to a property of this context
  group<TNewKey extends string, TNewContext extends Context>(
    key: TNewKey,
    decorator: (container: Container<{}>) => Container<TNewContext>
  ) {
    // @ts-expect-error
    // Create a new container for the group and set this container as the parent.
    const groupContainer = decorator(new Container(this._rootContainer, this))

    const groupContext = groupContainer.context()
    this.register(key, () => groupContext)

    const grouping = Array.from(groupContainer._resolvers.keys()).reduce(
      (acc, key) => {
        return {
          ...acc,
          get [key]() {
            return groupContext[key]
          },
        }
      },
      {} as TNewContext
    )

    this._registry.set(key as string, grouping)

    return this as Container<TContext & { [key in TNewKey]: TNewContext }>
  }

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

  instance<TNewKey extends string, TValue>(
    key: TNewKey,
    ClassConstructor: Instance<TValue>,
    ...args: any[]
  ) {
    return this.singleton(key, ClassConstructor, ...args)
  }

  register<TNewKey extends string, TValue>(
    key: TNewKey,
    resolver: (context: TContext) => TValue,
    { transient }: RegistrationOptions = { transient: false }
  ): Container<AppendContext<TContext, TNewKey, TValue>> {
    if (transient) this._transient.add(key)
    this._resolvers.set(key, resolver)
    return this as any
  }

  unregister<TNewKey extends string>(
    key: TNewKey
  ): Container<Omit<TContext, TNewKey>> {
    this._resolvers.delete(key)
    this._registry.delete(key)
    this._transient.delete(key)

    return this as any
  }

  resolve<TValue>(key: keyof TContext): TValue {
    const resolver = this._resolvers.get(key as string)
    if (!resolver) throw new Error(`dependency ${String(key)} not registered`)
    return resolver(this._rootContainer.context() as TContext) as TValue
  }

  middleware<TNewContext extends Context>(
    middleware: (container: Container<TContext>) => Container<TNewContext>
  ) {
    return middleware(this)
  }
}
