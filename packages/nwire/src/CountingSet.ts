export class CountingSet<T> {
  private readonly _map = new Map<T, number>()
  private readonly _set = new Set<T>()

  add(value: T): this {
    const count = this._map.get(value) || 0
    this._map.set(value, count + 1)
    this._set.add(value)
    return this
  }

  delete(value: T): boolean {
    if (this._map.has(value)) {
      const count = this._map.get(value)!
      if (count > 1) {
        this._map.set(value, count - 1)
      } else {
        this._map.delete(value)
        this._set.delete(value)
      }
      return true
    }
    return false
  }

  has(value: T): boolean {
    return this._set.has(value)
  }

  count(value: T): number {
    return this._map.get(value) || 0
  }

  clear(): void {
    this._map.clear()
    this._set.clear()
  }

  get size(): number {
    return this._set.size
  }

  [Symbol.iterator](): Iterator<T> {
    return this._set[Symbol.iterator]()
  }

  forEach(
    callbackfn: (value: T, value2: T, set: Set<T>) => void,
    thisArg?: any
  ): void {
    this._set.forEach(callbackfn, thisArg)
  }
}
