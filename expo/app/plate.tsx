import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { ChevronRight, Info } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useZito } from '@/providers/ZitoProvider';
import { getPortionTarget } from '@/constants/modes';

const PLATE_SIZE = Dimensions.get('window').width - 80;

interface PlateSection {
  label: string;
  color: string;
  percentage: number;
  icon: React.ReactNode;
}

export default function PlateScreen() {
  const { colors } = useTheme();
  const { profile } = useZito();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ghostAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [showGhost, setShowGhost] = useState<boolean>(false);

  const portionTarget = useMemo(
    () => getPortionTarget(profile.selectedMode, profile.currentMonth),
    [profile.selectedMode, profile.currentMonth]
  );

  const removedPortion = useMemo(() => 100 - portionTarget, [portionTarget]);

  const plateSections: PlateSection[] = useMemo(() => {
    const month = profile.currentMonth;
    if (profile.selectedMode === 'E') {
      const vegPct = month >= 2 ? 50 : 40;
      const protPct = 30;
      const carbPct = month >= 2 ? 20 : 30;
      return [
        { label: 'Vegetables', color: colors.success, percentage: vegPct, icon: <View style={styles.sectionDot} /> },
        { label: 'Protein', color: colors.orange, percentage: protPct, icon: <View style={styles.sectionDot} /> },
        { label: 'Carbs', color: colors.blue, percentage: carbPct, icon: <View style={styles.sectionDot} /> },
      ];
    }
    return [
      { label: 'Vegetables', color: colors.success, percentage: 40, icon: <View style={styles.sectionDot} /> },
      { label: 'Protein', color: colors.orange, percentage: 30, icon: <View style={styles.sectionDot} /> },
      { label: 'Carbs', color: colors.blue, percentage: 30, icon: <View style={styles.sectionDot} /> },
    ];
  }, [profile.selectedMode, profile.currentMonth, colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 7 }),
    ]).start();
  }, []);

  const triggerGhostAnimation = useCallback(() => {
    setShowGhost(true);
    ghostAnim.setValue(1);
    Animated.timing(ghostAnim, { toValue: 0, duration: 1200, useNativeDriver: true }).start(() => {
      setShowGhost(false);
    });
  }, [ghostAnim]);

  const monthProgression = useMemo(() => {
    const months = [1, 2, 3, 4];
    return months.map((m) => ({
      month: m,
      target: getPortionTarget(profile.selectedMode, m),
      isCurrent: m === profile.currentMonth,
    }));
  }, [profile.selectedMode, profile.currentMonth]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Plate Visualization', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.plateContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.plateOuter, { borderColor: colors.border }]}>
            <View style={[styles.plate, { backgroundColor: colors.card }]}>
              {plateSections.map((section, index) => {
                const startAngle = plateSections.slice(0, index).reduce((sum, s) => sum + (s.percentage / 100) * 360, 0);
                const sweepAngle = (section.percentage / 100) * 360;
                const midAngle = ((startAngle + sweepAngle / 2) * Math.PI) / 180;
                const labelRadius = PLATE_SIZE * 0.28;
                const labelX = Math.cos(midAngle - Math.PI / 2) * labelRadius;
                const labelY = Math.sin(midAngle - Math.PI / 2) * labelRadius;

                return (
                  <View
                    key={section.label}
                    style={[
                      styles.sectionIndicator,
                      {
                        backgroundColor: section.color,
                        left: PLATE_SIZE / 2 + labelX - 20,
                        top: PLATE_SIZE / 2 + labelY - 20,
                      },
                    ]}
                  >
                    {section.icon}
                  </View>
                );
              })}

              <View style={styles.plateCenter}>
                <Text style={[styles.eatPercentage, { color: colors.textPrimary }]}>{portionTarget.toFixed(0)}%</Text>
                <Text style={[styles.eatLabel, { color: colors.textSecondary }]}>Eat Zone</Text>
              </View>

              {removedPortion > 0 && (
                <View style={[styles.removeZone, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '30' }]}>
                  <Text style={[styles.removeText, { color: colors.danger }]}>-{removedPortion.toFixed(0)}%</Text>
                </View>
              )}

              {showGhost && (
                <Animated.View style={[styles.ghostOverlay, { opacity: ghostAnim, backgroundColor: colors.textPrimary + '08' }]}>
                  <Text style={[styles.ghostText, { color: colors.textTertiary }]}>Removed</Text>
                </Animated.View>
              )}
            </View>

            {plateSections.map((section, i) => {
              const startAngle = plateSections.slice(0, i).reduce((sum, s) => sum + (s.percentage / 100) * 360, -90);
              const endAngle = startAngle + (section.percentage / 100) * 360;
              const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
              const edgeRadius = PLATE_SIZE / 2 + 4;
              const x = Math.cos(midAngle) * edgeRadius + PLATE_SIZE / 2;
              const y = Math.sin(midAngle) * edgeRadius + PLATE_SIZE / 2;
              return (
                <View key={`dot-${i}`} style={[styles.edgeDot, { backgroundColor: section.color, left: x - 4, top: y - 4 }]} />
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.legendSection}>
          {plateSections.map((section) => (
            <View key={section.label} style={[styles.legendItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.legendDot, { backgroundColor: section.color }]} />
              <Text style={[styles.legendLabel, { color: colors.textPrimary }]}>{section.label}</Text>
              <Text style={[styles.legendPct, { color: section.color }]}>{section.percentage}%</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={triggerGhostAnimation}
          style={[styles.ghostButton, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '25' }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.ghostButtonText, { color: colors.danger }]}>Show Ghost Plate Animation</Text>
          <Info color={colors.danger} size={16} />
        </TouchableOpacity>

        <View style={[styles.progressionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.progressionTitle, { color: colors.textPrimary }]}>Monthly Progression</Text>
          <View style={styles.progressionTrack}>
            {monthProgression.map((m, i) => (
              <View key={m.month} style={styles.progressionStep}>
                <View style={[
                  styles.progressionDot,
                  {
                    backgroundColor: m.isCurrent ? colors.accent : m.month < profile.currentMonth ? colors.success : colors.cardElevated,
                    borderColor: m.isCurrent ? colors.accent : colors.border,
                  }
                ]}>
                  <Text style={[styles.progressionDotText, { color: m.isCurrent || m.month < profile.currentMonth ? '#fff' : colors.textTertiary }]}>
                    {m.month}
                  </Text>
                </View>
                <Text style={[styles.progressionLabel, { color: m.isCurrent ? colors.accent : colors.textSecondary }]}>
                  {m.target.toFixed(0)}%
                </Text>
                {i < monthProgression.length - 1 && (
                  <View style={[styles.progressionLine, { backgroundColor: m.month < profile.currentMonth ? colors.success : colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.accentFaint, borderColor: colors.accent + '20' }]}>
          <Info color={colors.accent} size={18} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.accent }]}>How it works</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              The plate shows your ideal portion split. The remove zone fades out food you should skip this month. Each month, ZITO adjusts your plate automatically.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  plateContainer: { alignItems: 'center', marginBottom: 24 },
  plateOuter: { width: PLATE_SIZE + 12, height: PLATE_SIZE + 12, borderRadius: (PLATE_SIZE + 12) / 2, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  plate: { width: PLATE_SIZE, height: PLATE_SIZE, borderRadius: PLATE_SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sectionIndicator: { position: 'absolute', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  plateCenter: { alignItems: 'center' },
  eatPercentage: { fontSize: 42, fontWeight: '900' as const, letterSpacing: -1 },
  eatLabel: { fontSize: 14, fontWeight: '600' as const, marginTop: 2 },
  removeZone: { position: 'absolute', bottom: 20, right: 20, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  removeText: { fontSize: 15, fontWeight: '700' as const },
  ghostOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: PLATE_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontSize: 24, fontWeight: '800' as const },
  edgeDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  legendSection: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  legendItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, borderWidth: 1 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 12, fontWeight: '600' as const },
  legendPct: { fontSize: 14, fontWeight: '800' as const },
  ghostButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  ghostButtonText: { fontSize: 14, fontWeight: '600' as const },
  progressionCard: { borderRadius: 18, padding: 18, borderWidth: 1, marginBottom: 16 },
  progressionTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 16 },
  progressionTrack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressionStep: { alignItems: 'center', flex: 1 },
  progressionDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  progressionDotText: { fontSize: 14, fontWeight: '700' as const },
  progressionLabel: { fontSize: 12, fontWeight: '600' as const, marginTop: 6 },
  progressionLine: { position: 'absolute', top: 20, left: '75%', width: '50%', height: 2 },
  infoCard: { flexDirection: 'row', gap: 12, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700' as const, marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 19 },
  bottomSpacer: { height: 40 },
});
