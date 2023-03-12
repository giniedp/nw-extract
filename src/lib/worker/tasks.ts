import { convertFile } from './convert-file'

export const WORKER_TASKS = {
  convertFile: convertFile,
} as const

export type WorkerTasks = typeof WORKER_TASKS
export type TaskName = keyof WorkerTasks
export type TaskArgs<T extends TaskName> = Parameters<WorkerTasks[T]>[0]
