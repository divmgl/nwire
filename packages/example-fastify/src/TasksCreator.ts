import { AppContext } from "./createServer"

export class TasksCreator {
  constructor(private context: AppContext) {}

  async createBasicTasks() {
    await this.context.tasks.save("My first test")
    await this.context.tasks.save("My second test")
  }
}
