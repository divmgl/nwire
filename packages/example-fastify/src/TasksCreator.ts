import { AppContext } from "./AppContext"
import { Service } from "./Service"

export class TasksCreator extends Service {
  async createBasicTasks() {
    await this.tasks.save("My first test")
    await this.tasks.save("My second test")
  }
}
