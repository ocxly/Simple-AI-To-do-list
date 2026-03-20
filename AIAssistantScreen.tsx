import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

import { useTheme } from '../hooks/useTheme';
import { useTasks } from '../hooks/useTasks';
import { COLORS } from '../constants';
import { AIMessage, AISession } from '../types';
import * as storage from '../services/storage';
import { sendAIMessage } from '../services/ai';

const QUICK_PROMPTS = [
  '📋 Plan my day',
  '➕ Add: Buy groceries tomorrow',
  '🎯 What should I focus on?',
  '⏰ Remind me to exercise daily',
  '📊 Summarize my tasks',
];

export default function AIAssistantScreen() {
  const nav = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { tasks, createTask } = useTasks();
  const scrollRef = useRef<ScrollView>(null);

  const [session, setSession] = useState<AISession>({
    id: uuidv4(),
    messages: [],
    createdAt: new Date().toISOString(),
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingTask, setPendingTask] = useState<any>(null);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMessage: AIMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    const updatedMessages = [...session.messages, userMessage];

    setSession((prev) => ({ ...prev, messages: updatedMessages }));
    setLoading(true);

    try {
      const settings = await storage.getSettings();
      const taskContext = tasks.slice(0, 10).map((t) =>
        `- ${t.title} [${t.priority}] [${t.status}]${t.dueDate ? ' due:' + t.dueDate : ''}`
      ).join('\n');

      const result = await sendAIMessage(updatedMessages, settings.anthropicApiKey, taskContext);

      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: result.text,
        timestamp: new Date().toISOString(),
      };

      setSession((prev) => {
        const s = { ...prev, messages: [...prev.messages, assistantMessage] };
        storage.saveAISession(s);
        return s;
      });

      if (result.action === 'create_task' && result.task) {
        setPendingTask(result.task);
      }
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Something went wrong.');
    }
    setLoading(false);
  };

  const confirmAddTask = async () => {
    if (!pendingTask) return;
    try {
      await createTask({
        title: pendingTask.title,
        description: pendingTask.description,
        categoryId: pendingTask.categoryId || 'personal',
        priority: pendingTask.priority || 'medium',
        status: 'pending',
        dueDate: pendingTask.dueDate,
        dueTime: pendingTask.dueTime,
        repeatInterval: pendingTask.repeatInterval || 'none',
        subtasks: (pendingTask.subtasks || []).map((s: any) => ({ id: uuidv4(), title: s.title, completed: false })),
        tags: pendingTask.tags || [],
        aiSuggested: true,
        aiNotes: pendingTask.aiNotes,
      });
      setPendingTask(null);
      Alert.alert('Task Added! ✅', `"${pendingTask.title}" has been added to your tasks.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [session.messages, loading]);

  const s = styles(theme, isDark);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Feather name="arrow-left" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.aiAvatar}>
              <Feather name="zap" size={18} color="#fff" />
            </View>
            <View>
              <Text style={s.headerTitle}>AI Assistant</Text>
              <Text style={s.headerSub}>Powered by Claude</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setSession({ id: uuidv4(), messages: [], createdAt: new Date().toISOString() })}>
            <Feather name="refresh-cw" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={s.messages} contentContainerStyle={s.messagesContent}>
          {session.messages.length === 0 && (
            <View style={s.welcome}>
              <View style={s.welcomeIcon}>
                <Feather name="zap" size={32} color={COLORS.primary} />
              </View>
              <Text style={s.welcomeTitle}>Hello! I'm your AI assistant</Text>
              <Text style={s.welcomeText}>
                I can help you create tasks, plan your day, set reminders, and boost your productivity. Try a quick prompt below!
              </Text>
            </View>
          )}

          {/* Quick prompts */}
          {session.messages.length === 0 && (
            <View style={s.quickPrompts}>
              {QUICK_PROMPTS.map((p) => (
                <TouchableOpacity key={p} style={s.quickChip} onPress={() => sendMessage(p)}>
                  <Text style={s.quickChipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {session.messages.map((msg, i) => (
            <View key={i} style={[s.bubble, msg.role === 'user' ? s.userBubble : s.aiBubble]}>
              {msg.role === 'assistant' && (
                <View style={s.aiBadge}>
                  <Feather name="zap" size={10} color="#fff" />
                </View>
              )}
              <Text style={[s.bubbleText, { color: msg.role === 'user' ? '#fff' : theme.text }]}>
                {msg.content}
              </Text>
              <Text style={[s.timestamp, { color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : theme.textMuted }]}>
                {format(new Date(msg.timestamp), 'h:mm a')}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={s.aiBubble}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[s.bubbleText, { color: theme.textMuted, marginLeft: 8 }]}>Thinking...</Text>
            </View>
          )}

          {/* Pending task confirmation */}
          {pendingTask && (
            <View style={s.taskConfirm}>
              <Text style={s.taskConfirmTitle}>➕ Add this task?</Text>
              <Text style={s.taskConfirmName}>{pendingTask.title}</Text>
              <Text style={s.taskConfirmMeta}>
                {pendingTask.priority} priority · {pendingTask.categoryId || 'personal'}
                {pendingTask.dueDate ? ` · due ${pendingTask.dueDate}` : ''}
              </Text>
              <View style={s.taskConfirmBtns}>
                <TouchableOpacity style={s.confirmBtn} onPress={confirmAddTask}>
                  <Text style={s.confirmBtnText}>Add Task ✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.dismissBtn} onPress={() => setPendingTask(null)}>
                  <Text style={s.dismissBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={s.inputArea}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]} onPress={() => sendMessage()}>
            <Feather name="send" size={18} color={input.trim() ? '#fff' : theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    aiAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
    headerSub: { fontSize: 12, color: theme.textMuted },
    messages: { flex: 1 },
    messagesContent: { padding: 16, paddingBottom: 20 },
    welcome: { alignItems: 'center', paddingVertical: 24 },
    welcomeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    welcomeTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
    welcomeText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },
    quickPrompts: { gap: 8, marginBottom: 16 },
    quickChip: { backgroundColor: theme.card, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: theme.border },
    quickChipText: { color: theme.text, fontSize: 14 },
    bubble: { maxWidth: '85%', borderRadius: 18, padding: 12, marginBottom: 10 },
    userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: theme.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
    aiBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 2 },
    bubbleText: { fontSize: 15, lineHeight: 22, flex: 1 },
    timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', width: '100%' },
    taskConfirm: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.primary + '40' },
    taskConfirmTitle: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginBottom: 6 },
    taskConfirmName: { fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 4 },
    taskConfirmMeta: { fontSize: 13, color: theme.textSecondary, marginBottom: 12 },
    taskConfirmBtns: { flexDirection: 'row', gap: 10 },
    confirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 10, alignItems: 'center' },
    confirmBtnText: { color: '#fff', fontWeight: '700' },
    dismissBtn: { flex: 1, backgroundColor: theme.border, borderRadius: 12, padding: 10, alignItems: 'center' },
    dismissBtnText: { color: theme.textSecondary, fontWeight: '700' },
    inputArea: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: theme.border, gap: 8, alignItems: 'flex-end' },
    input: { flex: 1, backgroundColor: theme.card, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: theme.text, fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: theme.border },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { backgroundColor: theme.card },
  });
