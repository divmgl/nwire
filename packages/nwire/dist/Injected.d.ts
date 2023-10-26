import { Context } from "./Container";
export declare class Injected<TContext extends Context> {
    protected context: TContext;
    constructor(context: TContext);
}
