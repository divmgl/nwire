import { Context } from "./Container";
export declare class Injected<TContext extends Context> {
    protected _context: TContext;
    constructor(_context: TContext);
}
