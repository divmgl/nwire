import * as sqlite from "sqlite"
import * as sqlite3 from "sqlite3"

export async function createDatabase() {
  const db = await sqlite.open({
    filename: ":memory:",
    driver: sqlite3.Database,
  })

  await db.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    )`
  )

  await db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`
  )

  await db.run(
    `CREATE TABLE IF NOT EXISTS users_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(task_id) REFERENCES tasks(id)
    )`
  )

  return db
}
