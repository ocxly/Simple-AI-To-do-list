import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';

import { useTheme } from '../hooks/useTheme';
import { useTasks } from '../hooks/useTasks';
import { COLORS, DEFAULT_CATEGORIES, PRIORITY_LABELS, REPEAT_LABELS } from '../constants';
import { RootStackParamList, Task, Priority, RepeatInterval, Category, Subtask } from '../types';
import * as storage from '../services/storage';
import { getSmartSuggestions } from '../services/ai';

type AddRoute = RouteProp<RootStackParamList, 'AddTask'>;
type EditRoute = RouteProp<RootStackParamList, 'EditTask'>;

export default function AddTaskScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<AddRoute>();
  const { theme, isDark } = useTheme();
  const { createTask, tasks, updateTask } = useTasks();

  // Check if editing
  const editTaskId = (route as any).params?.taskId as string | undefined;
  const existingTask = editTaskId ? tasks.find((t) => t.id === editTaskId) : undefined;

  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');
  const [categoryId, setCategoryId] = useState(existingTask?.categoryId ?? route.params?.categoryId ?? 'personal');
  const [priority, setPriority] = useState<Priority>(existingTask?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(existingTask?.dueDate ?? '');
  const [dueTime, setDueTime] = useState(existingTask?.dueTime ?? '');
  const [reminder, setReminder] = useState(existingTask?.reminder ? true : false);
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>(existingTask?.repeatInterval ?? 'none');
  const [subtasks, setSubtasks] = useState<Subtask[]>(existingTask?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [tags, setTags] = useState<string[]>(existingTask?.tags ?? []);
  const [newTag, setNewTag] = useState('');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotes, setAiNotes] = useState(existingTask?.aiNotes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storage.getCategories().then(setCategories);
    if (route.params?.prefillData) {
      const p = route.params.prefillData;
      if (p.title) setTitle(p.title);
      if (p.description) setDescription(p.description ?? '');
      if (p.categoryId) setCategoryId(p.categoryId);
      if (p.priority) setPriority(p.priority);
      if (p.dueDate) setDueDate(p.dueDate);
      if (p.dueTime) setDueTime(p.dueTime ?? '');
      if (p.subtasks) setSubtasks(p.subtasks);
      if (p.tags) setTags(p.tags);
      if (p.aiNotes) setAiNotes(p.aiNotes);
    }
  }, []);

  const getAISuggestions = async () => {
    if (!title.trim()) {
      Alert.alert('Type a title first', 'Enter a task title to get AI suggestions.');
      return;
    }
    setAiLoading(true);
    try {
      const settings = await storage.getSettings();
      const suggestions = await getSmartSuggestions(title, settings.anthropicApiKey);
      if (suggestions.categoryId) setCategoryId(suggestions.categoryId);
      if (suggestions.priority) setPriority(suggestions.priority as Priority);
      if (suggestions.tags) setTags(suggestions.tags);
      if (suggestions.subtasks) {
        setSubtasks(suggestions.subtasks.map((s: any) => ({ id: uuidv4(), title: s.title, completed: false })));
      }
      if (suggestions.aiNotes) setAiNotes(suggestions.aiNotes);
    } catch (e: any) {
      Alert.alert('AI Error', e.message);
    }
    setAiLoading(false);
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [...prev, { id: uuidv4(), title: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => setSubtasks((prev) => prev.filter((s) => s.id !== id));

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags((prev) => [...prev, newTag.trim()]);
    setNewTag('');
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a task title.');
      return;
    }
    setSaving(true);
    try {
      const reminderDate = reminder && dueDate
        ? (() => {
            const d = new Date(`${dueDate}T${dueTime || '09:00'}:00`);
            d.setHours(d.getHours() - 1);
            return d.toISOString();
          })()
        : undefined;

      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        priority,
        status: existingTask?.status ?? ('pending' as const),
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        reminder: reminderDate,
        repeatInterval,
        subtasks,
        tags,
        aiNotes: aiNotes || undefined,
        aiSuggested: !!aiNotes,
      };

      if (existingTask) {
        await updateTask(existingTask.id, taskData);
      } else {
        await createTask(taskData);
      }
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const s = styles(theme);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Feather name="x" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{existingTask ? 'Edit Task' : 'New Task'}</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.primary} /> : <Text style={s.saveBtn}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Title */}
        <TextInput
          style={s.titleInput}
          placeholder="What needs to be done?"
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
          multiline
          autoFocus={!existingTask}
        />

        {/* AI Button */}
        <TouchableOpacity style={s.aiBtn} onPress={getAISuggestions} disabled={aiLoading}>
          {aiLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <><Feather name="zap" size={14} color="#fff" /><Text style={s.aiBtnText}> AI Suggest</Text></>
          }
        </TouchableOpacity>

        {aiNotes ? (
          <View style={s.aiNote}>
            <Feather name="info" size={14} color={COLORS.primary} />
            <Text style={s.aiNoteText}>{aiNotes}</Text>
          </View>
        ) : null}

        {/* Description */}
        <Label text="Description" theme={theme} />
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="Add details..."
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Category */}
        <Label text="Category" theme={theme} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[s.chip, categoryId === cat.id && { backgroundColor: cat.color }]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text style={[s.chipText, categoryId === cat.id && { color: '#fff' }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Priority */}
        <Label text="Priority" theme={theme} />
        <View style={s.row}>
          {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.priorityBtn, { borderColor: COLORS.priority[p] }, priority === p && { backgroundColor: COLORS.priority[p] }]}
              onPress={() => setPriority(p)}
            >
              <Text style={[s.priorityText, { color: priority === p ? '#fff' : COLORS.priority[p] }]}>
                {PRIORITY_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Due Date */}
        <Label text="Due Date" theme={theme} />
        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1, marginRight: 8 }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.textMuted}
            value={dueDate}
            onChangeText={setDueDate}
          />
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="HH:MM"
            placeholderTextColor={theme.textMuted}
            value={dueTime}
            onChangeText={setDueTime}
          />
        </View>

        {/* Reminder */}
        <View style={s.switchRow}>
          <View>
            <Text style={[s.label, { marginBottom: 0 }]}>Reminder</Text>
            <Text style={[s.sublabel, { color: theme.textMuted }]}>1 hour before due time</Text>
          </View>
          <Switch value={reminder} onValueChange={setReminder} thumbColor={COLORS.primary} trackColor={{ true: COLORS.primary + '66', false: theme.border }} />
        </View>

        {/* Repeat */}
        <Label text="Repeat" theme={theme} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {(['none', 'daily', 'weekly', 'monthly'] as RepeatInterval[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.chip, repeatInterval === r && { backgroundColor: COLORS.primary }]}
              onPress={() => setRepeatInterval(r)}
            >
              <Text style={[s.chipText, repeatInterval === r && { color: '#fff' }]}>{REPEAT_LABELS[r]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Subtasks */}
        <Label text="Subtasks" theme={theme} />
        {subtasks.map((st) => (
          <View key={st.id} style={s.subtaskRow}>
            <Feather name="check-circle" size={16} color={theme.textMuted} />
            <Text style={[s.subtaskText, { color: theme.text }]}>{st.title}</Text>
            <TouchableOpacity onPress={() => removeSubtask(st.id)}>
              <Feather name="trash-2" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={[s.row, { marginBottom: 0 }]}>
          <TextInput
            style={[s.input, { flex: 1, marginRight: 8 }]}
            placeholder="Add subtask..."
            placeholderTextColor={theme.textMuted}
            value={newSubtask}
            onChangeText={setNewSubtask}
            onSubmitEditing={addSubtask}
          />
          <TouchableOpacity style={s.addIconBtn} onPress={addSubtask}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <Label text="Tags" theme={theme} />
        <View style={s.tagsWrap}>
          {tags.map((tag) => (
            <TouchableOpacity key={tag} style={s.tag} onPress={() => setTags((t) => t.filter((x) => x !== tag))}>
              <Text style={s.tagText}>#{tag} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1, marginRight: 8 }]}
            placeholder="Add tag..."
            placeholderTextColor={theme.textMuted}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={addTag}
          />
          <TouchableOpacity style={s.addIconBtn} onPress={addTag}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ text, theme }: { text: string; theme: any }) {
  return <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{text}</Text>;
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { padding: 16, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    saveBtn: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
    titleInput: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 12, lineHeight: 30 },
    aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 12 },
    aiBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    aiNote: { flexDirection: 'row', backgroundColor: COLORS.primary + '15', borderRadius: 10, padding: 10, marginBottom: 8, gap: 8 },
    aiNoteText: { flex: 1, color: COLORS.primary, fontSize: 13, lineHeight: 18 },
    input: { backgroundColor: theme.card, color: theme.text, borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: theme.border },
    textArea: { height: 80, textAlignVertical: 'top' },
    label: { color: theme.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    sublabel: { fontSize: 11, marginTop: 2 },
    chipScroll: { marginBottom: 4 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.card, marginRight: 8, borderWidth: 1, borderColor: theme.border },
    chipText: { color: theme.text, fontSize: 13, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    priorityBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
    priorityText: { fontSize: 12, fontWeight: '700' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, borderRadius: 14, padding: 14, marginTop: 16 },
    subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.card, borderRadius: 10, padding: 10, marginBottom: 6 },
    subtaskText: { flex: 1, fontSize: 14 },
    addIconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    tag: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    tagText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  });
