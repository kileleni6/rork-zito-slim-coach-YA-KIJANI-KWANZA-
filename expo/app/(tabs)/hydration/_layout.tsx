import { Stack } from 'expo-router';
import React from 'react';

export default function HydrationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
