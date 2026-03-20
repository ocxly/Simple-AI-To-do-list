export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';
export type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  taskCount?: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // ISO string
  dueTime?: string; // HH:MM
  reminder?: string; // ISO string
  repeatInterval: RepeatInterval;
  subtasks: Subtask[];
  tags: string[];
  aiSuggested?: boolean;
  aiNotes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notificationId?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AISession {
  id: string;
  messages: AIMessage[];
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  defaultPriority: Priority;
  defaultCategoryId: string;
  aiAssistEnabled: boolean;
  anthropicApiKey: string;
  smartReminders: boolean;
  dailyDigest: boolean;
  dailyDigestTime: string; // HH:MM
}

export type RootStackParamList = {
  Main: undefined;
  TaskDetail: { taskId: string };
  AddTask: { categoryId?: string; prefillData?: Partial<Task> };
  EditTask: { taskId: string };
  AIAssistant: { context?: string };
  Settings: undefined;
  CategoryManager: undefined;
};

export type TabParamList = {
  Home: undefined;
  Tasks: undefined;
  AI: undefined;
  Profile: undefined;
};
