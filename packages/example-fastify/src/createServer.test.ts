import { createServer } from "./createServer"
import { beforeEach, describe, expect, it } from "vitest"
import { SQLiteTaskStore } from "./SQLiteTaskStore"
import { Container } from "nwire"
import { SuperAgentTest, agent } from "supertest"
import { TasksCreator } from "./TasksCreator"

declare module "vitest" {
  export interface TestContext {
    request: SuperAgentTest
  }
}

describe("server", function () {
  beforeEach(async (context) => {
    console.log(Container)
    const container = Container
      //
      .singleton("tasks", SQLiteTaskStore)
      .singleton("tasksCreator", TasksCreator)

    const server = createServer(container.context())
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
