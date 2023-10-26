import { Task } from "./Task"

export type TaskStore = {
  save(title: string): Promise<Task>
  delete(id: number): Promise<void>
}
