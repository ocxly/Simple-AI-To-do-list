import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';

import { useTheme } from '../hooks/useTheme';
import { useTasks } from '../hooks/useTasks';
import { COLORS, DEFAULT_CATEGORIES, PRIORITY_LABELS } from '../constants';
import { RootStackParamList } from '../types';
import * as storage from '../services/storage';

type Route = RouteProp<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<Route>();
  const { theme } = useTheme();
  const { tasks, completeTask, deleteTask, toggleSubtask, updateTask } = useTasks();
  const [categories] = useState(DEFAULT_CATEGORIES);

  const task = tasks.find((t) => t.id === route.params.taskId);
  if (!task) return null;

  const category = categories.find((c) => c.id === task.categoryId);
  const priorityColor = COLORS.priority[task.priority];
  const isComplete = task.status === 'completed';

  const handleComplete = () => {
    Alert.alert('Complete Task', 'Mark this task as done?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete ✓', onPress: async () => { await completeTask(task.id); nav.goBack(); } },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTask(task.id); nav.goBack(); } },
    ]);
  };

  const s = styles(theme);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={s.navActions}>
          <TouchableOpacity style={s.iconBtn} onPress={() => nav.navigate('EditTask', { taskId: task.id })}>
            <Feather name="edit-2" size={18} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={handleDelete}>
            <Feather name="trash-2" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category + Status */}
      <View style={s.metaRow}>
        {category && (
          <View style={[s.catBadge, { backgroundColor: category.color + '22' }]}>
            <View style={[s.catDot, { backgroundColor: category.color }]} />
            <Text style={[s.catText, { color: category.color }]}>{category.name}</Text>
          </View>
        )}
        <View style={[s.statusBadge, isComplete && s.completedBadge]}>
          <Text style={[s.statusText, isComplete && { color: COLORS.accentGreen }]}>
            {isComplete ? '✓ Completed' : task.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={[s.title, isComplete && s.strikethrough]}>{task.title}</Text>

      {/* Description */}
      {task.description && <Text style={s.description}>{task.description}</Text>}

      {/* AI Notes */}
      {task.aiNotes && (
        <View style={s.aiCard}>
          <Feather name="zap" size={14} color={COLORS.primary} />
          <Text style={s.aiText}>{task.aiNotes}</Text>
        </View>
      )}

      {/* Details Grid */}
      <View style={s.grid}>
        <Detail icon="flag" label="Priority" value={PRIORITY_LABELS[task.priority]} color={priorityColor} theme={theme} />
        {task.dueDate && (
          <Detail icon="calendar" label="Due" value={`${format(new Date(task.dueDate), 'MMM d, yyyy')}${task.dueTime ? ' ' + task.dueTime : ''}`} theme={theme} />
        )}
        {task.reminder && (
          <Detail icon="bell" label="Reminder" value={format(new Date(task.reminder), 'MMM d, h:mm a')} theme={theme} />
        )}
        {task.repeatInterval !== 'none' && (
          <Detail icon="repeat" label="Repeat" value={task.repeatInterval} theme={theme} />
        )}
      </View>

      {/* Progress */}
      {task.subtasks.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Subtasks</Text>
            <Text style={[s.progress, { color: COLORS.primary }]}>{completedSubtasks}/{task.subtasks.length}</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${(completedSubtasks / task.subtasks.length) * 100}%` }]} />
          </View>
          {task.subtasks.map((st) => (
            <TouchableOpacity key={st.id} style={s.subtaskRow} onPress={() => toggleSubtask(task.id, st.id)}>
              <View style={[s.checkbox, st.completed && s.checkboxDone]}>
                {st.completed && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text style={[s.subtaskText, { color: theme.text }, st.completed && s.subtaskDone]}>{st.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tags</Text>
          <View style={s.tagsWrap}>
            {task.tags.map((tag) => (
              <View key={tag} style={s.tag}>
                <Text style={s.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      {!isComplete && (
        <TouchableOpacity style={s.completeBtn} onPress={handleComplete}>
          <Feather name="check-circle" size={20} color="#fff" />
          <Text style={s.completeBtnText}>Mark as Complete</Text>
        </TouchableOpacity>
      )}

      <Text style={s.createdAt}>
        Created {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
      </Text>
    </ScrollView>
  );
}

function Detail({ icon, label, value, color, theme }: any) {
  return (
    <View style={[detailStyles.card, { backgroundColor: theme.card }]}>
      <Feather name={icon} size={16} color={color || theme.textSecondary} />
      <Text style={[detailStyles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: color || theme.text }]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  card: { flex: 1, minWidth: '45%', margin: 4, borderRadius: 14, padding: 12 },
  label: { fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 14, fontWeight: '700', marginTop: 2 },
});

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { padding: 16, paddingBottom: 60 },
    nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 4 },
    navActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' },
    metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    catBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 6 },
    catDot: { width: 8, height: 8, borderRadius: 4 },
    catText: { fontSize: 13, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: theme.card },
    completedBadge: { backgroundColor: COLORS.accentGreen + '20' },
    statusText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, textTransform: 'capitalize' },
    title: { fontSize: 26, fontWeight: '800', color: theme.text, lineHeight: 34, marginBottom: 10 },
    strikethrough: { textDecorationLine: 'line-through', opacity: 0.5 },
    description: { fontSize: 16, color: theme.textSecondary, lineHeight: 24, marginBottom: 16 },
    aiCard: { flexDirection: 'row', backgroundColor: COLORS.primary + '15', borderRadius: 12, padding: 12, gap: 8, marginBottom: 16 },
    aiText: { flex: 1, color: COLORS.primary, fontSize: 13, lineHeight: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -4, marginBottom: 12 },
    section: { marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    progress: { fontSize: 14, fontWeight: '700' },
    progressBar: { height: 4, backgroundColor: theme.border, borderRadius: 2, marginBottom: 12 },
    progressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
    subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' },
    checkboxDone: { backgroundColor: COLORS.accentGreen, borderColor: COLORS.accentGreen },
    subtaskText: { flex: 1, fontSize: 15 },
    subtaskDone: { textDecorationLine: 'line-through', opacity: 0.5 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    tagText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
    completeBtn: { flexDirection: 'row', backgroundColor: COLORS.accentGreen, borderRadius: 16, padding: 16, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 24 },
    completeBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    createdAt: { color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 20 },
  });
