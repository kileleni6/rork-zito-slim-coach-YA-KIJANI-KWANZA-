import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Scale,
  Target,
  Zap,
  ChevronRight,
  RotateCcw,
  TrendingDown,
  Calendar,
  Sun,
  Moon,
  Info,
} from 'lucide-react-native';
import { useTheme, ThemeMode } from '@/providers/ThemeProvider';
import { useZito } from '@/providers/ZitoProvider';
import { useAuth } from '@/providers/AuthProvider';
import { MODES, getPortionTarget, getWaterGoalForMode } from '@/constants/modes';
import { ZitoMode } from '@/types';

export default function ProfileScreen() {
  const { colors, themeMode, setTheme } = useTheme();
  const { profile, updateProfile } = useZito();
  const { user, logOut, isSigningOut } = useAuth();
  const [editingWeight, setEditingWeight] = useState<boolean>(false);
  const [newWeight, setNewWeight] = useState<string>(String(profile.currentWeight));

  const currentMode = MODES.find((m) => m.id === profile.selectedMode);
  const portionTarget = getPortionTarget(profile.selectedMode, profile.currentMonth);

  const handleSaveWeight = useCallback(() => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w < 30 || w > 300) {
      Alert.alert('Invalid weight', 'Please enter a valid weight.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({
      currentWeight: w,
      weightHistory: [
        ...profile.weightHistory,
        { date: new Date().toISOString().split('T')[0], weight: w },
      ],
    });
    setEditingWeight(false);
  }, [newWeight, profile.weightHistory, updateProfile]);

  const handleModeChange = useCallback((mode: ZitoMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const waterGoal = getWaterGoalForMode(mode, profile.currentMonth);
    updateProfile({ selectedMode: mode, dailyWaterGoal: waterGoal });
  }, [profile.currentMonth, updateProfile]);

  const handleResetProgress = useCallback(() => {
    Alert.alert('Reset Progress', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          updateProfile({
            streaks: { portion: 0, water: 0, eatingWindow: 0 },
            weightHistory: [
              { date: new Date().toISOString().split('T')[0], weight: profile.currentWeight },
            ],
            currentMonth: 1,
            startDate: new Date().toISOString().split('T')[0],
          });
        },
      },
    ]);
  }, [profile.currentWeight, updateProfile]);

  const handleThemeChange = useCallback((mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(mode);
  }, [setTheme]);

  const daysSinceStart = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(profile.startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun color={themeMode === 'light' ? colors.accent : colors.textTertiary} size={18} /> },
    { mode: 'dark', label: 'Dark', icon: <Moon color={themeMode === 'dark' ? colors.accent : colors.textTertiary} size={18} /> },
    { mode: 'system', label: 'System', icon: <Zap color={themeMode === 'system' ? colors.accent : colors.textTertiary} size={18} /> },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>

          <View style={styles.profileHeader}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {(profile.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{profile.name || 'User'}</Text>
            <View style={[styles.profileBadge, { backgroundColor: colors.accentFaint }]}>
              <Zap color={colors.accent} size={14} />
              <Text style={[styles.profileBadgeText, { color: colors.accent }]}>
                Mode {profile.selectedMode} · {currentMode?.title}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Calendar color={colors.blue} size={18} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{daysSinceStart}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Days Active</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TrendingDown color={colors.success} size={18} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{portionTarget}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Portion</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Target color={colors.orange} size={18} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>M{profile.currentMonth}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Phase</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Body Stats</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Scale color={colors.textSecondary} size={18} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Current Weight</Text>
                </View>
                {editingWeight ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.editInput, { backgroundColor: colors.cardElevated, color: colors.textPrimary }]}
                      value={newWeight}
                      onChangeText={setNewWeight}
                      keyboardType="numeric"
                      autoFocus
                      testID="profile-weight-input"
                    />
                    <TouchableOpacity
                      onPress={handleSaveWeight}
                      style={[styles.saveBtn, { backgroundColor: colors.accent }]}
                    >
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setNewWeight(String(profile.currentWeight));
                      setEditingWeight(true);
                    }}
                  >
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                      {profile.currentWeight} kg{' '}
                      <ChevronRight color={colors.textTertiary} size={14} />
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Target color={colors.textSecondary} size={18} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Target Weight</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{profile.targetWeight} kg</Text>
              </View>
              <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Scale color={colors.textSecondary} size={18} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Height</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{profile.height} cm</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
            <View style={[styles.themeRow]}>
              {themeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    themeMode === opt.mode && { borderColor: colors.accent, backgroundColor: colors.accentFaint },
                  ]}
                  onPress={() => handleThemeChange(opt.mode)}
                  activeOpacity={0.7}
                  testID={`theme-${opt.mode}`}
                >
                  {opt.icon}
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: colors.textSecondary },
                      themeMode === opt.mode && { color: colors.accent },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Switch Mode</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modeScroll}
            >
              {MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    profile.selectedMode === mode.id && {
                      borderColor: mode.color,
                      backgroundColor: mode.color + '15',
                    },
                  ]}
                  onPress={() => handleModeChange(mode.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      { color: colors.textSecondary },
                      profile.selectedMode === mode.id && { color: mode.color },
                    ]}
                  >
                    {mode.id}
                  </Text>
                  <Text
                    style={[
                      styles.modeChipLabel,
                      { color: colors.textTertiary },
                      profile.selectedMode === mode.id && { color: mode.color },
                    ]}
                    numberOfLines={1}
                  >
                    {mode.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Settings</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.settingsRow} activeOpacity={0.6}>
                <View style={styles.settingsLeft}>
                  <View style={[styles.settingsIconWrap, { backgroundColor: colors.blue + '15' }]}>
                    <Zap color={colors.blue} size={16} />
                  </View>
                  <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>Notifications</Text>
                </View>
                <ChevronRight color={colors.textTertiary} size={18} />
              </TouchableOpacity>
              <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.settingsRow} activeOpacity={0.6}>
                <View style={styles.settingsLeft}>
                  <View style={[styles.settingsIconWrap, { backgroundColor: colors.accent + '15' }]}>
                    <Target color={colors.accent} size={16} />
                  </View>
                  <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>Privacy</Text>
                </View>
                <ChevronRight color={colors.textTertiary} size={18} />
              </TouchableOpacity>
              <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.settingsRow} activeOpacity={0.6}>
                <View style={styles.settingsLeft}>
                  <View style={[styles.settingsIconWrap, { backgroundColor: colors.orange + '15' }]}>
                    <Info color={colors.orange} size={16} />
                  </View>
                  <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>Help & Support</Text>
                </View>
                <ChevronRight color={colors.textTertiary} size={18} />
              </TouchableOpacity>
              <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.settingsRow} activeOpacity={0.6}>
                <View style={styles.settingsLeft}>
                  <View style={[styles.settingsIconWrap, { backgroundColor: colors.purple + '15' }]}>
                    <Info color={colors.purple} size={16} />
                  </View>
                  <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>About ZITO</Text>
                </View>
                <ChevronRight color={colors.textTertiary} size={18} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.dangerBtn, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '25' }]}
              onPress={handleResetProgress}
              activeOpacity={0.7}
              testID="profile-reset"
            >
              <RotateCcw color={colors.danger} size={18} />
              <Text style={[styles.dangerBtnText, { color: colors.danger }]}>Reset All Progress</Text>
            </TouchableOpacity>
          </View>

          {user?.email ? (
            <Text style={[styles.emailText, { color: colors.textTertiary }]}>{user.email}</Text>
          ) : null}

          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.signOutBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => logOut(),
                  },
                ]);
              }}
              activeOpacity={0.7}
              disabled={isSigningOut}
              testID="profile-signout"
            >
              <ChevronRight color={colors.textSecondary} size={18} />
              <Text style={[styles.signOutText, { color: colors.textPrimary }]}>
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.versionText, { color: colors.textTertiary }]}>ZITO v1.0.0</Text>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginTop: 8,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  profileBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  infoDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    width: 70,
    textAlign: 'center',
  },
  saveBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modeScroll: {
    gap: 10,
    paddingRight: 20,
  },
  modeChip: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 90,
    gap: 4,
  },
  modeChipText: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  modeChipLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
  },
  dangerBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  emailText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 16,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 4,
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 30,
  },
});
