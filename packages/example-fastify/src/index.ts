import { Container } from "nwire"
import { createServer } from "./createServer"
import { SQLiteTaskStore } from "./SQLiteTaskStore"
import { TasksCreator } from "./TasksCreator"

const context = Container.build()
  .singleton("tasks", SQLiteTaskStore)
  .singleton("tasksCreator", TasksCreator)
  .context()

const server = createServer(context)

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.info(`Server listening at ${address}`)
})
