type Context = {
  [key: string]: unknown
}

export type Singleton<TValue> = {
  new (context: any, ...args: any[]): TValue
}

type Flatten<T> = {} & { [P in keyof T]: T[P] }

type MergeContext<TExisting, TKey extends string, TValue> = Flatten<
  TExisting & {
    [P in TKey]: TValue
  }
>

export class Container<TContext extends Context = {}> {
  private _map: Map<string, unknown>

  constructor() {
    this._map = new Map<string, unknown>()
  }

  static build<TContext extends Context = {}>() {
    return new Container<TContext>()
  }

  context(rootContext = {}): TContext {
    const handler = {
      get: (target: Context, prop: string) => {
        if (this._map.has(prop)) return this._map.get(prop)
        return target[prop]
      },
    }

    const proxy = new Proxy<TContext>(
      { ...rootContext, ...Object.fromEntries(this._map) } as TContext,
      handler
    )

    return proxy as TContext
  }

  // Add a subcontext to a property of this context
  group<TNewKey extends string, TNewContext extends Context>(
    key: TNewKey,
    decorator: (container: Container<TContext>) => Container<TNewContext>
  ): Container<MergeContext<Context, TNewKey, TNewContext>> {
    this._map.set(key, this.context(decorator(this).context()))
    return this as any
  }

  static group<TNewKey extends string, TNewContext extends Context>(
    key: TNewKey,
    decorator: (container: Container<Context>) => Container<TNewContext>
  ): Container<MergeContext<Context, TNewKey, TNewContext>> {
    return Container.build().group(key, decorator) as any
  }

  singleton<TNewKey extends string, TValue>(
    key: TNewKey,
    ValueClass: Singleton<TValue>,
    ...args: any[]
  ): Container<MergeContext<TContext, TNewKey, TValue>> {
    this._map.set(key, new ValueClass(this.context(), ...args))
    return this as any
  }

  static singleton<TNewKey extends string, TValue>(
    key: TNewKey,
    ValueClass: Singleton<TValue>,
    ...args: any[]
  ): Container<MergeContext<Context, TNewKey, TValue>> {
    return Container.build().singleton(key, ValueClass, ...args) as any
  }

  register<TNewKey extends string, TValue>(
    key: TNewKey,
    value: TValue
  ): Container<MergeContext<TContext, TNewKey, TValue>> {
    this._map.set(key, value)
    return this as any
  }

  static register<TNewKey extends string, TValue>(
    key: TNewKey,
    value: TValue
  ): Container<MergeContext<Context, TNewKey, TValue>> {
    return Container.build().register(key, value) as any
  }

  unregister<TNewKey extends string>(
    key: TNewKey
  ): Container<Omit<TContext, TNewKey>> {
    this._map.delete(key)
    return this as any
  }

  static unregister<TNewKey extends string>(
    key: TNewKey
  ): Container<Omit<Context, TNewKey>> {
    return Container.build().unregister(key) as any
  }

  resolve<T>(key: keyof TContext): T {
    return this._map.get(key as string) as unknown as T
  }
}
