import { ModeInfo } from '@/types';
import Colors from './colors';

export const MODES: ModeInfo[] = [
  {
    id: 'A',
    title: 'Progressive Halving',
    subtitle: 'Reduce portions by 50% monthly',
    description: 'Each month, eat half of what you ate the previous month. Simple, aggressive, effective.',
    icon: 'scissors',
    color: Colors.accent,
  },
  {
    id: 'B',
    title: 'Quarter Reduction',
    subtitle: 'Gradual 25% monthly reduction',
    description: 'Reduce portions by 25% each month. Gentler approach with steady results.',
    icon: 'trending-down',
    color: Colors.blue,
  },
  {
    id: 'C',
    title: 'Protein First',
    subtitle: 'Cut carbs & fats, keep protein',
    description: 'Progressively reduce carbs and fats while maintaining protein intake for muscle preservation.',
    icon: 'beef',
    color: Colors.orange,
  },
  {
    id: 'D',
    title: 'Eating Window',
    subtitle: 'Time-restricted eating',
    description: 'Start with an 8-hour eating window and progressively adjust for optimal fat loss.',
    icon: 'clock',
    color: Colors.purple,
  },
  {
    id: 'E',
    title: 'Plate Restructure',
    subtitle: 'Rebalance your plate ratios',
    description: 'Restructure your plate composition: more vegetables, balanced protein, reduced carbs.',
    icon: 'pie-chart',
    color: Colors.pink,
  },
  {
    id: 'F',
    title: 'Micro-Bite',
    subtitle: 'Slow eating behavior control',
    description: 'One bite every 20-30 seconds. Train your brain to eat slowly and feel full faster.',
    icon: 'timer',
    color: Colors.warning,
  },
  {
    id: 'G',
    title: 'AI Autopilot',
    subtitle: 'AI manages everything for you',
    description: 'ZITO automatically adjusts portions, timing, hydration, and macros based on your progress.',
    icon: 'brain',
    color: Colors.accentLight,
  },
];

export const getWaterGoalForMode = (mode: string, month: number): number => {
  const base = 8;
  switch (mode) {
    case 'A': return base + Math.min(month, 4) * 2;
    case 'B': return base + Math.min(month, 4);
    case 'C': return base + Math.min(month, 3);
    case 'D': return base + 2;
    case 'E': return base + 2;
    case 'F': return base;
    case 'G': return base + Math.min(month, 3) * 2;
    default: return base;
  }
};

export const getPortionTarget = (mode: string, month: number): number => {
  switch (mode) {
    case 'A': return Math.max(100 * Math.pow(0.5, Math.min(month, 4)), 6.25);
    case 'B': return Math.max(100 - Math.min(month, 3) * 25, 25);
    case 'C': return 100;
    case 'D': return 100;
    case 'E': return 100;
    case 'F': return 100;
    case 'G': return Math.max(100 - Math.min(month, 4) * 15, 40);
    default: return 100;
  }
};
