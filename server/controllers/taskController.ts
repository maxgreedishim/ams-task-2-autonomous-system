import type { Request, Response } from 'express';
import { cancelTask, confirmTask, createTask, getEvents, getTask } from '../services/task-service.js';
import type { CreateTaskInput } from '../models/types.js';

export async function createTaskController(req: Request, res: Response): Promise<void> {
  try { const task = await createTask(req.body as CreateTaskInput); res.status(201).json(await getTask(task.task_id)); }
  catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid task' }); }
}

export async function getTaskController(req: Request, res: Response): Promise<void> {
  const task = await getTask(String(req.params.taskId));
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json(task);
}

export async function getEventsController(req: Request, res: Response): Promise<void> { res.json(await getEvents(String(req.params.taskId))); }

export async function confirmTaskController(req: Request, res: Response): Promise<void> {
  const task = await confirmTask(String(req.params.taskId));
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json(await getTask(task.task_id));
}

export async function cancelTaskController(req: Request, res: Response): Promise<void> {
  const task = await cancelTask(String(req.params.taskId));
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json(await getTask(task.task_id));
}
