import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Clock, Droplets, Moon, Sun, Play, RotateCcw, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useZito } from '@/providers/ZitoProvider';

interface WindowPhase {
  label: string;
  fasting: number;
  eating: number;
}

const PHASES: WindowPhase[] = [
  { label: '12:12', fasting: 12, eating: 12 },
  { label: '14:10', fasting: 14, eating: 10 },
  { label: '16:8', fasting: 16, eating: 8 },
  { label: '18:6', fasting: 18, eating: 6 },
];

type TimerState = 'idle' | 'fasting' | 'eating';

export default function WindowScreen() {
  const { colors } = useTheme();
  const { profile, addWater } = useZito();
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [waterReminders, setWaterReminders] = useState<number>(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = useMemo(() => PHASES[currentPhaseIndex], [currentPhaseIndex]);

  const totalSeconds = useMemo(() => {
    if (timerState === 'fasting') return currentPhase.fasting * 3600;
    if (timerState === 'eating') return currentPhase.eating * 3600;
    return currentPhase.fasting * 3600;
  }, [timerState, currentPhase]);

  const progress = useMemo(() => Math.min(elapsedSeconds / totalSeconds, 1), [elapsedSeconds, totalSeconds]);
  const remainingSeconds = useMemo(() => Math.max(totalSeconds - elapsedSeconds, 0), [totalSeconds, elapsedSeconds]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 300, useNativeDriver: false }).start();
  }, [progress]);

  useEffect(() => {
    if (timerState !== 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [timerState]);

  const startFasting = useCallback(() => {
    setTimerState('fasting');
    setElapsedSeconds(0);
    setWaterReminders(0);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next % 1800 === 0) {
          setWaterReminders((r) => r + 1);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        return next;
      });
    }, 1000);
  }, []);

  const switchToEating = useCallback(() => {
    setTimerState('eating');
    setElapsedSeconds(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const stopTimer = useCallback(() => {
    setTimerState('idle');
    setElapsedSeconds(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const drinkWater = useCallback(() => {
    addWater(1);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [addWater]);

  useEffect(() => {
    if (timerState === 'fasting' && elapsedSeconds >= totalSeconds) {
      switchToEating();
    }
    if (timerState === 'eating' && elapsedSeconds >= totalSeconds) {
      stopTimer();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }, [elapsedSeconds, totalSeconds, timerState]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stateColor = useMemo(() => {
    if (timerState === 'fasting') return colors.purple;
    if (timerState === 'eating') return colors.success;
    return colors.accent;
  }, [timerState, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Eating Window', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.phaseSelector}>
            {PHASES.map((phase, i) => (
              <TouchableOpacity
                key={phase.label}
                onPress={() => { if (timerState === 'idle') setCurrentPhaseIndex(i); }}
                style={[
                  styles.phaseChip,
                  {
                    backgroundColor: i === currentPhaseIndex ? stateColor + '15' : colors.card,
                    borderColor: i === currentPhaseIndex ? stateColor : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.phaseChipText, { color: i === currentPhaseIndex ? stateColor : colors.textSecondary }]}>
                  {phase.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Animated.View style={[styles.timerContainer, { transform: [{ scale: timerState !== 'idle' ? pulseAnim : 1 }] }]}>
            <View style={[styles.timerRing, { borderColor: stateColor + '25' }]}>
              <View style={[styles.timerInner, { backgroundColor: colors.card }]}>
                <View style={[styles.stateIndicator, { backgroundColor: stateColor + '15' }]}>
                  {timerState === 'fasting' ? <Moon color={stateColor} size={16} /> : timerState === 'eating' ? <Sun color={stateColor} size={16} /> : <Clock color={stateColor} size={16} />}
                  <Text style={[styles.stateText, { color: stateColor }]}>
                    {timerState === 'idle' ? 'Ready' : timerState === 'fasting' ? 'Fasting' : 'Eating'}
                  </Text>
                </View>
                <Text style={[styles.timerValue, { color: colors.textPrimary }]}>
                  {timerState === 'idle' ? formatTime(currentPhase.fasting * 3600) : formatTime(remainingSeconds)}
                </Text>
                <Text style={[styles.timerSubLabel, { color: colors.textTertiary }]}>
                  {timerState === 'idle' ? 'tap start to begin' : 'remaining'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {timerState !== 'idle' && (
            <View style={[styles.progressContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.progressBarBg, { backgroundColor: colors.cardElevated }]}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: stateColor,
                      width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {(progress * 100).toFixed(0)}% complete
              </Text>
            </View>
          )}

          <View style={styles.controls}>
            {timerState === 'idle' ? (
              <TouchableOpacity onPress={startFasting} style={[styles.startButton, { backgroundColor: colors.accent }]} activeOpacity={0.8}>
                <Play color="#fff" size={22} />
                <Text style={styles.startButtonText}>Start Fast</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.controlRow}>
                <TouchableOpacity onPress={stopTimer} style={[styles.controlBtn, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '25' }]} activeOpacity={0.8}>
                  <RotateCcw color={colors.danger} size={20} />
                  <Text style={[styles.controlBtnText, { color: colors.danger }]}>Reset</Text>
                </TouchableOpacity>
                {timerState === 'fasting' && (
                  <TouchableOpacity onPress={switchToEating} style={[styles.controlBtn, { backgroundColor: colors.success + '12', borderColor: colors.success + '25' }]} activeOpacity={0.8}>
                    <Sun color={colors.success} size={20} />
                    <Text style={[styles.controlBtnText, { color: colors.success }]}>Start Eating</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {timerState === 'fasting' && (
            <View style={[styles.waterCard, { backgroundColor: colors.blue + '08', borderColor: colors.blue + '20' }]}>
              <View style={styles.waterHeader}>
                <Droplets color={colors.blue} size={20} />
                <Text style={[styles.waterTitle, { color: colors.blue }]}>Stay Hydrated</Text>
              </View>
              <Text style={[styles.waterDesc, { color: colors.textSecondary }]}>
                Drink water during fasting to stay full and maintain energy. {waterReminders > 0 ? `${waterReminders} reminders sent.` : ''}
              </Text>
              <TouchableOpacity onPress={drinkWater} style={[styles.waterButton, { backgroundColor: colors.blue }]} activeOpacity={0.7}>
                <Droplets color="#fff" size={16} />
                <Text style={styles.waterButtonText}>+1 Glass</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.scheduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.scheduleTitle, { color: colors.textPrimary }]}>Phase Progression</Text>
            {PHASES.map((phase, i) => (
              <View key={phase.label} style={styles.scheduleRow}>
                <View style={[styles.scheduleDot, { backgroundColor: i <= currentPhaseIndex ? colors.accent : colors.cardElevated, borderColor: i === currentPhaseIndex ? colors.accent : colors.border }]} />
                <View style={styles.scheduleInfo}>
                  <Text style={[styles.scheduleLabel, { color: i === currentPhaseIndex ? colors.accent : colors.textPrimary }]}>{phase.label}</Text>
                  <Text style={[styles.scheduleDesc, { color: colors.textSecondary }]}>
                    {phase.fasting}h fast · {phase.eating}h eat
                  </Text>
                </View>
                {i === currentPhaseIndex && (
                  <View style={[styles.currentBadge, { backgroundColor: colors.accent + '15' }]}>
                    <Text style={[styles.currentBadgeText, { color: colors.accent }]}>Current</Text>
                  </View>
                )}
                {i < PHASES.length - 1 && (
                  <View style={[styles.scheduleLine, { backgroundColor: i < currentPhaseIndex ? colors.accent : colors.border }]} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  phaseSelector: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  phaseChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  phaseChipText: { fontSize: 14, fontWeight: '700' as const },
  timerContainer: { alignItems: 'center', marginBottom: 24 },
  timerRing: { width: 240, height: 240, borderRadius: 120, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  timerInner: { width: 210, height: 210, borderRadius: 105, alignItems: 'center', justifyContent: 'center' },
  stateIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 8 },
  stateText: { fontSize: 13, fontWeight: '700' as const },
  timerValue: { fontSize: 36, fontWeight: '900' as const, letterSpacing: -1 },
  timerSubLabel: { fontSize: 12, marginTop: 4 },
  progressContainer: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 20 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 12, textAlign: 'center' as const },
  controls: { alignItems: 'center', marginBottom: 24 },
  startButton: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 50 },
  startButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' as const },
  controlRow: { flexDirection: 'row', gap: 12 },
  controlBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  controlBtnText: { fontSize: 14, fontWeight: '600' as const },
  waterCard: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 20, gap: 10 },
  waterHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waterTitle: { fontSize: 16, fontWeight: '700' as const },
  waterDesc: { fontSize: 13, lineHeight: 19 },
  waterButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  waterButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' as const },
  scheduleCard: { borderRadius: 18, padding: 18, borderWidth: 1, marginBottom: 16 },
  scheduleTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 16 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, position: 'relative' as const },
  scheduleDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scheduleInfo: { flex: 1 },
  scheduleLabel: { fontSize: 15, fontWeight: '700' as const },
  scheduleDesc: { fontSize: 12, marginTop: 2 },
  currentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currentBadgeText: { fontSize: 11, fontWeight: '700' as const },
  scheduleLine: { position: 'absolute', left: 13, top: 30, width: 2, height: 20 },
  bottomSpacer: { height: 40 },
});
