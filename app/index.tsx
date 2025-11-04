import { Redirect } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <>
      <StatusBar translucent backgroundColor="transparent" />
      <Redirect href="/(tabs)/capture" />
    </>
  );
}