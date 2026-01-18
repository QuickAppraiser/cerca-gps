// ==========================================
// CERCA - Navegación Principal
// ==========================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { COLORS, FONT_SIZES } from '../constants/theme';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';

// Passenger Screens
import { HomeScreen } from '../screens/passenger/HomeScreen';
import { SetDestinationScreen } from '../screens/passenger/SetDestinationScreen';
import { ConfirmTripScreen } from '../screens/passenger/ConfirmTripScreen';
import { SearchingDriverScreen } from '../screens/passenger/SearchingDriverScreen';

// Driver Screens
import { DriverHomeScreen } from '../screens/driver/DriverHomeScreen';

// Shared Screens
import { CreditsScreen } from '../screens/shared/CreditsScreen';
import { TrafficReportsScreen } from '../screens/shared/TrafficReportsScreen';
import { CommunityRoutesScreen } from '../screens/shared/CommunityRoutesScreen';

// Placeholder screens (se implementarán después)
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>{name}</Text>
    <Text style={styles.placeholderSubtext}>Próximamente</Text>
  </View>
);

// Auth Stack
const AuthStack = createNativeStackNavigator();
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen
      name="DriverRegister"
      component={() => <PlaceholderScreen name="Registro Conductor" />}
    />
  </AuthStack.Navigator>
);

// Passenger Tab Navigator
const PassengerTab = createBottomTabNavigator();
const PassengerTabNavigator = () => (
  <PassengerTab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray[500],
      tabBarLabelStyle: styles.tabBarLabel,
    }}
  >
    <PassengerTab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarLabel: 'Inicio',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
      }}
    />
    <PassengerTab.Screen
      name="Activity"
      component={() => <PlaceholderScreen name="Actividad" />}
      options={{
        tabBarLabel: 'Actividad',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
      }}
    />
    <PassengerTab.Screen
      name="Community"
      component={() => <PlaceholderScreen name="Comunidad" />}
      options={{
        tabBarLabel: 'Comunidad',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text>,
      }}
    />
    <PassengerTab.Screen
      name="Profile"
      component={() => <PlaceholderScreen name="Perfil" />}
      options={{
        tabBarLabel: 'Perfil',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
      }}
    />
  </PassengerTab.Navigator>
);

// Driver Tab Navigator
const DriverTab = createBottomTabNavigator();
const DriverTabNavigator = () => (
  <DriverTab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray[500],
      tabBarLabelStyle: styles.tabBarLabel,
    }}
  >
    <DriverTab.Screen
      name="DriverHome"
      component={DriverHomeScreen}
      options={{
        tabBarLabel: 'Inicio',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚗</Text>,
      }}
    />
    <DriverTab.Screen
      name="Trips"
      component={() => <PlaceholderScreen name="Viajes" />}
      options={{
        tabBarLabel: 'Viajes',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>📍</Text>,
      }}
    />
    <DriverTab.Screen
      name="Earnings"
      component={() => <PlaceholderScreen name="Ganancias" />}
      options={{
        tabBarLabel: 'Ganancias',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>💰</Text>,
      }}
    />
    <DriverTab.Screen
      name="DriverProfile"
      component={() => <PlaceholderScreen name="Perfil" />}
      options={{
        tabBarLabel: 'Perfil',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
      }}
    />
  </DriverTab.Navigator>
);

// Main Stack (después de login)
const MainStack = createNativeStackNavigator();
const MainNavigator = () => {
  const { activeRole } = useAuthStore();

  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      {activeRole === 'driver' ? (
        <MainStack.Screen name="DriverTabs" component={DriverTabNavigator} />
      ) : (
        <MainStack.Screen name="PassengerTabs" component={PassengerTabNavigator} />
      )}

      {/* Flujo de viaje */}
      <MainStack.Screen
        name="SetDestination"
        component={SetDestinationScreen}
        options={{ presentation: 'modal' }}
      />
      <MainStack.Screen
        name="ConfirmTrip"
        component={ConfirmTripScreen}
      />
      <MainStack.Screen
        name="SearchingDriver"
        component={SearchingDriverScreen}
      />
      <MainStack.Screen
        name="TripInProgress"
        component={() => <PlaceholderScreen name="Viaje en Progreso" />}
      />

      {/* Pantallas compartidas */}
      <MainStack.Screen
        name="Credits"
        component={CreditsScreen}
      />
      <MainStack.Screen
        name="TrafficReports"
        component={TrafficReportsScreen}
      />
      <MainStack.Screen
        name="CommunityRoutes"
        component={CommunityRoutesScreen}
      />
      <MainStack.Screen
        name="Tokens"
        component={() => <PlaceholderScreen name="Tokens CERCA" />}
      />
      <MainStack.Screen
        name="Favorites"
        component={() => <PlaceholderScreen name="Favoritos" />}
      />
      <MainStack.Screen
        name="Documents"
        component={() => <PlaceholderScreen name="Documentos" />}
      />
      <MainStack.Screen
        name="Settings"
        component={() => <PlaceholderScreen name="Configuración" />}
      />
      <MainStack.Screen
        name="ActiveTrip"
        component={() => <PlaceholderScreen name="Viaje Activo" />}
      />
    </MainStack.Navigator>
  );
};

// Root Navigator
const RootStack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>CERCA</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
