import { Context } from "./Container"

type PopulatedSingleton<T> = T & { [key in keyof T]: T[key] }

// Mixin to add context-based properties to a class
export function WithContextProperties<T extends Context>(
  Base: any
): new (context: T) => PopulatedSingleton<T> {
  return class extends Base {
    constructor(context: T) {
      super(context)

      for (const key in context) {
        Object.defineProperty(this, key, {
          get: function () {
            return context[key]
          },
          enumerable: true,
        })
      }
    }
  } as new (context: T) => PopulatedSingleton<T>
}

export class Singleton<TContext extends Context> {
  protected _context: TContext

  constructor(context: TContext) {
    this._context = context
  }
}
