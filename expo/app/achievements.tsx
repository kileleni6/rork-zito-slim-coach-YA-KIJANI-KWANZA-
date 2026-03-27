import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Trophy,
  Droplets,
  Target,
  Clock,
  Zap,
  Award,
  TrendingDown,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useZito } from '@/providers/ZitoProvider';

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  category: 'streak' | 'milestone' | 'behavior';
}

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const { profile, todayWater, todayMeals } = useZito();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const achievements: Achievement[] = useMemo(() => {
    const weightLost = profile.weightHistory.length >= 2
      ? profile.weightHistory[0].weight - profile.currentWeight
      : 0;

    return [
      {
        id: 'first_meal',
        title: 'First Scan',
        description: 'Log your first meal with ZITO',
        points: 10,
        icon: <Zap color={todayMeals.length > 0 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.accent,
        unlocked: todayMeals.length > 0,
        category: 'milestone',
      },
      {
        id: 'hydrated',
        title: 'Hydrated',
        description: 'Drink 8+ glasses in one day',
        points: 15,
        icon: <Droplets color={todayWater >= 8 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.blue,
        unlocked: todayWater >= 8,
        category: 'milestone',
      },
      {
        id: 'streak_3',
        title: 'On Fire',
        description: '3-day portion streak',
        points: 25,
        icon: <Zap color={profile.streaks.portion >= 3 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.orange,
        unlocked: profile.streaks.portion >= 3,
        category: 'streak',
      },
      {
        id: 'streak_7',
        title: 'Week Warrior',
        description: '7-day portion streak',
        points: 50,
        icon: <Award color={profile.streaks.portion >= 7 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.warning,
        unlocked: profile.streaks.portion >= 7,
        category: 'streak',
      },
      {
        id: 'streak_14',
        title: 'Fortnight Focus',
        description: '14-day portion streak',
        points: 100,
        icon: <Award color={profile.streaks.portion >= 14 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.pink,
        unlocked: profile.streaks.portion >= 14,
        category: 'streak',
      },
      {
        id: 'streak_30',
        title: 'Monthly Master',
        description: '30-day portion streak',
        points: 200,
        icon: <Trophy color={profile.streaks.portion >= 30 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.purple,
        unlocked: profile.streaks.portion >= 30,
        category: 'streak',
      },
      {
        id: 'water_streak_7',
        title: 'Water Week',
        description: '7-day water goal streak',
        points: 50,
        icon: <Droplets color={profile.streaks.water >= 7 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.blue,
        unlocked: profile.streaks.water >= 7,
        category: 'streak',
      },
      {
        id: 'window_streak_7',
        title: 'Window Warrior',
        description: '7-day eating window streak',
        points: 50,
        icon: <Clock color={profile.streaks.eatingWindow >= 7 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.purple,
        unlocked: profile.streaks.eatingWindow >= 7,
        category: 'streak',
      },
      {
        id: 'lost_1kg',
        title: 'First Kilo',
        description: 'Lose your first kilogram',
        points: 75,
        icon: <TrendingDown color={weightLost >= 1 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.success,
        unlocked: weightLost >= 1,
        category: 'milestone',
      },
      {
        id: 'lost_5kg',
        title: 'Five Down',
        description: 'Lose 5 kilograms total',
        points: 150,
        icon: <TrendingDown color={weightLost >= 5 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.success,
        unlocked: weightLost >= 5,
        category: 'milestone',
      },
      {
        id: 'lost_10kg',
        title: 'Double Digits',
        description: 'Lose 10 kilograms total',
        points: 300,
        icon: <Trophy color={weightLost >= 10 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.warning,
        unlocked: weightLost >= 10,
        category: 'milestone',
      },
      {
        id: 'month_2',
        title: 'Level Up',
        description: 'Reach Month 2 progression',
        points: 100,
        icon: <Zap color={profile.currentMonth >= 2 ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.accent,
        unlocked: profile.currentMonth >= 2,
        category: 'behavior',
      },
      {
        id: 'target_reached',
        title: 'Goal Crusher',
        description: 'Reach your target weight',
        points: 500,
        icon: <Target color={profile.currentWeight <= profile.targetWeight ? '#fff' : colors.textTertiary} size={20} />,
        color: colors.accent,
        unlocked: profile.currentWeight <= profile.targetWeight,
        category: 'milestone',
      },
    ];
  }, [profile, todayWater, todayMeals, colors]);

  const totalPoints = useMemo(() => achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points, 0), [achievements]);
  const maxPoints = useMemo(() => achievements.reduce((sum, a) => sum + a.points, 0), [achievements]);
  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked).length, [achievements]);

  const categories = useMemo(() => {
    const streaks = achievements.filter((a) => a.category === 'streak');
    const milestones = achievements.filter((a) => a.category === 'milestone');
    const behaviors = achievements.filter((a) => a.category === 'behavior');
    return [
      { title: 'Streak Badges', items: streaks },
      { title: 'Milestones', items: milestones },
      { title: 'Behavior', items: behaviors },
    ];
  }, [achievements]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Achievements', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.trophyCircle, { backgroundColor: colors.warning + '15' }]}>
              <Trophy color={colors.warning} size={32} />
            </View>
            <Text style={[styles.pointsValue, { color: colors.textPrimary }]}>{totalPoints}</Text>
            <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>Total Points</Text>
            <View style={styles.headerStats}>
              <View style={[styles.headerStat, { backgroundColor: colors.cardElevated }]}>
                <Text style={[styles.headerStatValue, { color: colors.accent }]}>{unlockedCount}</Text>
                <Text style={[styles.headerStatLabel, { color: colors.textSecondary }]}>Unlocked</Text>
              </View>
              <View style={[styles.headerStat, { backgroundColor: colors.cardElevated }]}>
                <Text style={[styles.headerStatValue, { color: colors.textTertiary }]}>{achievements.length - unlockedCount}</Text>
                <Text style={[styles.headerStatLabel, { color: colors.textSecondary }]}>Locked</Text>
              </View>
              <View style={[styles.headerStat, { backgroundColor: colors.cardElevated }]}>
                <Text style={[styles.headerStatValue, { color: colors.warning }]}>{maxPoints}</Text>
                <Text style={[styles.headerStatLabel, { color: colors.textSecondary }]}>Max Pts</Text>
              </View>
            </View>
            <View style={[styles.overallBar, { backgroundColor: colors.cardElevated }]}>
              <View style={[styles.overallBarFill, { backgroundColor: colors.warning, width: `${(totalPoints / maxPoints) * 100}%` }]} />
            </View>
          </View>

          {categories.map((cat) => (
            <View key={cat.title} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>{cat.title}</Text>
              <View style={styles.achievementGrid}>
                {cat.items.map((achievement) => (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      {
                        backgroundColor: achievement.unlocked ? colors.card : colors.card,
                        borderColor: achievement.unlocked ? achievement.color + '40' : colors.border,
                        opacity: achievement.unlocked ? 1 : 0.55,
                      },
                    ]}
                  >
                    <View style={[styles.achievementIcon, { backgroundColor: achievement.unlocked ? achievement.color : colors.cardElevated }]}>
                      {achievement.icon}
                    </View>
                    <Text style={[styles.achievementTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {achievement.title}
                    </Text>
                    <Text style={[styles.achievementDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {achievement.description}
                    </Text>
                    <View style={[styles.pointsBadge, { backgroundColor: achievement.unlocked ? achievement.color + '15' : colors.cardElevated }]}>
                      <Text style={[styles.pointsBadgeText, { color: achievement.unlocked ? achievement.color : colors.textTertiary }]}>
                        {achievement.points} pts
                      </Text>
                    </View>
                    {achievement.unlocked && (
                      <View style={[styles.unlockedCheck, { backgroundColor: achievement.color }]}>
                        <Text style={styles.unlockedCheckText}>✓</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  headerCard: { borderRadius: 22, padding: 24, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  trophyCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pointsValue: { fontSize: 42, fontWeight: '900' as const, letterSpacing: -1 },
  pointsLabel: { fontSize: 14, fontWeight: '600' as const, marginTop: 2 },
  headerStats: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 16 },
  headerStat: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, gap: 2 },
  headerStatValue: { fontSize: 20, fontWeight: '800' as const },
  headerStatLabel: { fontSize: 11, fontWeight: '600' as const },
  overallBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  overallBarFill: { height: 6, borderRadius: 3 },
  categorySection: { marginBottom: 24 },
  categoryTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 14 },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementCard: { width: '47.5%', borderRadius: 16, padding: 14, borderWidth: 1, gap: 6, position: 'relative' as const },
  achievementIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  achievementTitle: { fontSize: 14, fontWeight: '700' as const },
  achievementDesc: { fontSize: 11, lineHeight: 15 },
  pointsBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  pointsBadgeText: { fontSize: 11, fontWeight: '700' as const },
  unlockedCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  unlockedCheckText: { color: '#fff', fontSize: 12, fontWeight: '800' as const },
  bottomSpacer: { height: 40 },
});
