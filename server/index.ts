import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { taskRouter } from './routes/taskRoutes.js';
import { errorHandlingMiddleware } from './middleware/errorHandlingMiddleware.js';
import { requestContextMiddleware } from './middleware/requestContextMiddleware.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestContextMiddleware);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(taskRouter);
app.use(errorHandlingMiddleware);

const port = Number(process.env.PORT ?? 4000);
await initDb();
app.listen(port, () => console.log(`AMS server: http://127.0.0.1:${port}`));
