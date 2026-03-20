import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTasks } from '../hooks/useTasks';
import { useTheme } from '../hooks/useTheme';
import { COLORS, DEFAULT_CATEGORIES } from '../constants';
import { RootStackParamList, Task } from '../types';
import * as storage from '../services/storage';
import { generateDailyPlan } from '../services/ai';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { theme, isDark } = useTheme();
  const { tasks, loading, reload, getDueTodayTasks, getOverdueTasks } = useTasks();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [aiPlan, setAiPlan] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todayTasks = getDueTodayTasks();
  const overdueTasks = getOverdueTasks();
  const completedToday = tasks.filter(
    (t) => t.completedAt && t.completedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    storage.getCategories().then(setCategories);
    fetchAIPlan();
  }, []);

  const fetchAIPlan = async () => {
    setLoadingPlan(true);
    const settings = await storage.getSettings();
    if (settings.aiAssistEnabled && settings.anthropicApiKey) {
      const plan = await generateDailyPlan(tasks, settings.anthropicApiKey);
      setAiPlan(plan);
    }
    setLoadingPlan(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const s = styles(theme, isDark);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting()} 👋</Text>
          <Text style={s.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <TouchableOpacity style={s.aiBtn} onPress={() => nav.navigate('AIAssistant', {})}>
          <Feather name="zap" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <StatCard label="Today" value={todayTasks.length} color={COLORS.primary} icon="calendar" theme={theme} />
        <StatCard label="Overdue" value={overdueTasks.length} color={COLORS.accent} icon="alert-circle" theme={theme} />
        <StatCard label="Done" value={completedToday.length} color={COLORS.accentGreen} icon="check-circle" theme={theme} />
      </View>

      {/* AI Daily Plan */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>✨ AI Daily Plan</Text>
          <TouchableOpacity onPress={fetchAIPlan}>
            <Feather name="refresh-cw" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={s.planCard}>
          {loadingPlan ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : aiPlan ? (
            <Text style={s.planText}>{aiPlan}</Text>
          ) : (
            <TouchableOpacity onPress={() => nav.navigate('Settings')}>
              <Text style={s.planEmpty}>Configure your API key in Settings to get AI-powered daily plans 🚀</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: COLORS.accent }]}>⚠️ Overdue</Text>
          {overdueTasks.slice(0, 3).map((t) => (
            <TaskRow key={t.id} task={t} theme={theme} onPress={() => nav.navigate('TaskDetail', { taskId: t.id })} />
          ))}
        </View>
      )}

      {/* Today's tasks */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>📅 Today</Text>
          <TouchableOpacity onPress={() => nav.navigate('AddTask', {})}>
            <Feather name="plus" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {todayTasks.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No tasks for today 🎉</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate('AddTask', {})}>
              <Text style={s.addBtnText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todayTasks.map((t) => (
            <TaskRow key={t.id} task={t} theme={theme} onPress={() => nav.navigate('TaskDetail', { taskId: t.id })} />
          ))
        )}
      </View>

      {/* Categories */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📂 Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
          {categories.map((cat) => {
            const count = tasks.filter((t) => t.categoryId === cat.id && t.status !== 'completed').length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.catCard, { borderColor: cat.color }]}
                onPress={() => nav.navigate('Tasks' as any, { categoryId: cat.id })}
              >
                <View style={[s.catDot, { backgroundColor: cat.color }]} />
                <Text style={s.catName}>{cat.name}</Text>
                <Text style={[s.catCount, { color: cat.color }]}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon, theme }: any) {
  return (
    <View style={[statStyles.card, { backgroundColor: theme.card, borderColor: color + '33' }]}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, marginHorizontal: 4, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  value: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  label: { fontSize: 11, marginTop: 2 },
});

function TaskRow({ task, theme, onPress }: { task: Task; theme: any; onPress: () => void }) {
  const priorityColor = COLORS.priority[task.priority];
  return (
    <TouchableOpacity style={[taskStyles.row, { backgroundColor: theme.card }]} onPress={onPress}>
      <View style={[taskStyles.priorityBar, { backgroundColor: priorityColor }]} />
      <View style={taskStyles.content}>
        <Text style={[taskStyles.title, { color: theme.text }]} numberOfLines={1}>{task.title}</Text>
        {task.dueDate && (
          <Text style={[taskStyles.due, { color: theme.textSecondary }]}>
            {format(new Date(task.dueDate), 'MMM d')} {task.dueTime || ''}
          </Text>
        )}
      </View>
      <View style={[taskStyles.badge, { backgroundColor: priorityColor + '22' }]}>
        <Text style={[taskStyles.badgeText, { color: priorityColor }]}>{task.priority}</Text>
      </View>
    </TouchableOpacity>
  );
}

const taskStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  priorityBar: { width: 4, alignSelf: 'stretch' },
  content: { flex: 1, padding: 12 },
  title: { fontSize: 15, fontWeight: '600' },
  due: { fontSize: 12, marginTop: 2 },
  badge: { marginRight: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});

const styles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { padding: 16, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: 8 },
    greeting: { fontSize: 24, fontWeight: '800', color: theme.text },
    date: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
    aiBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    statsRow: { flexDirection: 'row', marginBottom: 20 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
    planCard: { backgroundColor: theme.card, borderRadius: 16, padding: 16, minHeight: 60, justifyContent: 'center' },
    planText: { fontSize: 14, color: theme.textSecondary, lineHeight: 22 },
    planEmpty: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 22 },
    emptyCard: { backgroundColor: theme.card, borderRadius: 16, padding: 24, alignItems: 'center' },
    emptyText: { color: theme.textSecondary, fontSize: 16, marginBottom: 16 },
    addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
    addBtnText: { color: '#fff', fontWeight: '700' },
    catScroll: { marginTop: 4 },
    catCard: { backgroundColor: theme.card, borderRadius: 16, padding: 14, marginRight: 10, alignItems: 'center', minWidth: 90, borderWidth: 1 },
    catDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
    catName: { color: theme.text, fontSize: 13, fontWeight: '600' },
    catCount: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  });
