import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  TrendingDown,
  Droplets,
  Target,
  Award,
  Zap,
  Scale,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useZito } from '@/providers/ZitoProvider';
import { getPortionTarget } from '@/constants/modes';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { profile, todayWater, todayMeals } = useZito();
  const router = useRouter();

  const portionBarAnim = useRef(new Animated.Value(0)).current;
  const waterBarAnim = useRef(new Animated.Value(0)).current;
  const streakBarAnim = useRef(new Animated.Value(0)).current;
  const deficitBarAnim = useRef(new Animated.Value(0)).current;
  const complianceBarAnim = useRef(new Animated.Value(0)).current;

  const portionTarget = useMemo(
    () => getPortionTarget(profile.selectedMode, profile.currentMonth),
    [profile.selectedMode, profile.currentMonth]
  );

  const daysSinceStart = useMemo(() => {
    return Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(profile.startDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  }, [profile.startDate]);

  const weightLost = useMemo(() => {
    if (profile.weightHistory.length < 2) return 0;
    return profile.weightHistory[0].weight - profile.currentWeight;
  }, [profile.weightHistory, profile.currentWeight]);

  const weightToGo = useMemo(
    () => Math.max(profile.currentWeight - profile.targetWeight, 0),
    [profile.currentWeight, profile.targetWeight]
  );

  const waterProgress = useMemo(
    () => Math.min(todayWater / profile.dailyWaterGoal, 1),
    [todayWater, profile.dailyWaterGoal]
  );

  const estimatedDailyDeficit = useMemo(() => {
    const mealsPerDay = Math.max(todayMeals.length, 1);
    const avgCalPerMeal = todayMeals.length > 0
      ? todayMeals.reduce((sum, m) => sum + m.estimatedCalories, 0) / todayMeals.length
      : 500;
    const savedPerMeal = avgCalPerMeal * (1 - portionTarget / 100);
    return Math.round(savedPerMeal * mealsPerDay);
  }, [todayMeals, portionTarget]);

  const estimatedWeeklyDeficit = useMemo(() => estimatedDailyDeficit * 7, [estimatedDailyDeficit]);

  const projectedLossPerWeek = useMemo(() => {
    return (estimatedWeeklyDeficit / 7700).toFixed(1);
  }, [estimatedWeeklyDeficit]);

  const projectedLoss30d = useMemo(() => {
    return ((estimatedWeeklyDeficit / 7700) * 4.3).toFixed(1);
  }, [estimatedWeeklyDeficit]);

  const projectedLoss90d = useMemo(() => {
    return ((estimatedWeeklyDeficit / 7700) * 13).toFixed(1);
  }, [estimatedWeeklyDeficit]);

  const portionAdherenceScore = useMemo(() => {
    if (todayMeals.length === 0) return 0;
    const avgPortion = todayMeals.reduce((sum, m) => sum + m.portionEaten, 0) / todayMeals.length;
    return Math.min(Math.round((portionTarget / Math.max(avgPortion, 1)) * 100), 100);
  }, [todayMeals, portionTarget]);

  const hydrationComplianceDays = useMemo(() => {
    return profile.streaks.water;
  }, [profile.streaks.water]);

  const streakMax = 30;
  const bestStreak = Math.max(
    profile.streaks.portion,
    profile.streaks.water,
    profile.streaks.eatingWindow
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(portionBarAnim, {
        toValue: Math.min(portionAdherenceScore / 100, 1),
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(waterBarAnim, {
        toValue: waterProgress,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(streakBarAnim, {
        toValue: Math.min(bestStreak / streakMax, 1),
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(deficitBarAnim, {
        toValue: Math.min(estimatedDailyDeficit / 1000, 1),
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(complianceBarAnim, {
        toValue: Math.min(hydrationComplianceDays / 30, 1),
        duration: 850,
        useNativeDriver: false,
      }),
    ]).start();
  }, [portionAdherenceScore, waterProgress, bestStreak, estimatedDailyDeficit, hydrationComplianceDays]);

  const weeklyWeights = useMemo(() => {
    const history = profile.weightHistory.slice(-7);
    if (history.length === 0) return [];
    const maxW = Math.max(...history.map((h) => h.weight));
    const minW = Math.min(...history.map((h) => h.weight));
    const range = maxW - minW || 1;
    return history.map((h) => ({
      date: h.date.slice(5),
      weight: h.weight,
      heightPct: ((h.weight - minW) / range) * 100,
    }));
  }, [profile.weightHistory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>Progress</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your fat-loss journey at a glance
          </Text>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: colors.success + '15' }]}>
                <TrendingDown color={colors.success} size={18} />
              </View>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {weightLost > 0 ? `-${weightLost.toFixed(1)}` : '0'} kg
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Lost</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: colors.orange + '15' }]}>
                <Target color={colors.orange} size={18} />
              </View>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {weightToGo.toFixed(1)} kg
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>To Goal</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: colors.blue + '15' }]}>
                <Calendar color={colors.blue} size={18} />
              </View>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {daysSinceStart}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Days</Text>
            </View>
          </View>

          <View style={[styles.projectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.projectionHeader}>
              <Zap color={colors.accent} size={18} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                AI Fat-Loss Projection
              </Text>
            </View>
            <View style={styles.projectionGrid}>
              <View style={[styles.projectionItem, { backgroundColor: colors.accentFaint }]}>
                <Text style={[styles.projectionValue, { color: colors.accent }]}>
                  ~{estimatedDailyDeficit}
                </Text>
                <Text style={[styles.projectionLabel, { color: colors.textSecondary }]}>
                  kcal/day deficit
                </Text>
              </View>
              <View style={[styles.projectionItem, { backgroundColor: colors.success + '10' }]}>
                <Text style={[styles.projectionValue, { color: colors.success }]}>
                  ~{projectedLossPerWeek} kg
                </Text>
                <Text style={[styles.projectionLabel, { color: colors.textSecondary }]}>
                  per week
                </Text>
              </View>
            </View>
            <View style={[styles.projectionGrid, { marginTop: 10 }]}>
              <View style={[styles.projectionItem, { backgroundColor: colors.blue + '10' }]}>
                <Text style={[styles.projectionValue, { color: colors.blue }]}>
                  ~{projectedLoss30d} kg
                </Text>
                <Text style={[styles.projectionLabel, { color: colors.textSecondary }]}>
                  in 30 days
                </Text>
              </View>
              <View style={[styles.projectionItem, { backgroundColor: colors.purple + '10' }]}>
                <Text style={[styles.projectionValue, { color: colors.purple }]}>
                  ~{projectedLoss90d} kg
                </Text>
                <Text style={[styles.projectionLabel, { color: colors.textSecondary }]}>
                  in 90 days
                </Text>
              </View>
            </View>
          </View>

          {weeklyWeights.length > 1 && (
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Weight Trend</Text>
              <View style={styles.chartContainer}>
                {weeklyWeights.map((w, i) => (
                  <View key={i} style={styles.chartBarWrap}>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${Math.max(w.heightPct, 10)}%`,
                            backgroundColor: i === weeklyWeights.length - 1 ? colors.accent : colors.accent + '50',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartBarLabel, { color: colors.textTertiary }]}>
                      {w.date}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Compliance Scores</Text>

            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Scale color={colors.accent} size={16} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Portion Adherence</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.accent }]}>{portionAdherenceScore}%</Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.cardElevated }]}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: colors.accent,
                    width: portionBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Droplets color={colors.blue} size={16} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Hydration Today</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.blue }]}>
                {todayWater}/{profile.dailyWaterGoal}
              </Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.cardElevated }]}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: colors.blue,
                    width: waterBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Droplets color={colors.pink} size={16} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Hydration Compliance</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.pink }]}>{hydrationComplianceDays}d</Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.cardElevated }]}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: colors.pink,
                    width: complianceBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Zap color={colors.orange} size={16} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AI Calorie Deficit</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.orange }]}>~{estimatedDailyDeficit} kcal</Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.cardElevated }]}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: colors.orange,
                    width: deficitBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          <View style={[styles.streaksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.streaksHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Active Streaks</Text>
              <TouchableOpacity onPress={() => router.push('/achievements' as never)} activeOpacity={0.7} style={styles.viewAllBtn}>
                <Text style={[styles.viewAllText, { color: colors.accent }]}>Achievements</Text>
                <ChevronRight color={colors.accent} size={14} />
              </TouchableOpacity>
            </View>
            <View>
              <View style={styles.streakItem}>
                <View style={[styles.streakIcon, { backgroundColor: colors.accent + '15' }]}>
                  <Target color={colors.accent} size={16} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={[styles.streakName, { color: colors.textPrimary }]}>Portion</Text>
                  <Text style={[styles.streakDays, { color: colors.textSecondary }]}>
                    {profile.streaks.portion} days
                  </Text>
                </View>
                <Award color={profile.streaks.portion >= 7 ? colors.warning : colors.textTertiary} size={20} />
              </View>
              <View style={[styles.streakDivider, { backgroundColor: colors.border }]} />
              <View style={styles.streakItem}>
                <View style={[styles.streakIcon, { backgroundColor: colors.blue + '15' }]}>
                  <Droplets color={colors.blue} size={16} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={[styles.streakName, { color: colors.textPrimary }]}>Water</Text>
                  <Text style={[styles.streakDays, { color: colors.textSecondary }]}>
                    {profile.streaks.water} days
                  </Text>
                </View>
                <Award color={profile.streaks.water >= 7 ? colors.warning : colors.textTertiary} size={20} />
              </View>
              <View style={[styles.streakDivider, { backgroundColor: colors.border }]} />
              <View style={styles.streakItem}>
                <View style={[styles.streakIcon, { backgroundColor: colors.purple + '15' }]}>
                  <Calendar color={colors.purple} size={16} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={[styles.streakName, { color: colors.textPrimary }]}>Eating Window</Text>
                  <Text style={[styles.streakDays, { color: colors.textSecondary }]}>
                    {profile.streaks.eatingWindow} days
                  </Text>
                </View>
                <Award color={profile.streaks.eatingWindow >= 7 ? colors.warning : colors.textTertiary} size={20} />
              </View>
            </View>
          </View>

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
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  projectionCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  projectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  projectionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  projectionItem: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  projectionValue: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  projectionLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  chartCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 14,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '70%',
    minHeight: 8,
    borderRadius: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    marginTop: 6,
  },
  metricsCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  metricDivider: {
    height: 1,
    marginVertical: 12,
  },
  streaksCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  streaksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  streakIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInfo: {
    flex: 1,
  },
  streakName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  streakDays: {
    fontSize: 13,
    marginTop: 2,
  },
  streakDivider: {
    height: 1,
    marginLeft: 48,
  },
  bottomSpacer: {
    height: 30,
  },
});
