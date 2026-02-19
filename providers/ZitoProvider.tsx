import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { UserProfile, ZitoMode, MealEntry } from '@/types';
import { getWaterGoalForMode } from '@/constants/modes';

const STORAGE_KEY = 'zito_user_profile';
const MEALS_KEY = 'zito_meals';
const WATER_KEY = 'zito_water';

const defaultProfile: UserProfile = {
  name: '',
  currentWeight: 80,
  targetWeight: 70,
  height: 175,
  selectedMode: 'A',
  onboardingComplete: false,
  startDate: new Date().toISOString().split('T')[0],
  currentMonth: 1,
  dailyWaterGoal: 10,
  streaks: { portion: 0, water: 0, eatingWindow: 0 },
  weightHistory: [],
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const [ZitoProvider, useZito] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [todayWater, setTodayWater] = useState<number>(0);
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);

  const profileQuery = useQuery({
    queryKey: ['zito_profile'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as UserProfile) : defaultProfile;
    },
  });

  const waterQuery = useQuery({
    queryKey: ['zito_water', getTodayKey()],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(`${WATER_KEY}_${getTodayKey()}`);
      return stored ? parseInt(stored, 10) : 0;
    },
  });

  const mealsQuery = useQuery({
    queryKey: ['zito_meals', getTodayKey()],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(`${MEALS_KEY}_${getTodayKey()}`);
      return stored ? (JSON.parse(stored) as MealEntry[]) : [];
    },
  });

  useEffect(() => {
    if (profileQuery.data) setProfile(profileQuery.data);
  }, [profileQuery.data]);

  useEffect(() => {
    if (waterQuery.data !== undefined) setTodayWater(waterQuery.data);
  }, [waterQuery.data]);

  useEffect(() => {
    if (mealsQuery.data) setTodayMeals(mealsQuery.data);
  }, [mealsQuery.data]);

  const saveProfileMutation = useMutation({
    mutationFn: async (updated: UserProfile) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setProfile(data);
      queryClient.invalidateQueries({ queryKey: ['zito_profile'] });
    },
  });

  const addWaterMutation = useMutation({
    mutationFn: async (glasses: number) => {
      const newTotal = todayWater + glasses;
      await AsyncStorage.setItem(`${WATER_KEY}_${getTodayKey()}`, String(newTotal));
      return newTotal;
    },
    onSuccess: (newTotal) => {
      setTodayWater(newTotal);
      queryClient.invalidateQueries({ queryKey: ['zito_water'] });
    },
  });

  const addMealMutation = useMutation({
    mutationFn: async (meal: MealEntry) => {
      const updated = [...todayMeals, meal];
      await AsyncStorage.setItem(`${MEALS_KEY}_${getTodayKey()}`, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      setTodayMeals(updated);
      queryClient.invalidateQueries({ queryKey: ['zito_meals'] });
    },
  });

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    saveProfileMutation.mutate(updated);
  }, [profile, saveProfileMutation]);

  const completeOnboarding = useCallback((mode: ZitoMode, name: string, weight: number, targetWeight: number, height: number) => {
    const waterGoal = getWaterGoalForMode(mode, 1);
    const updated: UserProfile = {
      ...defaultProfile,
      name,
      currentWeight: weight,
      targetWeight,
      height,
      selectedMode: mode,
      onboardingComplete: true,
      startDate: new Date().toISOString().split('T')[0],
      currentMonth: 1,
      dailyWaterGoal: waterGoal,
      weightHistory: [{ date: new Date().toISOString().split('T')[0], weight }],
    };
    saveProfileMutation.mutate(updated);
  }, [saveProfileMutation]);

  const addWater = useCallback((glasses: number) => {
    addWaterMutation.mutate(glasses);
  }, [addWaterMutation]);

  const addMeal = useCallback((meal: MealEntry) => {
    addMealMutation.mutate(meal);
  }, [addMealMutation]);

  const isLoading = profileQuery.isLoading;

  return {
    profile,
    todayWater,
    todayMeals,
    isLoading,
    updateProfile,
    completeOnboarding,
    addWater,
    addMeal,
  };
});
