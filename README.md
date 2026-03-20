# 🤖 AI To-Do — Smart Task Manager for Android

An intelligent, AI-powered to-do app built with **React Native (Expo)** and **Claude AI**. Helps you manage tasks, set reminders, organize by category, and get smart suggestions — all from a beautiful mobile interface.

---

## ✨ Features

- **AI Chat Assistant** — Natural language task creation ("Add buy groceries tomorrow at 6pm")
- **Smart Suggestions** — AI auto-suggests category, priority, subtasks & tags
- **AI Daily Planner** — Claude analyzes your tasks and creates an optimized daily plan
- **Categories** — Work, Personal, Health, Shopping, Learning, Home (fully customizable)
- **Priority Levels** — Low, Medium, High, Urgent with color coding
- **Reminders & Notifications** — Schedule reminders, daily digest, repeat tasks
- **Subtasks** — Break big tasks into smaller steps with progress tracking
- **Tags** — Flexible tagging system
- **Dark/Light Mode** — Automatically follows system preference
- **Offline First** — All data stored locally with AsyncStorage

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android device or emulator
- [Anthropic API Key](https://console.anthropic.com/) (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-todo-app.git
cd ai-todo-app

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android
```

### Configure AI Features

1. Get your API key from [console.anthropic.com](https://console.anthropic.com/)
2. Open the app → tap **Profile** tab → **Settings**
3. Enter your Anthropic API key and tap **Test API Key**
4. Enable **AI Assistant** toggle

Alternatively, set via environment variable:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here npm start
```

---

## 📁 Project Structure

```
ai-todo-app/
├── App.tsx                    # Root navigation & app entry
├── app.config.ts              # Expo configuration
├── src/
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── constants/
│   │   └── index.ts           # Colors, defaults, AI prompt
│   ├── services/
│   │   ├── ai.ts              # Anthropic API integration
│   │   ├── storage.ts         # AsyncStorage CRUD
│   │   └── notifications.ts   # Expo notifications
│   ├── hooks/
│   │   ├── useTasks.ts        # Task state management
│   │   └── useTheme.ts        # Theme utilities
│   └── screens/
│       ├── HomeScreen.tsx     # Dashboard & AI daily plan
│       ├── TasksScreen.tsx    # Task list with filters
│       ├── TaskDetailScreen.tsx
│       ├── AddTaskScreen.tsx  # Add/Edit task form
│       ├── AIAssistantScreen.tsx # Chat interface
│       └── SettingsScreen.tsx
```

---

## 🤖 AI Capabilities

### Natural Language Task Creation
Type or say things like:
- *"Remind me to call mom every Sunday at 3pm"*
- *"Add dentist appointment next Tuesday morning, high priority"*
- *"I need to finish the project report by Friday"*

The AI parses intent and creates structured tasks automatically.

### Smart Suggestions
When adding a task manually, tap **✨ AI Suggest** to automatically fill:
- Best-fit category
- Recommended priority
- Relevant subtasks
- Suggested tags

### Daily Planning
The home screen shows a Claude-generated daily plan ranking your tasks by urgency, importance, and estimated time.

---

## 🏗️ Building for Production

### Android APK / AAB

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android --profile production
```

### Local Development Build

```bash
npx expo run:android
```

---

## 🔧 Configuration

### `app.config.ts`
- App name, bundle ID, splash screen, permissions

### `src/constants/index.ts`
- Color palette, default categories, AI system prompt

### Environment Variables
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

---

## 🛡️ Privacy & Security

- All task data is stored **locally** on device using AsyncStorage
- API key is stored locally and never sent to any server except Anthropic
- No analytics, no tracking, no ads

---

## 📦 Tech Stack

| Technology | Purpose |
|---|---|
| React Native + Expo | Cross-platform mobile framework |
| TypeScript | Type safety |
| Anthropic Claude API | AI intelligence |
| AsyncStorage | Local data persistence |
| Expo Notifications | Push notifications & reminders |
| React Navigation | Screen routing |
| date-fns | Date formatting |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Icons by [Feather Icons](https://feathericons.com/)
