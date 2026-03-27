import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  ArrowLeft,
  Zap,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { MODES } from '@/constants/modes';
import { useZito } from '@/providers/ZitoProvider';
import { ZitoMode } from '@/types';

const { width } = Dimensions.get('window');



export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useZito();
  const [step, setStep] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<ZitoMode>('A');
  const [name, setName] = useState<string>('');
  const [weight, setWeight] = useState<string>('80');
  const [targetWeight, setTargetWeight] = useState<string>('70');
  const [height, setHeight] = useState<string>('175');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = useCallback((next: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 2) {
      animateTransition(step + 1);
    } else {
      completeOnboarding(
        selectedMode,
        name || 'User',
        parseFloat(weight) || 80,
        parseFloat(targetWeight) || 70,
        parseFloat(height) || 175
      );
      router.replace('/');
    }
  }, [step, selectedMode, name, weight, targetWeight, height, completeOnboarding, router, animateTransition]);

  const handleBack = useCallback(() => {
    if (step > 0) animateTransition(step - 1);
  }, [step, animateTransition]);

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={[Colors.accent, Colors.accentDark]}
          style={styles.logoBg}
        >
          <Zap color="#fff" size={40} />
        </LinearGradient>
      </View>
      <Text style={styles.welcomeTitle}>Welcome to ZITO</Text>
      <Text style={styles.welcomeSubtitle}>
        AI-powered fat loss without calorie counting. Just snap, eat, and lose.
      </Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What should we call you?</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={Colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          testID="onboarding-name-input"
        />
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputHalf}>
          <Text style={styles.inputLabel}>Current (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="80"
            placeholderTextColor={Colors.textTertiary}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            testID="onboarding-weight-input"
          />
        </View>
        <View style={styles.inputHalf}>
          <Text style={styles.inputLabel}>Target (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="70"
            placeholderTextColor={Colors.textTertiary}
            value={targetWeight}
            onChangeText={setTargetWeight}
            keyboardType="numeric"
            testID="onboarding-target-input"
          />
        </View>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="175"
          placeholderTextColor={Colors.textTertiary}
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
          testID="onboarding-height-input"
        />
      </View>
    </View>
  );

  const renderModeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Your Mode</Text>
      <Text style={styles.stepSubtitle}>
        Select the approach that fits your lifestyle
      </Text>
      <ScrollView
        style={styles.modeList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.modeListContent}
      >
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeCard,
                isSelected && { borderColor: mode.color, borderWidth: 1.5 },
              ]}
              onPress={() => {
                setSelectedMode(mode.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
              testID={`mode-${mode.id}`}
            >
              <View style={[styles.modeIconBg, { backgroundColor: mode.color + '18' }]}>
                <Zap color={mode.color} size={22} />
              </View>
              <View style={styles.modeTextContainer}>
                <View style={styles.modeHeader}>
                  <Text style={styles.modeBadge}>{mode.id}</Text>
                  <Text style={styles.modeTitle}>{mode.title}</Text>
                </View>
                <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
              </View>
              {isSelected && (
                <View style={[styles.selectedDot, { backgroundColor: mode.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const selectedModeInfo = MODES.find((m) => m.id === selectedMode);
  const renderConfirm = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Ready to Start</Text>
      <Text style={styles.stepSubtitle}>Here's your personalized plan</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name</Text>
          <Text style={styles.summaryValue}>{name || 'User'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Current Weight</Text>
          <Text style={styles.summaryValue}>{weight} kg</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Target Weight</Text>
          <Text style={styles.summaryValue}>{targetWeight} kg</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Mode</Text>
          <Text style={[styles.summaryValue, { color: selectedModeInfo?.color }]}>
            {selectedModeInfo?.title}
          </Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.summaryDesc}>{selectedModeInfo?.description}</Text>
      </View>
      <View style={styles.tipCard}>
        <Zap color={Colors.accent} size={18} />
        <Text style={styles.tipText}>
          ZITO will guide you through each meal with AI-powered portion coaching and hydration reminders.
        </Text>
      </View>
    </View>
  );

  const steps = [renderWelcome, renderModeSelection, renderConfirm];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            {step > 0 ? (
              <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                <ArrowLeft color={Colors.textSecondary} size={22} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backBtn} />
            )}
            <View style={styles.dots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.dot, i === step && styles.dotActive]}
                />
              ))}
            </View>
            <View style={styles.backBtn} />
          </View>
          <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {steps[step]()}
            </ScrollView>
          </Animated.View>
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              activeOpacity={0.8}
              testID="onboarding-next"
            >
              <LinearGradient
                colors={[Colors.accent, Colors.accentDark]}
                style={styles.nextBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextBtnText}>
                  {step === 2 ? "Let's Go" : 'Continue'}
                </Text>
                <ChevronRight color="#fff" size={20} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 20,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputHalf: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  modeList: {
    flex: 1,
  },
  modeListContent: {
    paddingBottom: 20,
    gap: 10,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  modeBadge: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
    backgroundColor: Colors.accentFaint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  modeSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  summaryDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 14,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accentFaint,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accentLight,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 8,
  },
  nextBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
