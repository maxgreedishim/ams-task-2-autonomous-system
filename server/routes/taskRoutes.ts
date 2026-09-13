import { Router } from 'express';
import { cancelTaskController, confirmTaskController, createTaskController, getEventsController, getTaskController } from '../controllers/taskController.js';

export const taskRouter = Router();
taskRouter.post('/tasks', createTaskController);
taskRouter.get('/tasks/:taskId', getTaskController);
taskRouter.get('/tasks/:taskId/events', getEventsController);
taskRouter.post('/tasks/:taskId/confirm', confirmTaskController);
taskRouter.post('/tasks/:taskId/cancel', cancelTaskController);
