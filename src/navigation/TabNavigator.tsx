import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MapScreen } from '../screens/MapScreen';
import { LinesScreen } from '../screens/LinesScreen';
import { QrScannerScreen } from '../screens/QrScannerScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Mapa" component={MapScreen} options={{ title: 'Paradas Cerca' }} />
      <Tab.Screen name="Lineas" component={LinesScreen} options={{ title: 'Líneas' }} />
      <Tab.Screen name="Escanear" component={QrScannerScreen} options={{ title: 'Escanear QR' }} />
      <Tab.Screen name="Favoritos" component={FavoritesScreen} options={{ title: 'Favoritos' }} />
    </Tab.Navigator>
  );
};