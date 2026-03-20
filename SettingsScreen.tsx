import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants';
import { AppSettings } from '../types';
import * as storage from '../services/storage';
import { requestNotificationPermissions } from '../services/notifications';

export default function SettingsScreen() {
  const nav = useNavigation<any>();
  const { theme } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storage.getSettings().then(setSettings);
  }, []);

  const update = async (changes: Partial<AppSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...changes };
    setSettings(updated);
    await storage.saveSettings(changes);
  };

  const handleNotifToggle = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Please enable notifications in device settings.');
        return;
      }
    }
    await update({ notificationsEnabled: val });
  };

  const testApiKey = async () => {
    if (!settings?.anthropicApiKey) {
      Alert.alert('No API Key', 'Please enter your Anthropic API key first.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      if (res.ok) {
        Alert.alert('✅ API Key Valid', 'Your Anthropic API key is working correctly!');
      } else {
        const err = await res.json();
        Alert.alert('❌ Invalid Key', err?.error?.message || 'API key test failed.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Check your connection.');
    }
    setSaving(false);
  };

  if (!settings) return null;
  const s = styles(theme);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* AI Configuration */}
      <SectionHeader title="🤖 AI Configuration" theme={theme} />

      <View style={s.card}>
        <Text style={s.label}>Anthropic API Key</Text>
        <Text style={s.sublabel}>Required for AI features. Get yours at console.anthropic.com</Text>
        <View style={s.apiKeyRow}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={settings.anthropicApiKey}
            onChangeText={(v) => update({ anthropicApiKey: v })}
            placeholder="sk-ant-..."
            placeholderTextColor={theme.textMuted}
            secureTextEntry={!apiKeyVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.visBtn} onPress={() => setApiKeyVisible(!apiKeyVisible)}>
            <Feather name={apiKeyVisible ? 'eye-off' : 'eye'} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.testBtn} onPress={testApiKey}>
          <Text style={s.testBtnText}>{saving ? 'Testing...' : 'Test API Key'}</Text>
        </TouchableOpacity>
      </View>

      <ToggleRow
        label="AI Assistant"
        sub="Enable AI-powered features"
        value={settings.aiAssistEnabled}
        onToggle={(v) => update({ aiAssistEnabled: v })}
        theme={theme}
      />

      <ToggleRow
        label="Smart Reminders"
        sub="AI suggests optimal reminder times"
        value={settings.smartReminders}
        onToggle={(v) => update({ smartReminders: v })}
        theme={theme}
      />

      {/* Notifications */}
      <SectionHeader title="🔔 Notifications" theme={theme} />

      <ToggleRow
        label="Enable Notifications"
        sub="Get reminders for your tasks"
        value={settings.notificationsEnabled}
        onToggle={handleNotifToggle}
        theme={theme}
      />

      <ToggleRow
        label="Daily Digest"
        sub="Morning summary of your tasks"
        value={settings.dailyDigest}
        onToggle={(v) => update({ dailyDigest: v })}
        theme={theme}
      />

      {settings.dailyDigest && (
        <View style={[s.card, s.inlineRow]}>
          <Text style={s.label}>Digest Time</Text>
          <TextInput
            style={[s.input, { width: 80, textAlign: 'center' }]}
            value={settings.dailyDigestTime}
            onChangeText={(v) => update({ dailyDigestTime: v })}
            placeholder="08:00"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      )}

      {/* Tasks */}
      <SectionHeader title="✅ Tasks" theme={theme} />

      <View style={s.card}>
        <Text style={s.label}>Default Priority</Text>
        <View style={s.row}>
          {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.priorityBtn, settings.defaultPriority === p && { backgroundColor: COLORS.priority[p] }]}
              onPress={() => update({ defaultPriority: p })}
            >
              <Text style={[s.priorityText, { color: settings.defaultPriority === p ? '#fff' : COLORS.priority[p] }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Danger Zone */}
      <SectionHeader title="⚠️ Data" theme={theme} />
      <TouchableOpacity
        style={s.dangerBtn}
        onPress={() =>
          Alert.alert('Clear All Data', 'This will delete ALL tasks and settings. This cannot be undone!', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete Everything', style: 'destructive', onPress: () => storage.clearAllData() },
          ])
        }
      >
        <Feather name="trash-2" size={16} color={COLORS.accent} />
        <Text style={s.dangerText}>Clear All Data</Text>
      </TouchableOpacity>

      <Text style={s.version}>AI To-Do v1.0.0 · Built with Claude</Text>
    </ScrollView>
  );
}

function SectionHeader({ title, theme }: any) {
  return <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 8, paddingHorizontal: 4 }}>{title}</Text>;
}

function ToggleRow({ label, sub, value, onToggle, theme }: any) {
  return (
    <View style={[{ backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
        {sub && <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{sub}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle} thumbColor={COLORS.primary} trackColor={{ true: COLORS.primary + '66', false: theme.border }} />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { padding: 16, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
    card: { backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 8 },
    inlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: theme.text, fontSize: 15, fontWeight: '600', marginBottom: 4 },
    sublabel: { color: theme.textMuted, fontSize: 12, marginBottom: 10, lineHeight: 18 },
    apiKeyRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: { backgroundColor: theme.bg, color: theme.text, borderRadius: 10, padding: 10, fontSize: 14, borderWidth: 1, borderColor: theme.border },
    visBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    testBtn: { marginTop: 10, backgroundColor: COLORS.primary + '20', borderRadius: 10, padding: 10, alignItems: 'center' },
    testBtnText: { color: COLORS.primary, fontWeight: '700' },
    row: { flexDirection: 'row', gap: 6 },
    priorityBtn: { flex: 1, padding: 8, borderRadius: 10, borderWidth: 1.5, borderColor: theme.border, alignItems: 'center' },
    priorityText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.accent + '15', borderRadius: 14, padding: 14, marginBottom: 8 },
    dangerText: { color: COLORS.accent, fontWeight: '700', fontSize: 15 },
    version: { color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 20 },
  });
