export type Context = {
  [key: string]: unknown
}

export type Instance<TValue> = {
  new (context: any, ...args: any[]): TValue
}

type Flatten<T> = {} & { [P in keyof T]: T[P] }

type MergeContext<TExisting, TKey extends string, TValue> = Flatten<
  TExisting & {
    [P in TKey]: TValue
  }
>

type RegistrationOptions = {
  transient?: boolean
}

export class Container<TContext extends Context = {}> {
  private _registry: Map<string, unknown>
  private _map: Map<string, (context: TContext) => unknown>
  private _transient: Set<string>

  constructor(private _parentContainer?: Container<TContext>) {
    this._transient = new Set<string>()
    this._registry = new Map<string, unknown>()
    this._map = new Map<string, (context: TContext) => unknown>()
  }

  static build<T extends Context = {}>(): Container<T> {
    return new Container<T>()
  }

  context<TWriteContext extends Context = TContext>(
    rootContext: Context = {}
  ): TWriteContext {
    const handler = {
      get: (target: Context, key: string) => {
        if (rootContext.hasOwnProperty(key)) {
          return rootContext[key]
        } else if (this._registry.has(key)) {
          return this._registry.get(key)
        } else if (this._map.has(key)) {
          const value = this._map.get(key)!
          const instance = value(this.context())

          if (!this._transient.has(key)) this._registry.set(key, instance)

          return instance
        }
        return target[key]
      },
    }

    const proxy = new Proxy<TContext>(
      { ...Object.fromEntries(this._map) } as TContext,
      handler
    )

    return proxy as unknown as TWriteContext
  }

  // Add a subcontext to a property of this context
  group<TNewKey extends string, TNewContext extends Context>(
    key: TNewKey,
    decorator: (container: Container<TContext>) => Container<TNewContext>
  ): Container<MergeContext<TContext, TNewKey, TNewContext>> {
    const nestedContainer = new Container(this._parentContainer ?? this)
    const value = decorator(nestedContainer).context()
    this.register(key, () => value)
    return this as any
  }

  static group<TNewKey extends string, TNewContext extends Context>(
    key: TNewKey,
    decorator: (container: Container<Context>) => Container<TNewContext>
  ): Container<MergeContext<Context, TNewKey, TNewContext>> {
    return Container.build().group(key, decorator) as any
  }

  instance<TNewKey extends string, TValue>(
    key: TNewKey,
    ValueClass: Instance<TValue>,
    ...args: any[]
  ): Container<MergeContext<TContext, TNewKey, TValue>> {
    this._map.set(
      key,
      () => new ValueClass((this._parentContainer ?? this).context(), ...args)
    )
    return this as any
  }

  static instance<TNewKey extends string, TValue>(
    key: TNewKey,
    ValueClass: Instance<TValue>,
    ...args: any[]
  ): Container<MergeContext<Context, TNewKey, TValue>> {
    return Container.build().instance(key, ValueClass, ...args) as any
  }

  register<TNewKey extends string, TValue>(
    key: TNewKey,
    value: (context: TContext) => TValue,
    { transient }: RegistrationOptions = { transient: false }
  ): Container<MergeContext<TContext, TNewKey, TValue>> {
    this._map.set(key, () =>
      value(
        (this._parentContainer ?? this).context() as MergeContext<
          TContext,
          TNewKey,
          TValue
        >
      )
    )

    if (transient) this._transient.add(key)

    return this as any
  }

  static register<TNewKey extends string, TValue>(
    key: TNewKey,
    value: (context: Context) => TValue,
    options?: RegistrationOptions
  ): Container<MergeContext<Context, TNewKey, TValue>> {
    return Container.build().register(key, value, options) as any
  }

  unregister<TNewKey extends string>(
    key: TNewKey
  ): Container<Omit<TContext, TNewKey>> {
    this._map.delete(key)
    this._registry.delete(key)
    this._transient.delete(key)

    return this as any
  }

  static unregister<TNewKey extends string>(
    key: TNewKey
  ): Container<Omit<Context, TNewKey>> {
    return Container.build().unregister(key) as any
  }

  resolve<T>(key: keyof TContext): T {
    return this._map.get(key as string)?.(this.context()) as unknown as T
  }
}
