export declare class CountingSet<T> {
    private readonly _map;
    private readonly _set;
    add(value: T): this;
    delete(value: T): boolean;
    has(value: T): boolean;
    count(value: T): number;
    clear(): void;
    get size(): number;
    [Symbol.iterator](): Iterator<T>;
    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void;
}
