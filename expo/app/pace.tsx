import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Play, Pause, RotateCcw, Award } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';

const BITE_INTERVAL = 25;
const MEAL_TARGET_MINUTES = 15;

type PaceState = 'idle' | 'active' | 'paused' | 'complete';

export default function PaceScreen() {
  const { colors } = useTheme();
  const [state, setState] = useState<PaceState>('idle');
  const [biteTimer, setBiteTimer] = useState<number>(BITE_INTERVAL);
  const [mealSeconds, setMealSeconds] = useState<number>(0);
  const [biteCount, setBiteCount] = useState<number>(0);
  const [totalBites, setTotalBites] = useState<number>(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const biteProgress = useMemo(() => biteTimer / BITE_INTERVAL, [biteTimer]);
  const mealMinutes = useMemo(() => Math.floor(mealSeconds / 60), [mealSeconds]);
  const mealSecs = useMemo(() => mealSeconds % 60, [mealSeconds]);
  const mealProgress = useMemo(() => Math.min(mealSeconds / (MEAL_TARGET_MINUTES * 60), 1), [mealSeconds]);

  const paceScore = useMemo(() => {
    if (totalBites === 0) return 0;
    const avgInterval = mealSeconds / totalBites;
    if (avgInterval >= 20 && avgInterval <= 35) return 100;
    if (avgInterval >= 15 && avgInterval <= 40) return 75;
    if (avgInterval >= 10) return 50;
    return 25;
  }, [totalBites, mealSeconds]);

  const paceLabel = useMemo(() => {
    if (paceScore >= 90) return 'Excellent';
    if (paceScore >= 70) return 'Good';
    if (paceScore >= 40) return 'Needs Work';
    return 'Too Fast';
  }, [paceScore]);

  const paceColor = useMemo(() => {
    if (paceScore >= 90) return colors.success;
    if (paceScore >= 70) return colors.accent;
    if (paceScore >= 40) return colors.orange;
    return colors.danger;
  }, [paceScore, colors]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  useEffect(() => {
    Animated.timing(ringAnim, { toValue: biteProgress, duration: 200, useNativeDriver: false }).start();
  }, [biteProgress]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  const startTimer = useCallback(() => {
    setState('active');
    intervalRef.current = setInterval(() => {
      setBiteTimer((prev) => {
        if (prev <= 1) {
          triggerHaptic();
          return BITE_INTERVAL;
        }
        return prev - 1;
      });
      setMealSeconds((prev) => prev + 1);
    }, 1000);
  }, [triggerHaptic]);

  const pauseTimer = useCallback(() => {
    setState('paused');
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    setState('idle');
    setBiteTimer(BITE_INTERVAL);
    setMealSeconds(0);
    setBiteCount(0);
    setTotalBites(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const recordBite = useCallback(() => {
    if (state !== 'active') return;
    setBiteCount((prev) => prev + 1);
    setTotalBites((prev) => prev + 1);
    setBiteTimer(BITE_INTERVAL);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [state]);

  const finishMeal = useCallback(() => {
    setState('complete');
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const ringSize = 220;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Eating Pace', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary }} />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {state === 'complete' ? (
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Award color={paceColor} size={48} />
              <Text style={[styles.summaryScore, { color: paceColor }]}>{paceScore}/100</Text>
              <Text style={[styles.summaryLabel, { color: colors.textPrimary }]}>{paceLabel} Pace</Text>
              <View style={styles.summaryStats}>
                <View style={[styles.summaryStat, { backgroundColor: colors.cardElevated }]}>
                  <Text style={[styles.summaryStatValue, { color: colors.textPrimary }]}>{totalBites}</Text>
                  <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Bites</Text>
                </View>
                <View style={[styles.summaryStat, { backgroundColor: colors.cardElevated }]}>
                  <Text style={[styles.summaryStatValue, { color: colors.textPrimary }]}>
                    {mealMinutes}:{mealSecs.toString().padStart(2, '0')}
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Duration</Text>
                </View>
                <View style={[styles.summaryStat, { backgroundColor: colors.cardElevated }]}>
                  <Text style={[styles.summaryStatValue, { color: colors.textPrimary }]}>
                    {totalBites > 0 ? (mealSeconds / totalBites).toFixed(0) : 0}s
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Avg/Bite</Text>
                </View>
              </View>
              <TouchableOpacity onPress={resetTimer} style={[styles.resetButton, { backgroundColor: colors.accent }]} activeOpacity={0.8}>
                <RotateCcw color="#fff" size={18} />
                <Text style={styles.resetButtonText}>New Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.timerSection}>
              <Animated.View style={[styles.ringContainer, { transform: [{ scale: state === 'active' ? pulseAnim : 1 }] }]}>
                <View style={[styles.ringOuter, { borderColor: colors.border }]}>
                  <View style={[styles.ringProgress, { borderColor: biteTimer <= 5 ? colors.danger : colors.accent }]} />
                  <View style={[styles.ringInner, { backgroundColor: colors.card }]}>
                    <Text style={[styles.timerValue, { color: biteTimer <= 5 ? colors.danger : colors.textPrimary }]}>
                      {biteTimer}
                    </Text>
                    <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
                      {state === 'idle' ? 'seconds' : biteTimer <= 5 ? 'BITE NOW' : 'next bite'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            <View style={[styles.mealTimerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.mealTimerRow}>
                <Award color={colors.accent} size={18} />
                <Text style={[styles.mealTimerLabel, { color: colors.textSecondary }]}>Meal Duration</Text>
                <Text style={[styles.mealTimerValue, { color: colors.textPrimary }]}>
                  {mealMinutes}:{mealSecs.toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={[styles.mealProgressBg, { backgroundColor: colors.cardElevated }]}>
                <View style={[styles.mealProgressFill, { width: `${mealProgress * 100}%`, backgroundColor: mealProgress >= 1 ? colors.success : colors.accent }]} />
              </View>
              <Text style={[styles.mealTargetText, { color: colors.textTertiary }]}>
                Target: {MEAL_TARGET_MINUTES} min {mealProgress >= 1 ? '✓' : ''}
              </Text>
            </View>

            <View style={styles.biteCountRow}>
              <View style={[styles.biteCountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Award color={colors.orange} size={18} />
                <Text style={[styles.biteCountValue, { color: colors.textPrimary }]}>{totalBites}</Text>
                <Text style={[styles.biteCountLabel, { color: colors.textSecondary }]}>Bites</Text>
              </View>
            </View>

            <View style={styles.controls}>
              {state === 'idle' ? (
                <TouchableOpacity onPress={startTimer} style={[styles.primaryButton, { backgroundColor: colors.accent }]} activeOpacity={0.8}>
                  <Play color="#fff" size={22} />
                  <Text style={styles.primaryButtonText}>Start Meal</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    onPress={state === 'active' ? pauseTimer : startTimer}
                    style={[styles.controlButton, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
                    activeOpacity={0.8}
                  >
                    {state === 'active' ? <Pause color={colors.textPrimary} size={20} /> : <Play color={colors.textPrimary} size={20} />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={recordBite} style={[styles.biteButton, { backgroundColor: colors.accent }]} activeOpacity={0.7}>
                    <Text style={styles.biteButtonText}>Bite</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={finishMeal} style={[styles.controlButton, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]} activeOpacity={0.8}>
                    <Award color={colors.success} size={20} />
                  </TouchableOpacity>
                </View>
              )}
              {state !== 'idle' && (
                <TouchableOpacity onPress={resetTimer} style={styles.resetLink} activeOpacity={0.7}>
                  <RotateCcw color={colors.textTertiary} size={14} />
                  <Text style={[styles.resetLinkText, { color: colors.textTertiary }]}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  timerSection: { alignItems: 'center', marginBottom: 28 },
  ringContainer: { alignItems: 'center', justifyContent: 'center' },
  ringOuter: { width: 220, height: 220, borderRadius: 110, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  ringProgress: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 4 },
  ringInner: { width: 190, height: 190, borderRadius: 95, alignItems: 'center', justifyContent: 'center' },
  timerValue: { fontSize: 64, fontWeight: '900' as const, letterSpacing: -2 },
  timerLabel: { fontSize: 14, fontWeight: '600' as const, marginTop: 2 },
  mealTimerCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  mealTimerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  mealTimerLabel: { flex: 1, fontSize: 14 },
  mealTimerValue: { fontSize: 18, fontWeight: '800' as const },
  mealProgressBg: { height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  mealProgressFill: { height: 5, borderRadius: 3 },
  mealTargetText: { fontSize: 12 },
  biteCountRow: { alignItems: 'center', marginBottom: 24 },
  biteCountCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  biteCountValue: { fontSize: 22, fontWeight: '800' as const },
  biteCountLabel: { fontSize: 13 },
  controls: { alignItems: 'center', gap: 16 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 50 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' as const },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  controlButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  biteButton: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  biteButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' as const },
  resetLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resetLinkText: { fontSize: 13 },
  summaryContainer: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  summaryCard: { borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, gap: 8 },
  summaryScore: { fontSize: 48, fontWeight: '900' as const, letterSpacing: -1 },
  summaryLabel: { fontSize: 20, fontWeight: '700' as const },
  summaryStats: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 },
  summaryStat: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, gap: 4 },
  summaryStatValue: { fontSize: 18, fontWeight: '800' as const },
  summaryStatLabel: { fontSize: 11, fontWeight: '600' as const },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50 },
  resetButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
});
