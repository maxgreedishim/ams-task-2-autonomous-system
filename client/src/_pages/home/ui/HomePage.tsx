'use client';

import { useState } from 'react';
import type { Task } from '@/entities/task';
import { CreateTaskForm } from '@/features/create-task';
import { TaskStatusCard } from '@/widgets/task-status';

export function HomePage() {
  const [task, setTask] = useState<Task | null>(null);
  return <main><div className="shell"><header className="hero"><div><span className="eyebrow">AMS · НАПРАВЛЕНИЕ B</span><h1>Управляемые действия</h1><p>Безопасное выполнение задач с контролем действий и подтверждением записи.</p><p className="author">Тестовое задание выполнил: Денис Николаевич · <a href="mailto:89923002057@mail.ru">89923002057@mail.ru</a> · <a href="https://t.me/Digadjava" target="_blank" rel="noreferrer">@Digadjava</a></p></div></header><div className="content-grid"><section className="control-column"><div className="section-heading"><div><h2>Создать задачу</h2><p>Укажите, что нужно сделать, и выберите правила выполнения.</p></div></div><CreateTaskForm onCreated={setTask} /></section>{task ? <TaskStatusCard key={task.task_id} initialTask={task} onTaskChanged={setTask} /> : <section className="empty-state"><span className="empty-icon">◌</span><h2>Задача появится здесь</h2><p>Создайте задачу слева, чтобы увидеть план, ожидающее действие и журнал действий.</p></section>}</div><footer>Демонстрационная система · внешние системы не подключены</footer></div></main>;
}
