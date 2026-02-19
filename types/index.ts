export type ZitoMode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface ModeInfo {
  id: ZitoMode;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
}

export interface WaterLog {
  id: string;
  timestamp: number;
  glasses: number;
}

export interface MealEntry {
  id: string;
  timestamp: number;
  imageUri?: string;
  foods: string[];
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  portionEaten: number;
  feedback: string;
}

export interface DailyProgress {
  date: string;
  waterGlasses: number;
  waterGoal: number;
  mealsLogged: number;
  portionAdherence: number;
  estimatedDeficit: number;
}

export interface UserProfile {
  name: string;
  currentWeight: number;
  targetWeight: number;
  height: number;
  selectedMode: ZitoMode;
  onboardingComplete: boolean;
  startDate: string;
  currentMonth: number;
  dailyWaterGoal: number;
  streaks: {
    portion: number;
    water: number;
    eatingWindow: number;
  };
  weightHistory: { date: string; weight: number }[];
}
