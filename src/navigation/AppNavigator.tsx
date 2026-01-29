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
import { TripInProgressScreen } from '../screens/passenger/TripInProgressScreen';

// Driver Screens
import { DriverHomeScreen } from '../screens/driver/DriverHomeScreen';
import { DriverRegisterScreen } from '../screens/driver/DriverRegisterScreen';

// Shared Screens
import { CreditsScreen } from '../screens/shared/CreditsScreen';
import { TrafficReportsScreen } from '../screens/shared/TrafficReportsScreen';
import { CommunityRoutesScreen } from '../screens/shared/CommunityRoutesScreen';
import { TripCompletedScreen } from '../screens/shared/TripCompletedScreen';
import { TripHistoryScreen } from '../screens/shared/TripHistoryScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { TokensScreen } from '../screens/shared/TokensScreen';
import { FavoritesScreen } from '../screens/shared/FavoritesScreen';
import { DocumentsScreen } from '../screens/shared/DocumentsScreen';
import { SupportScreen } from '../screens/shared/SupportScreen';
import { EmergencyContactsScreen } from '../screens/shared/EmergencyContactsScreen';
import { PromoScreen } from '../screens/shared/PromoScreen';
import { ReferralScreen } from '../screens/shared/ReferralScreen';
import { TripReceiptScreen } from '../screens/shared/TripReceiptScreen';

// Driver Screens
import { DriverEarningsScreen } from '../screens/driver/DriverEarningsScreen';

// Auth Stack (solo login - registro de conductor requiere autenticacion)
const AuthStack = createNativeStackNavigator();
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
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
      component={TripHistoryScreen}
      options={{
        tabBarLabel: 'Actividad',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
      }}
    />
    <PassengerTab.Screen
      name="Community"
      component={CommunityRoutesScreen}
      options={{
        tabBarLabel: 'Comunidad',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text>,
      }}
    />
    <PassengerTab.Screen
      name="Profile"
      component={ProfileScreen}
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
      component={TripHistoryScreen}
      options={{
        tabBarLabel: 'Viajes',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>📍</Text>,
      }}
    />
    <DriverTab.Screen
      name="Earnings"
      component={CreditsScreen}
      options={{
        tabBarLabel: 'Ganancias',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>💰</Text>,
      }}
    />
    <DriverTab.Screen
      name="DriverProfile"
      component={ProfileScreen}
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
        component={TripInProgressScreen}
      />
      <MainStack.Screen
        name="TripCompleted"
        component={TripCompletedScreen}
      />
      <MainStack.Screen
        name="TripHistory"
        component={TripHistoryScreen}
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
        component={TokensScreen}
      />
      <MainStack.Screen
        name="Favorites"
        component={FavoritesScreen}
      />
      <MainStack.Screen
        name="Documents"
        component={DocumentsScreen}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
      />
      <MainStack.Screen
        name="ActiveTrip"
        component={TripInProgressScreen}
      />
      <MainStack.Screen
        name="DriverRegister"
        component={DriverRegisterScreen}
      />

      {/* New screens */}
      <MainStack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: 'Ayuda' }}
      />
      <MainStack.Screen
        name="EmergencyContacts"
        component={EmergencyContactsScreen}
        options={{ title: 'Contactos de Emergencia' }}
      />
      <MainStack.Screen
        name="Promos"
        component={PromoScreen}
        options={{ title: 'Promociones' }}
      />
      <MainStack.Screen
        name="Referrals"
        component={ReferralScreen}
        options={{ title: 'Invitar Amigos' }}
      />
      <MainStack.Screen
        name="DriverEarnings"
        component={DriverEarningsScreen}
        options={{ title: 'Mis Ganancias' }}
      />
      <MainStack.Screen
        name="TripReceipt"
        component={TripReceiptScreen}
        options={{ title: 'Recibo' }}
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
