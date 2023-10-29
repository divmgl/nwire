import { Context } from "./Container";
type PopulatedSingleton<T> = T & {
    [key in keyof T]: T[key];
};
export declare function Service<T extends Context>(Base?: any): new (context: T) => PopulatedSingleton<T>;
export declare class Singleton<TContext extends Context> {
    protected _context: TContext;
    constructor(context: TContext);
}
export {};
