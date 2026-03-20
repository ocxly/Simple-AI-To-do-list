import { AIMessage, Task } from '../types';
import { AI_SYSTEM_PROMPT } from '../constants';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedAIResponse {
  action?: 'create_task';
  task?: Partial<Task>;
  text: string;
  rawJson?: object;
}

export async function sendAIMessage(
  messages: AIMessage[],
  apiKey: string,
  taskContext?: string
): Promise<ParsedAIResponse> {
  if (!apiKey) {
    throw new Error('No API key configured. Please add your Anthropic API key in Settings.');
  }

  const systemPrompt = taskContext
    ? `${AI_SYSTEM_PROMPT}\n\nCurrent task context:\n${taskContext}`
    : AI_SYSTEM_PROMPT;

  const formattedMessages: AnthropicMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: formattedMessages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? '';

  // Try to parse JSON action
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action === 'create_task') {
        return {
          action: 'create_task',
          task: parsed.task,
          text: rawText.replace(jsonMatch[0], '').trim() ||
            `I've prepared a task: **${parsed.task?.title}**. Want me to add it?`,
          rawJson: parsed,
        };
      }
    }
  } catch {
    // Not JSON – return as plain text
  }

  return { text: rawText };
}

export async function getSmartSuggestions(
  taskTitle: string,
  apiKey: string
): Promise<Partial<Task>> {
  if (!apiKey) return {};

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: AI_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this task and return ONLY a JSON object with suggestions (no markdown, no explanation):
Task: "${taskTitle}"
Return: {"categoryId": "...", "priority": "...", "tags": [...], "subtasks": [{"title": "..."}], "aiNotes": "..."}`,
        },
      ],
    }),
  });

  if (!response.ok) return {};

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? '';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {};
  }
}

export async function generateDailyPlan(
  tasks: Task[],
  apiKey: string
): Promise<string> {
  if (!apiKey) return 'Configure your API key in Settings to get AI-powered daily plans.';

  const pendingTasks = tasks
    .filter((t) => t.status === 'pending' || t.status === 'in_progress')
    .slice(0, 20);

  const taskSummary = pendingTasks.map((t) =>
    `- ${t.title} [${t.priority}] ${t.dueDate ? `due: ${t.dueDate}` : 'no due date'}`
  ).join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Based on these pending tasks, give me a concise daily plan with recommended order and time estimates. Be practical and encouraging.\n\nTasks:\n${taskSummary}`,
        },
      ],
    }),
  });

  if (!response.ok) return 'Unable to generate plan right now.';

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}
