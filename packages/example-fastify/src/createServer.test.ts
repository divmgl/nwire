import { createServer } from "./createServer"
import { beforeEach, describe, expect, it } from "vitest"
import { SQLiteTaskStore } from "./SQLiteTaskStore"
import { Container } from "nwire"
import { SuperAgentTest, agent } from "supertest"
import { TasksCreator } from "./TasksCreator"
import { AppContext } from "./AppContext"
import { createDatabase } from "./createDatabase"

declare module "vitest" {
  export interface TestContext {
    request: SuperAgentTest
  }
}

describe("server", function () {
  beforeEach(async (context) => {
    const database = await createDatabase()

    const container = Container
      //
      .register("db", () => database)
      .instance("tasks", SQLiteTaskStore)
      .instance("tasksCreator", TasksCreator)

    const server = createServer(container.context<AppContext>())
    await server.ready()

    context.request = agent(server.server)
  })

  it("saves and retrieves tasks", async ({ request }) => {
    const response = await request
      .post("/task")
      .send({ title: "test" })
      .expect(200)

    expect(response.body.title).toBe("test")
  })
})
