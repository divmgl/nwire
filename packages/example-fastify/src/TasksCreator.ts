import { Service } from "nwire"
import { AppContext } from "./AppContext"

export class TasksCreator extends Service<AppContext>() {
  async createBasicTasks() {
    await this.tasks.save("My first test")
    await this.tasks.save("My second test")
  }
}
