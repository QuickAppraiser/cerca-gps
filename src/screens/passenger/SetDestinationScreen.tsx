// ==========================================
// CERCA - Pantalla de Selección de Destino
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useTripStore } from '../../store/tripStore';
import { Location } from '../../types';

type SetDestinationScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// Lugares populares en Armenia (mock)
const POPULAR_PLACES: Location[] = [
  {
    coordinates: { latitude: 4.5400, longitude: -75.6700 },
    address: 'Centro Comercial Portal del Quindío',
    name: 'Portal del Quindío',
  },
  {
    coordinates: { latitude: 4.5320, longitude: -75.6850 },
    address: 'Terminal de Transportes de Armenia',
    name: 'Terminal',
  },
  {
    coordinates: { latitude: 4.5280, longitude: -75.6720 },
    address: 'Parque de la Vida',
    name: 'Parque de la Vida',
  },
  {
    coordinates: { latitude: 4.5450, longitude: -75.6650 },
    address: 'Universidad del Quindío',
    name: 'Uniquindío',
  },
  {
    coordinates: { latitude: 4.5390, longitude: -75.6780 },
    address: 'Plaza de Bolívar, Centro',
    name: 'Plaza de Bolívar',
  },
  {
    coordinates: { latitude: 4.5350, longitude: -75.6900 },
    address: 'Centro Comercial Unicentro',
    name: 'Unicentro',
  },
];

export const SetDestinationScreen: React.FC<SetDestinationScreenProps> = ({
  navigation,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const { origin, setDestination } = useTripStore();

  useEffect(() => {
    if (searchText.length > 2) {
      // Filtrar lugares por búsqueda (mock - luego integrar Google Places)
      const filtered = POPULAR_PLACES.filter(
        (place) =>
          place.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          place.address.toLowerCase().includes(searchText.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchText]);

  const handleSelectDestination = (location: Location) => {
    setDestination(location);
    Keyboard.dismiss();
    navigation.navigate('ConfirmTrip');
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleSelectDestination(item)}
    >
      <View style={styles.locationIcon}>
        <Text>📍</Text>
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name || item.address}</Text>
        <Text style={styles.locationAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>¿A dónde vamos?</Text>
      </View>

      {/* Inputs de origen y destino */}
      <View style={styles.inputsContainer}>
        {/* Origen */}
        <View style={styles.inputRow}>
          <View style={[styles.inputDot, styles.originDot]} />
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Origen</Text>
            <Text style={styles.originText} numberOfLines={1}>
              {origin?.address || 'Mi ubicación actual'}
            </Text>
          </View>
        </View>

        {/* Línea conectora */}
        <View style={styles.connector} />

        {/* Destino */}
        <View style={styles.inputRow}>
          <View style={[styles.inputDot, styles.destinationDot]} />
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Destino</Text>
            <TextInput
              style={styles.destinationInput}
              placeholder="¿A dónde quieres ir?"
              placeholderTextColor={COLORS.gray[400]}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
          </View>
        </View>
      </View>

      {/* Resultados o lugares populares */}
      <View style={styles.resultsContainer}>
        {searchResults.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Resultados</Text>
            <FlatList
              data={searchResults}
              renderItem={renderLocationItem}
              keyExtractor={(item) => `${item.coordinates.latitude}-${item.coordinates.longitude}`}
              keyboardShouldPersistTaps="handled"
            />
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Lugares populares</Text>
            <FlatList
              data={POPULAR_PLACES}
              renderItem={renderLocationItem}
              keyExtractor={(item) => `${item.coordinates.latitude}-${item.coordinates.longitude}`}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}
      </View>

      {/* Lugares guardados */}
      <View style={styles.savedPlaces}>
        <TouchableOpacity style={styles.savedPlaceButton}>
          <Text style={styles.savedPlaceIcon}>🏠</Text>
          <Text style={styles.savedPlaceText}>Casa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.savedPlaceButton}>
          <Text style={styles.savedPlaceIcon}>💼</Text>
          <Text style={styles.savedPlaceText}>Trabajo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.savedPlaceButton}>
          <Text style={styles.savedPlaceIcon}>📍</Text>
          <Text style={styles.savedPlaceText}>Elegir en mapa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  inputsContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.gray[50],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  originDot: {
    backgroundColor: COLORS.primary,
  },
  destinationDot: {
    backgroundColor: COLORS.emergency,
  },
  connector: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray[300],
    marginLeft: 5,
    marginVertical: 4,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  originText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
  },
  destinationInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  resultsContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  savedPlaces: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  savedPlaceButton: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  savedPlaceIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  savedPlaceText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
});
