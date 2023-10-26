import { Context } from "./Container"

export class Injected<TContext extends Context> {
  constructor(protected context: TContext) {}
}
