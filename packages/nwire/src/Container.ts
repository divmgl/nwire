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
  private _registry: Map<string, unknown> = new Map<string, unknown>()
  private _resolvers: Map<
    string,
    (context: TContext, resolved: Set<unknown>) => unknown
  > = new Map<string, (context: TContext) => unknown>()
  private _transient: Set<string> = new Set<string>()
  private _registeredDecorators: Set<unknown> = new Set<unknown>()
  private _decoratorMap: Map<unknown, unknown> = new Map<unknown, unknown>()

  constructor(private _parentContainer?: Container<TContext>) {}

  static build<T extends Context = {}>(): Container<T> {
    return new Container<T>()
  }

  copy<TContext>(rootContext: Context = {}): TContext {
    // Get all of the keys in the map
    const keys = Array.from(this._resolvers.keys())

    // Create an object that either has the value from the root context, the value from the registry
    // or gets the value from the map's generator.
    const context = keys.reduce((acc: Record<string, unknown>, key) => {
      if (rootContext.hasOwnProperty(key)) {
        acc[key] = rootContext[key]
      } else if (this._registry.has(key)) {
        acc[key] = this._registry.get(key)
      } else {
        acc[key] = this._resolvers.get(key)!(this.context(), new Set())
      }

      return acc
    }, {}) as TContext

    return {
      ...rootContext,
      ...(handleCircularReferences(
        context as unknown as Serializable
      ) as TContext),
    }
  }

  context<TWriteContext extends Context = TContext>(
    rootContext: Context = {},
    resolved: Set<unknown> = new Set<unknown>()
  ): TWriteContext {
    const cache: Record<string, unknown> = {}
    // console.log({ start: resolving })

    const handler = {
      get: (target: TContext, key: string) => {
        if (cache.hasOwnProperty(key)) return cache[key]
        if (target.hasOwnProperty(key)) return target[key]
        if (this._registry.has(key)) return this._registry.get(key)
        if (!this._resolvers.has(key)) return target[key]

        const resolver = this._resolvers.get(key)!
        const instance = resolver(target, resolved.add(resolver))

        return instance
      },
      set: (_target: Context, key: string, value: unknown) => {
        cache[key] = value
        return true
      },
    }

    const proxy = new Proxy<TContext>(rootContext as TContext, handler)

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
    this.register(key, (context) => new ValueClass(context, ...args))
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
    resolver: (context: TContext, resolvedSet: Set<unknown>) => TValue,
    { transient }: RegistrationOptions = { transient: false }
  ): Container<MergeContext<TContext, TNewKey, TValue>> {
    if (transient) this._transient.add(key)

    this._resolvers.set(key, (_context, resolvedSet = new Set<unknown>()) => {
      // Check if the key is already in the registry. If it is, return it.
      if (this._registry.has(key)) return this._registry.get(key)

      if (resolvedSet.has(resolver)) return

      const effectiveContainer = this._parentContainer ?? this
      const value = resolver(
        effectiveContainer.context(
          undefined,
          resolvedSet.add(resolver)
        ) as MergeContext<TContext, TNewKey, TValue>,
        // new Set()
        resolvedSet.add(resolver)
      )

      resolvedSet.delete(resolver)

      if (!this._transient.has(key)) this._registry.set(key, value)

      return value
    })

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
    this._resolvers.delete(key)

    const value = this._registry.get(key)
    if (value) {
      const ValueClass = this._decoratorMap.get(value)

      this._registeredDecorators.delete(ValueClass)
      this._registry.delete(key)
    }

    this._transient.delete(key)

    return this as any
  }

  static unregister<TNewKey extends string>(
    key: TNewKey
  ): Container<Omit<Context, TNewKey>> {
    return Container.build().unregister(key) as any
  }

  resolve<T>(key: keyof TContext): T {
    return this._resolvers.get(key as string)?.(
      this.context(),
      new Set()
    ) as unknown as T
  }
}

type Serializable =
  | null
  | string
  | number
  | boolean
  | undefined
  | { [key: string]: Serializable }
  | Serializable[]

function handleCircularReferences(
  obj: Serializable,
  path: Serializable[] = []
): Serializable {
  if (obj === null) return null
  if (typeof obj !== "object") return obj

  const occurrence = path.filter((p) => p === obj).length

  // If this object appears more than once in the current path, it's a circular reference.
  if (occurrence > 1) {
    return undefined
  }

  path.push(obj)

  console.log(path)

  let result: Serializable
  if (Array.isArray(obj)) {
    result = obj.map((item) =>
      handleCircularReferences(item, path.slice())
    ) as Serializable[]
  } else {
    result = {}
    for (let key in obj) {
      ;(result as any)[key] = handleCircularReferences(
        (obj as any)[key],
        path.slice()
      )
    }
  }

  path.pop()

  return result
}
