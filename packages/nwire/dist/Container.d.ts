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
    transient?: boolean;
};
export declare class Container<TContext extends Context = {}> {
    private _registry;
    private _resolvers;
    private _cache;
    private _transient;
    private _base;
    private _rootContainer;
    private _parentContainer;
    constructor(rootContainer?: Container, _parentContainer?: Container);
    get root(): this | Container<{}>;
    get parent(): this | Container<{}>;
    static new<T extends Context = {}>(): Container<T>;
    static build<T extends Context = {}>(): Container<T>;
    base<TBase extends Context>(base: TBase): Container<TContext & TBase>;
    createContextProxy(): Context;
    context<TWriteContext extends Context = TContext, TOverride extends Context = {}>(override?: TOverride | {}): Flatten<TWriteContext & TOverride>;
    group<TNewKey extends string, TNewContext extends Context>(key: TNewKey, decorator: (container: Container<{}>) => Container<TNewContext>): Container<TContext & { [key in TNewKey]: TNewContext; }>;
    singleton<TNewKey extends string, TValue>(key: TNewKey, ClassConstructor: Instance<TValue>, ...args: any[]): Container<TContext & { [P_1 in TNewKey]: TValue; } extends infer T ? { [P in keyof T]: (TContext & { [P_1 in TNewKey]: TValue; })[P]; } : never>;
    instance<TNewKey extends string, TValue>(key: TNewKey, ClassConstructor: Instance<TValue>, ...args: any[]): Container<TContext & { [P_1 in TNewKey]: TValue; } extends infer T ? { [P in keyof T]: (TContext & { [P_1 in TNewKey]: TValue; })[P]; } : never>;
    register<TNewKey extends string, TValue>(key: TNewKey, resolver: (context: TContext) => TValue, { transient }?: RegistrationOptions): Container<AppendContext<TContext, TNewKey, TValue>>;
    unregister<TNewKey extends string>(key: TNewKey): Container<Omit<TContext, TNewKey>>;
    resolve<TValue>(key: keyof TContext): TValue;
    middleware<TNewContext extends Context>(middleware: (container: Container<TContext>) => Container<TNewContext>): Container<TNewContext>;
}
export {};
