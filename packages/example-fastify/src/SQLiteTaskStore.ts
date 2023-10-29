import { TaskStore } from "./TaskStore"
import { Task } from "./Task"
import { Service } from "nwire"
import { AppContext } from "./AppContext"

export class SQLiteTaskStore
  extends Service<AppContext>()
  implements TaskStore
{
  async get(id: number): Promise<Task | null> {
    return (await this.db.get(`SELECT * FROM tasks WHERE id = ?`, [id])) ?? null
  }

  async save(title: string): Promise<Task> {
    const insert = await this.db.run(`INSERT INTO tasks (title) VALUES (?);`, [
      title,
    ])

    if (!insert.lastID) throw new Error("unable to save task")

    return (await this.get(insert.lastID))!
  }

  async delete(id: number): Promise<void> {
    await this.db.run(`DELETE FROM tasks WHERE id = ?`, [id])
  }
}
