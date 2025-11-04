import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#5CA0FF' : '#4285F4',
        headerStyle: { backgroundColor: isDark ? '#151A22' : '#FFFFFF' },
        headerTintColor: isDark ? '#E8EDF7' : '#0B0F19',
        tabBarStyle: { backgroundColor: isDark ? '#151A22' : '#FFFFFF' },
      }}
    >
      <Tabs.Screen name="capture" options={{ title: 'Capturar' }} />
      <Tabs.Screen name="receipts" options={{ title: 'Registros' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
    </Tabs>
  );
}
