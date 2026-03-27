import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Droplets,
  Flame,
  Target,
  TrendingDown,
  Zap,
  Award,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useZito } from '@/providers/ZitoProvider';
import { MODES, getPortionTarget } from '@/constants/modes';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile, todayWater, todayMeals } = useZito();
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const waterAnim = useRef(new Animated.Value(0)).current;

  const currentMode = useMemo(
    () => MODES.find((m) => m.id === profile.selectedMode),
    [profile.selectedMode]
  );

  const portionTarget = useMemo(
    () => getPortionTarget(profile.selectedMode, profile.currentMonth),
    [profile.selectedMode, profile.currentMonth]
  );

  const waterProgress = useMemo(
    () => Math.min(todayWater / profile.dailyWaterGoal, 1),
    [todayWater, profile.dailyWaterGoal]
  );

  const weightLost = useMemo(() => {
    if (profile.weightHistory.length < 2) return 0;
    return profile.weightHistory[0].weight - profile.currentWeight;
  }, [profile.weightHistory, profile.currentWeight]);

  const weightToGo = useMemo(
    () => Math.max(profile.currentWeight - profile.targetWeight, 0),
    [profile.currentWeight, profile.targetWeight]
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(waterAnim, {
        toValue: waterProgress,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  }, [waterProgress, progressAnim, waterAnim]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerSection}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.name || 'User'}</Text>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: colors.orange + '15' }]}>
              <Flame color={colors.orange} size={16} />
              <Text style={[styles.streakText, { color: colors.orange }]}>{profile.streaks.portion}d</Text>
            </View>
          </View>

          <LinearGradient
            colors={[colors.accent + '15', colors.accentDark + '08']}
            style={[styles.heroCard, { borderColor: colors.accent + '20' }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroModeTag}>
                <Zap color={colors.accent} size={14} />
                <Text style={[styles.heroModeText, { color: colors.accent }]}>
                  Mode {profile.selectedMode} · {currentMode?.title}
                </Text>
              </View>
              <Text style={[styles.heroMonth, { color: colors.textSecondary, backgroundColor: colors.cardElevated }]}>
                Month {profile.currentMonth}
              </Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{portionTarget.toFixed(0)}%</Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Portion Target</Text>
              </View>
              <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
              <View style={styles.heroStat}>
                <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{todayMeals.length}</Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Meals Today</Text>
              </View>
              <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
              <View style={styles.heroStat}>
                <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>
                  {todayWater}/{profile.dailyWaterGoal}
                </Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Water</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.progressSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Progress</Text>
            <View style={styles.progressCards}>
              <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.progressCardHeader}>
                  <Droplets color={colors.blue} size={18} />
                  <Text style={[styles.progressCardTitle, { color: colors.textPrimary }]}>Hydration</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.cardElevated }]}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.blue,
                        width: waterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressCardValue, { color: colors.textSecondary }]}>
                  {todayWater} of {profile.dailyWaterGoal} glasses
                </Text>
              </View>

              <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.progressCardHeader}>
                  <Zap color={colors.accent} size={18} />
                  <Text style={[styles.progressCardTitle, { color: colors.textPrimary }]}>Meals</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.cardElevated }]}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.accent,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${Math.min((todayMeals.length / 3) * 100, 100)}%`],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressCardValue, { color: colors.textSecondary }]}>
                  {todayMeals.length} meals logged
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TrendingDown color={colors.success} size={20} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {weightLost > 0 ? `-${weightLost.toFixed(1)}` : '0'} kg
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lost So Far</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Target color={colors.orange} size={20} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{weightToGo.toFixed(1)} kg</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>To Goal</Text>
            </View>
          </View>

          <View style={styles.toolsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Tools</Text>
            <View style={styles.toolsGrid}>
              <TouchableOpacity
                onPress={() => router.push('/plate' as never)}
                style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.success + '15' }]}>
                  <Target color={colors.success} size={20} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Plate</Text>
                <Text style={[styles.toolDesc, { color: colors.textTertiary }]}>Visualize</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/pace' as never)}
                style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.orange + '15' }]}>
                  <Clock color={colors.orange} size={20} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Pace</Text>
                <Text style={[styles.toolDesc, { color: colors.textTertiary }]}>Bite Timer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/window' as never)}
                style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.purple + '15' }]}>
                  <Clock color={colors.purple} size={20} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Window</Text>
                <Text style={[styles.toolDesc, { color: colors.textTertiary }]}>Fasting</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/achievements' as never)}
                style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.warning + '15' }]}>
                  <Award color={colors.warning} size={20} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Awards</Text>
                <Text style={[styles.toolDesc, { color: colors.textTertiary }]}>Badges</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tipsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Tips</Text>
            <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Award color={colors.warning} size={20} />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Drink before meals</Text>
                <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>
                  Having a glass of water 15 min before eating helps reduce portion size naturally.
                </Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={18} />
            </View>
            <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Award color={colors.accent} size={20} />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Protein first</Text>
                <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>
                  Start each meal with protein to boost satiety and preserve muscle during fat loss.
                </Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={18} />
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
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  name: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroModeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroModeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  heroMonth: {
    fontSize: 13,
    fontWeight: '600' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  heroDivider: {
    width: 1,
    height: 36,
  },
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 14,
  },
  progressCards: {
    gap: 12,
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressCardValue: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  toolsSection: {
    marginBottom: 24,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  toolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  toolDesc: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  bottomSpacer: {
    height: 20,
  },
});
