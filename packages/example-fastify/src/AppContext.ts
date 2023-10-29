import { Container } from "nwire"
import { TasksCreator } from "./TasksCreator"
import { createDatabase } from "./createDatabase"
import { SQLiteTaskStore } from "./SQLiteTaskStore"

export type AppContext = {
  db: Awaited<ReturnType<typeof createDatabase>>
  tasksCreator: TasksCreator
  tasks: SQLiteTaskStore
}

export async function createContext() {
  const database = await createDatabase()

  const context = Container.new()
    .register("db", () => database)
    .instance("tasksCreator", TasksCreator)
    .instance("tasks", SQLiteTaskStore)
    .context<AppContext>()

  return context
}
