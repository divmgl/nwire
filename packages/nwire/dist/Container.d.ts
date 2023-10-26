type Context = {
    [key: string]: unknown;
};
export type Singleton<TValue> = {
    new (context: any, ...args: any[]): TValue;
};
type Flatten<T> = {} & {
    [P in keyof T]: T[P];
};
type MergeContext<TExisting, TKey extends string, TValue> = Flatten<TExisting & {
    [P in TKey]: TValue;
}>;
export declare class Container<TContext extends Context = {}> {
    private _map;
    constructor();
    static build<TContext extends Context = {}>(): Container<TContext>;
    context(rootContext?: {}): TContext;
    group<TNewKey extends string, TNewContext extends Context>(key: TNewKey, decorator: (container: Container<TContext>) => Container<TNewContext>): Container<MergeContext<Context, TNewKey, TNewContext>>;
    static group<TNewKey extends string, TNewContext extends Context>(key: TNewKey, decorator: (container: Container<Context>) => Container<TNewContext>): Container<MergeContext<Context, TNewKey, TNewContext>>;
    singleton<TNewKey extends string, TValue>(key: TNewKey, ValueClass: Singleton<TValue>, ...args: any[]): Container<MergeContext<TContext, TNewKey, TValue>>;
    static singleton<TNewKey extends string, TValue>(key: TNewKey, ValueClass: Singleton<TValue>, ...args: any[]): Container<MergeContext<Context, TNewKey, TValue>>;
    register<TNewKey extends string, TValue>(key: TNewKey, value: TValue): Container<MergeContext<TContext, TNewKey, TValue>>;
    static register<TNewKey extends string, TValue>(key: TNewKey, value: TValue): Container<MergeContext<Context, TNewKey, TValue>>;
    unregister<TNewKey extends string>(key: TNewKey): Container<Omit<TContext, TNewKey>>;
    static unregister<TNewKey extends string>(key: TNewKey): Container<Omit<Context, TNewKey>>;
    resolve<T>(key: keyof TContext): T;
}
export {};
