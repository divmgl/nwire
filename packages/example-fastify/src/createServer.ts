import Fastify from "fastify"
import { TaskStore } from "./TaskStore"
import { Task } from "./Task"
import { TasksCreator } from "./TasksCreator"

export type AppContext = {
  tasks: TaskStore
  tasksCreator: TasksCreator
}

export function createServer(context: AppContext) {
  const server = Fastify()

  server.get("/health", async (_request, reply) => {
    reply.send({ status: "ok" })
  })

  server.post<{ Body: Task }>("/task", async (request, reply) => {
    const task = await context.tasks.save(request.body.title)
    await reply.send(task)
  })

  server.post<{ Body: Task }>(
    "/create-basic-tasks",
    async (_request, reply) => {
      const task = await context.tasksCreator.createBasicTasks()
      await reply.send(task)
    }
  )

  return server
}
