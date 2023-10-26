import { Container } from "nwire"
import { TaskStore } from "./TaskStore"
import * as sqlite from "sqlite"
import { Task } from "./Task"
import * as sqlite3 from "sqlite3"

export class SQLiteTaskStore implements TaskStore {
  db!: sqlite.Database

  constructor() {
    ;(async () => {
      this.db = await sqlite.open({
        filename: ":memory:",
        driver: sqlite3.Database,
      })

      this.db.run(
        `CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0
        )`
      )

      this.db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        )`
      )

      this.db.run(
        `CREATE TABLE IF NOT EXISTS users_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          task_id INTEGER NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(task_id) REFERENCES tasks(id)
        )`
      )
    })()
  }

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
