import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

import { useTheme } from '../hooks/useTheme';
import { useTasks } from '../hooks/useTasks';
import { COLORS, DEFAULT_CATEGORIES } from '../constants';
import { Task, Category } from '../types';
import * as storage from '../services/storage';

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

export default function TasksScreen() {
  const nav = useNavigation<any>();
  const { theme } = useTheme();
  const { tasks, loading, completeTask, deleteTask } = useTasks();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    storage.getCategories().then(setCategories);
  }, []);

  const filtered = tasks.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (selectedCategory && t.categoryId !== selectedCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const s = styles(theme);

  return (
    <View style={s.container}>
      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Feather name="search" size={16} color={theme.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate('AddTask', {})}>
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Status filters */}
      <View style={s.filterRow}>
        {(['all', 'pending', 'in_progress', 'completed'] as FilterStatus[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category pills */}
      <FlatList
        horizontal
        data={[{ id: null, name: 'All', color: COLORS.primary } as any, ...categories]}
        keyExtractor={(c) => String(c.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.catPill, selectedCategory === item.id && { backgroundColor: item.color + '30', borderColor: item.color }]}
            onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
          >
            <View style={[s.catDot, { backgroundColor: item.color }]} />
            <Text style={[s.catPillText, { color: selectedCategory === item.id ? item.color : theme.textSecondary }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Task list */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Feather name="check-square" size={48} color={theme.textMuted} />
            <Text style={[s.emptyText, { color: theme.textMuted }]}>No tasks found</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => nav.navigate('AddTask', {})}>
              <Text style={s.emptyBtnText}>+ New Task</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const cat = categories.find((c) => c.id === item.categoryId);
          const priorityColor = COLORS.priority[item.priority];
          return (
            <TouchableOpacity
              style={s.taskCard}
              onPress={() => nav.navigate('TaskDetail', { taskId: item.id })}
              activeOpacity={0.85}
            >
              <View style={[s.priorityBar, { backgroundColor: priorityColor }]} />
              <View style={s.taskBody}>
                <View style={s.taskTop}>
                  <Text style={[s.taskTitle, { color: theme.text }, item.status === 'completed' && s.done]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.aiSuggested && (
                    <View style={s.aiTag}>
                      <Feather name="zap" size={10} color={COLORS.primary} />
                    </View>
                  )}
                </View>

                <View style={s.taskMeta}>
                  {cat && (
                    <View style={[s.catTag, { backgroundColor: cat.color + '20' }]}>
                      <Text style={[s.catTagText, { color: cat.color }]}>{cat.name}</Text>
                    </View>
                  )}
                  {item.dueDate && (
                    <View style={s.dueMeta}>
                      <Feather name="calendar" size={11} color={theme.textMuted} />
                      <Text style={[s.dueText, { color: theme.textMuted }]}>
                        {format(new Date(item.dueDate), 'MMM d')}
                      </Text>
                    </View>
                  )}
                  {item.subtasks.length > 0 && (
                    <Text style={[s.dueText, { color: theme.textMuted }]}>
                      {item.subtasks.filter((s) => s.completed).length}/{item.subtasks.length} subtasks
                    </Text>
                  )}
                </View>
              </View>

              {item.status !== 'completed' && (
                <TouchableOpacity style={s.checkBtn} onPress={() => completeTask(item.id)}>
                  <Feather name="circle" size={22} color={theme.border} />
                </TouchableOpacity>
              )}
              {item.status === 'completed' && (
                <View style={s.checkBtn}>
                  <Feather name="check-circle" size={22} color={COLORS.accentGreen} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    searchRow: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 10 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 14, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: theme.border },
    searchInput: { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 10 },
    addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
    filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: '#fff' },
    catList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
    catDot: { width: 8, height: 8, borderRadius: 4 },
    catPillText: { fontSize: 13, fontWeight: '600' },
    list: { padding: 16, paddingTop: 4, paddingBottom: 100 },
    taskCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, marginBottom: 10, overflow: 'hidden', alignItems: 'center' },
    priorityBar: { width: 4, alignSelf: 'stretch' },
    taskBody: { flex: 1, padding: 14 },
    taskTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    taskTitle: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 22 },
    done: { textDecorationLine: 'line-through', opacity: 0.5 },
    aiTag: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
    taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
    catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    catTagText: { fontSize: 11, fontWeight: '700' },
    dueMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    dueText: { fontSize: 11 },
    checkBtn: { paddingHorizontal: 14 },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, marginTop: 12, marginBottom: 20 },
    emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
