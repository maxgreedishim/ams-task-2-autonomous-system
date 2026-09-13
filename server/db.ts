import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Sequelize, DataTypes, Model } from 'sequelize';
import type { TaskStatus, Mode } from './models/types.js';

const storage = process.env.DB_PATH ?? './data/ams.sqlite';
if (storage !== ':memory:') mkdirSync(dirname(storage), { recursive: true });

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

export class Task extends Model {
  declare task_id: string;
  declare workspace_id: string;
  declare user_id: string;
  declare role: string;
  declare goal: string;
  declare context: string;
  declare mode: Mode;
  declare status: TaskStatus;
  declare result: string | null;
  declare plan: string | null;
  declare limits: string;
  declare tool_calls: number;
  declare steps: number;
  declare trace_id: string;
  declare createdAt: Date;
}

Task.init({
  task_id: { type: DataTypes.STRING, primaryKey: true },
  workspace_id: { type: DataTypes.STRING, allowNull: false },
  user_id: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  goal: { type: DataTypes.TEXT, allowNull: false },
  context: { type: DataTypes.TEXT, allowNull: false },
  mode: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  result: DataTypes.TEXT,
  plan: DataTypes.TEXT,
  limits: { type: DataTypes.TEXT, allowNull: false },
  tool_calls: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  steps: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  trace_id: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, tableName: 'tasks', timestamps: true });

export class Event extends Model {
  declare id: number;
  declare task_id: string;
  declare event_type: string;
  declare actor: string;
  declare input_hash: string;
  declare decision: string;
  declare trace_id: string;
  declare payload: string;
}

Event.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  task_id: { type: DataTypes.STRING, allowNull: false },
  event_type: { type: DataTypes.STRING, allowNull: false },
  actor: { type: DataTypes.STRING, allowNull: false },
  input_hash: { type: DataTypes.STRING, allowNull: false },
  decision: { type: DataTypes.STRING, allowNull: false },
  trace_id: { type: DataTypes.STRING, allowNull: false },
  payload: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, tableName: 'events', timestamps: true });

export class Followup extends Model {
  declare id: string;
  declare workspace_id: string;
  declare record_id: string;
  declare title: string;
  declare createdAt: Date;
}

Followup.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  workspace_id: { type: DataTypes.STRING, allowNull: false },
  record_id: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, tableName: 'followups', timestamps: true });

export async function initDb(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();
}
