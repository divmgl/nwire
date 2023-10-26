export type Context = {
    [key: string]: unknown;
};
export type Instance<TValue> = {
    new (context: any, ...args: any[]): TValue;
};
type Flatten<T> = {} & {
    [P in keyof T]: T[P];
};
type MergeContext<TExisting, TKey extends string, TValue> = Flatten<TExisting & {
    [P in TKey]: TValue;
}>;
type RegistrationOptions = {
    transient?: boolean;
};
export declare class Container<TContext extends Context = {}> {
    private _registry;
    private _map;
    private _transient;
    constructor();
    static build(): Container;
    context<TWriteContext extends Context = TContext>(rootContext?: Context): TWriteContext;
    group<TNewKey extends string, TNewContext extends Context>(key: TNewKey, decorator: (container: Container<TContext>) => Container<TNewContext>): Container<MergeContext<Context, TNewKey, TNewContext>>;
    static group<TNewKey extends string, TNewContext extends Context>(key: TNewKey, decorator: (container: Container<Context>) => Container<TNewContext>): Container<MergeContext<Context, TNewKey, TNewContext>>;
    instance<TNewKey extends string, TValue>(key: TNewKey, ValueClass: Instance<TValue>, ...args: any[]): Container<MergeContext<TContext, TNewKey, TValue>>;
    static instance<TNewKey extends string, TValue>(key: TNewKey, ValueClass: Instance<TValue>, ...args: any[]): Container<MergeContext<Context, TNewKey, TValue>>;
    register<TNewKey extends string, TValue>(key: TNewKey, value: (context: TContext) => TValue, { transient }?: RegistrationOptions): Container<MergeContext<TContext, TNewKey, TValue>>;
    static register<TNewKey extends string, TValue>(key: TNewKey, value: (context: Context) => TValue, options?: RegistrationOptions): Container<MergeContext<Context, TNewKey, TValue>>;
    unregister<TNewKey extends string>(key: TNewKey): Container<Omit<TContext, TNewKey>>;
    static unregister<TNewKey extends string>(key: TNewKey): Container<Omit<Context, TNewKey>>;
    resolve<T>(key: keyof TContext): T;
}
export {};
