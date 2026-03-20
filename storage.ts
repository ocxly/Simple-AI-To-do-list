import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Category, AppSettings, AISession } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const KEYS = {
  TASKS: '@aitodo/tasks',
  CATEGORIES: '@aitodo/categories',
  SETTINGS: '@aitodo/settings',
  AI_SESSIONS: '@aitodo/ai_sessions',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  notificationsEnabled: true,
  defaultPriority: 'medium',
  defaultCategoryId: 'personal',
  aiAssistEnabled: true,
  anthropicApiKey: '',
  smartReminders: true,
  dailyDigest: false,
  dailyDigestTime: '08:00',
};

// ── Tasks ──────────────────────────────────────────────────────────────────
export async function getTasks(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}

export async function addTask(task: Task): Promise<void> {
  const tasks = await getTasks();
  tasks.unshift(task);
  await saveTasks(tasks);
}

export async function updateTask(updated: Task): Promise<void> {
  const tasks = await getTasks();
  const idx = tasks.findIndex((t) => t.id === updated.id);
  if (idx !== -1) {
    tasks[idx] = updated;
    await saveTasks(tasks);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const tasks = await getTasks();
  await saveTasks(tasks.filter((t) => t.id !== taskId));
}

// ── Categories ─────────────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CATEGORIES);
    return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
}

export async function addCategory(category: Category): Promise<void> {
  const cats = await getCategories();
  cats.push(category);
  await saveCategories(cats);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const cats = await getCategories();
  await saveCategories(cats.filter((c) => c.id !== categoryId));
}

// ── Settings ───────────────────────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}

// ── AI Sessions ────────────────────────────────────────────────────────────
export async function getAISessions(): Promise<AISession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.AI_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAISession(session: AISession): Promise<void> {
  const sessions = await getAISessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx !== -1) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  // Keep only last 20 sessions
  await AsyncStorage.setItem(KEYS.AI_SESSIONS, JSON.stringify(sessions.slice(0, 20)));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
