import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import {
  Camera,
  Zap,
  Check,
  X,
  Droplets,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useZito } from '@/providers/ZitoProvider';
import { MealEntry } from '@/types';
import { getPortionTarget } from '@/constants/modes';

export default function ScanScreen() {
  const { colors } = useTheme();
  const { profile, addMeal } = useZito();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<{
    foods: string[];
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

  const portionTarget = getPortionTarget(profile.selectedMode, profile.currentMonth);

  const pickImage = useCallback(async (useCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setAnalysis(null);
        simulateAnalysis();
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Could not access camera or gallery');
    }
  }, []);

  const simulateAnalysis = useCallback(() => {
    setAnalyzing(true);
    setTimeout(() => {
      const mockFoods = [
        ['Grilled Chicken Breast', 'Brown Rice', 'Steamed Broccoli'],
        ['Salmon Fillet', 'Sweet Potato', 'Mixed Salad'],
        ['Pasta Bolognese', 'Side Salad', 'Garlic Bread'],
        ['Steak', 'Mashed Potatoes', 'Green Beans'],
      ];
      const chosen = mockFoods[Math.floor(Math.random() * mockFoods.length)];
      setAnalysis({
        foods: chosen,
        calories: Math.floor(400 + Math.random() * 400),
        protein: Math.floor(20 + Math.random() * 30),
        carbs: Math.floor(30 + Math.random() * 50),
        fats: Math.floor(10 + Math.random() * 25),
      });
      setAnalyzing(false);
    }, 2000);
  }, []);

  const handleLogMeal = useCallback(() => {
    if (!analysis) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const meal: MealEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      imageUri: imageUri ?? undefined,
      foods: analysis.foods,
      estimatedCalories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fats: analysis.fats,
      portionEaten: portionTarget,
      feedback: `Eat ${portionTarget}% of this plate`,
    };
    addMeal(meal);
    setImageUri(null);
    setAnalysis(null);
    Alert.alert('Meal Logged', `Eat ${portionTarget}% of this plate. Don't forget your water!`);
  }, [analysis, imageUri, portionTarget, addMeal]);

  const handleReset = useCallback(() => {
    setImageUri(null);
    setAnalysis(null);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Scan Meal</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Take a photo and ZITO will analyze your plate
          </Text>

          {!imageUri ? (
            <View style={styles.captureSection}>
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() => pickImage(true)}
                activeOpacity={0.8}
                testID="scan-camera-btn"
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  style={styles.cameraBtnGradient}
                >
                  <Camera color="#fff" size={48} />
                  <Text style={styles.cameraBtnText}>Take Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.galleryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => pickImage(false)}
                activeOpacity={0.7}
                testID="scan-gallery-btn"
              >
                <Camera color={colors.textSecondary} size={20} />
                <Text style={[styles.galleryBtnText, { color: colors.textSecondary }]}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultSection}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.mealImage}
                  contentFit="cover"
                />
                <TouchableOpacity style={styles.closeBtn} onPress={handleReset}>
                  <X color="#fff" size={18} />
                </TouchableOpacity>
              </View>

              {analyzing ? (
                <View style={[styles.analyzingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ActivityIndicator color={colors.accent} size="small" />
                  <Text style={[styles.analyzingText, { color: colors.textSecondary }]}>
                    Analyzing your meal with AI...
                  </Text>
                </View>
              ) : analysis ? (
                <View style={styles.analysisContainer}>
                  <View style={[styles.foodsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.foodsHeader}>
                      <Zap color={colors.accent} size={18} />
                      <Text style={[styles.foodsTitle, { color: colors.textPrimary }]}>Detected Foods</Text>
                    </View>
                    {analysis.foods.map((food, i) => (
                      <View key={i} style={styles.foodItem}>
                        <View style={[styles.foodDot, { backgroundColor: colors.accent }]} />
                        <Text style={[styles.foodName, { color: colors.textSecondary }]}>{food}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.macrosGrid}>
                    <View style={[styles.macroCard, { backgroundColor: colors.card, borderColor: colors.orange + '40' }]}>
                      <Zap color={colors.orange} size={18} />
                      <Text style={[styles.macroValue, { color: colors.textPrimary }]}>{analysis.calories}</Text>
                      <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>kcal</Text>
                    </View>
                    <View style={[styles.macroCard, { backgroundColor: colors.card, borderColor: colors.accent + '40' }]}>
                      <Droplets color={colors.accent} size={18} />
                      <Text style={[styles.macroValue, { color: colors.textPrimary }]}>{analysis.protein}g</Text>
                      <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
                    </View>
                    <View style={[styles.macroCard, { backgroundColor: colors.card, borderColor: colors.warning + '40' }]}>
                      <Zap color={colors.warning} size={18} />
                      <Text style={[styles.macroValue, { color: colors.textPrimary }]}>{analysis.carbs}g</Text>
                      <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
                    </View>
                  </View>

                  <View style={styles.portionAdvice}>
                    <LinearGradient
                      colors={[colors.accent + '12', colors.accentDark + '08']}
                      style={[styles.portionAdviceInner, { borderColor: colors.accent + '25' }]}
                    >
                      <Text style={[styles.portionTitle, { color: colors.accent }]}>ZITO Recommendation</Text>
                      <Text style={[styles.portionValue, { color: colors.textPrimary }]}>
                        Eat {portionTarget}% of this plate
                      </Text>
                      <Text style={[styles.portionHint, { color: colors.textSecondary }]}>
                        That's roughly {Math.round(analysis.calories * portionTarget / 100)} kcal
                      </Text>
                    </LinearGradient>
                  </View>

                  <TouchableOpacity
                    style={styles.logBtn}
                    onPress={handleLogMeal}
                    activeOpacity={0.8}
                    testID="scan-log-btn"
                  >
                    <LinearGradient
                      colors={[colors.accent, colors.accentDark]}
                      style={styles.logBtnGradient}
                    >
                      <Check color="#fff" size={20} />
                      <Text style={styles.logBtnText}>Log This Meal</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
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
    marginBottom: 28,
  },
  captureSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  cameraBtn: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cameraBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  cameraBtnText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  galleryBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  resultSection: {
    gap: 16,
  },
  imageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
  },
  analyzingText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  analysisContainer: {
    gap: 14,
  },
  foodsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  foodsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  foodsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  foodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  foodName: {
    fontSize: 15,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  portionAdvice: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  portionAdviceInner: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
  },
  portionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  portionValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  portionHint: {
    fontSize: 14,
  },
  logBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  logBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  bottomSpacer: {
    height: 30,
  },
});
