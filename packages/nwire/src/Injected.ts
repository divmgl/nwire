import { Context } from "./Container"

export class Injected<TContext extends Context> {
  constructor(protected _context: TContext) {}
}
