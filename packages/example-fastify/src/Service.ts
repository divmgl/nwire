import { Injected } from "nwire"
import { AppContext } from "./AppContext"

export class Service extends Injected<AppContext> {
  get db() {
    return this._context.db
  }

  get tasks() {
    return this._context.tasks
  }
}
