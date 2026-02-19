import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Droplets, Plus, Minus, Trophy, Target } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useZito } from '@/providers/ZitoProvider';

export default function HydrationScreen() {
  const { colors } = useTheme();
  const { profile, todayWater, addWater } = useZito();
  const fillAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const progress = useMemo(
    () => Math.min(todayWater / profile.dailyWaterGoal, 1),
    [todayWater, profile.dailyWaterGoal]
  );

  const isComplete = todayWater >= profile.dailyWaterGoal;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress, fillAnim]);

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addWater(1);
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [addWater, bounceAnim]);

  const handleRemove = useCallback(() => {
    if (todayWater <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addWater(-1);
  }, [todayWater, addWater]);

  const glassIcons = useMemo(() => {
    const icons: boolean[] = [];
    for (let i = 0; i < profile.dailyWaterGoal; i++) {
      icons.push(i < todayWater);
    }
    return icons;
  }, [todayWater, profile.dailyWaterGoal]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Hydration</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Stay on track with your water goal</Text>

          <View style={styles.glassContainer}>
            <Animated.View style={[styles.glassOuter, { borderColor: colors.blue + '30', transform: [{ scale: bounceAnim }] }]}>
              <View style={[styles.glassInner, { backgroundColor: colors.cardDark }]}>
                <Animated.View
                  style={[
                    styles.waterFill,
                    {
                      height: fillAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#00B4D8', '#0077B6']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </Animated.View>
                <View style={styles.glassOverlay}>
                  <Droplets color={isComplete ? '#fff' : colors.blue} size={32} />
                  <Text style={[styles.glassCount, { color: colors.textPrimary }, isComplete && styles.glassCountDone]}>
                    {todayWater}
                  </Text>
                  <Text style={[styles.glassLabel, { color: colors.textSecondary }, isComplete && styles.glassLabelDone]}>
                    of {profile.dailyWaterGoal}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {isComplete && (
              <View style={[styles.completeBadge, { backgroundColor: colors.warning + '15' }]}>
                <Trophy color={colors.warning} size={16} />
                <Text style={[styles.completeText, { color: colors.warning }]}>Daily Goal Reached!</Text>
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleRemove}
              activeOpacity={0.7}
              testID="water-minus"
            >
              <Minus color={colors.textSecondary} size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAdd}
              activeOpacity={0.8}
              testID="water-plus"
            >
              <LinearGradient
                colors={['#00B4D8', '#0077B6']}
                style={styles.addBtnGradient}
              >
                <Plus color="#fff" size={28} />
                <Text style={styles.addBtnText}>Add Glass</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Target color={colors.textTertiary} size={20} />
              <Text style={[styles.controlLabel, { color: colors.textTertiary }]}>{profile.dailyWaterGoal}</Text>
            </View>
          </View>

          <View style={styles.glassGrid}>
            {glassIcons.map((filled, i) => (
              <View
                key={i}
                style={[
                  styles.miniGlass,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  filled && { backgroundColor: colors.blue, borderColor: colors.blue },
                ]}
              >
                <Droplets
                  color={filled ? '#fff' : colors.textTertiary}
                  size={14}
                />
              </View>
            ))}
          </View>

          <View style={[styles.modeInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modeInfoTitle, { color: colors.textPrimary }]}>
              Mode {profile.selectedMode} Hydration Rule
            </Text>
            <Text style={[styles.modeInfoDesc, { color: colors.textSecondary }]}>
              Your daily target is {profile.dailyWaterGoal} glasses based on your
              mode and current phase.
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 30,
  },
  glassContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  glassOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  glassInner: {
    width: '100%',
    height: '100%',
    borderRadius: 86,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waterFill: {
    width: '100%',
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  glassCount: {
    fontSize: 42,
    fontWeight: '800' as const,
  },
  glassCountDone: {
    color: '#fff',
  },
  glassLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  glassLabelDone: {
    color: 'rgba(255,255,255,0.8)',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 30,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  addBtn: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 8,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  miniGlass: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modeInfo: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modeInfoTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  modeInfoDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
});
