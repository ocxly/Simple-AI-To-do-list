import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, Subtask } from '../types';
import * as storage from '../services/storage';
import * as notif from '../services/notifications';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const t = await storage.getTasks();
    setTasks(t);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const task: Task = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Schedule notification if reminder set
    if (task.reminder) {
      const notifId = await notif.scheduleTaskReminder(task);
      if (notifId) task.notificationId = notifId;
    }

    await storage.addTask(task);
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, changes: Partial<Task>): Promise<void> => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated: Task = { ...t, ...changes, updatedAt: new Date().toISOString() };

        // Handle notification update
        if (changes.reminder !== undefined) {
          if (t.notificationId) {
            notif.cancelTaskReminder(t.notificationId);
          }
          if (changes.reminder) {
            notif.scheduleTaskReminder(updated).then((nId) => {
              if (nId) {
                const withNotif = { ...updated, notificationId: nId };
                storage.updateTask(withNotif);
              }
            });
          }
        }

        storage.updateTask(updated);
        return updated;
      })
    );
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const task = tasks.find((t) => t.id === id);
    if (task?.notificationId) {
      await notif.cancelTaskReminder(task.notificationId);
    }
    await storage.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [tasks]);

  const completeTask = useCallback(async (id: string): Promise<void> => {
    await updateTask(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }, [updateTask]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string): Promise<void> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const subtasks: Subtask[] = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateTask(taskId, { subtasks });
  }, [tasks, updateTask]);

  const getTasksByCategory = useCallback((categoryId: string) =>
    tasks.filter((t) => t.categoryId === categoryId && t.status !== 'archived'),
  [tasks]);

  const getTasksByStatus = useCallback((status: Task['status']) =>
    tasks.filter((t) => t.status === status),
  [tasks]);

  const getDueTodayTasks = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => t.dueDate === today && t.status !== 'completed' && t.status !== 'archived');
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== 'completed' && t.status !== 'archived'
    );
  }, [tasks]);

  return {
    tasks,
    loading,
    reload: load,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    toggleSubtask,
    getTasksByCategory,
    getTasksByStatus,
    getDueTodayTasks,
    getOverdueTasks,
  };
}
