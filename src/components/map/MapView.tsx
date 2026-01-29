// ==========================================
// CERCA - Cross-Platform Map Component
// Uses react-native-maps on mobile, placeholder on web
// ==========================================

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, ARMENIA_CONFIG } from '../../constants/theme';
import { Coordinates } from '../../types';
import { mockNearbyDrivers } from '../../services/mockData';

const { width } = Dimensions.get('window');

// ==========================================
// Types
// ==========================================

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id: string;
  coordinate: Coordinates;
  title?: string;
  description?: string;
  icon?: string;
  type?: 'user' | 'driver' | 'destination' | 'report';
}

export interface MapViewProps {
  style?: any;
  initialRegion?: MapRegion;
  markers?: MapMarker[];
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  onRegionChange?: (region: MapRegion) => void;
  onMarkerPress?: (marker: MapMarker) => void;
  onMapPress?: (coordinate: Coordinates) => void;
  children?: React.ReactNode;
}

export interface MapViewRef {
  animateToRegion: (region: MapRegion, duration?: number) => void;
  fitToCoordinates: (coordinates: Coordinates[], options?: any) => void;
}

// ==========================================
// Web Map Placeholder Component
// ==========================================

const WebMapPlaceholder: React.FC<MapViewProps & { forwardedRef: React.Ref<MapViewRef> }> = ({
  style,
  initialRegion = ARMENIA_CONFIG.initialRegion,
  markers = [],
  showsUserLocation = false,
  onMapPress,
  onMarkerPress,
}) => {
  const [region, setRegion] = useState(initialRegion);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Create static map URL using OpenStreetMap
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    region.longitude - region.longitudeDelta
  },${region.latitude - region.latitudeDelta},${
    region.longitude + region.longitudeDelta
  },${region.latitude + region.latitudeDelta}&layer=mapnik&marker=${region.latitude},${region.longitude}`;

  const handleMarkerPress = (marker: MapMarker) => {
    setSelectedMarker(marker);
    onMarkerPress?.(marker);
  };

  return (
    <View style={[styles.webMapContainer, style]}>
      {/* Static Map Background */}
      <View style={styles.webMapContent}>
        <Text style={styles.webMapTitle}>🗺️ Mapa de Armenia</Text>
        <Text style={styles.webMapSubtitle}>
          Lat: {region.latitude.toFixed(4)}, Lng: {region.longitude.toFixed(4)}
        </Text>

        {/* Visual Map Grid */}
        <View style={styles.mapGrid}>
          {/* User Location */}
          {showsUserLocation && (
            <View style={[styles.mapMarker, styles.userMarker]}>
              <Text style={styles.markerEmoji}>📍</Text>
              <Text style={styles.markerLabel}>Tu ubicación</Text>
            </View>
          )}

          {/* Mock Drivers */}
          <View style={styles.driversContainer}>
            <Text style={styles.driversTitle}>Conductores cercanos:</Text>
            {mockNearbyDrivers.slice(0, 4).map((driver, index) => (
              <TouchableOpacity
                key={driver.id}
                style={styles.driverItem}
                onPress={() => handleMarkerPress({
                  id: driver.id,
                  coordinate: driver.location,
                  title: driver.name,
                  description: `${driver.vehicle} - ${driver.eta} min`,
                  type: 'driver',
                })}
              >
                <Text style={styles.driverEmoji}>🚗</Text>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.driverDetails}>
                    {driver.vehicle} • ⭐ {driver.rating} • {driver.eta} min
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Markers */}
          {markers.map((marker) => (
            <TouchableOpacity
              key={marker.id}
              style={[styles.mapMarker, styles.customMarker]}
              onPress={() => handleMarkerPress(marker)}
            >
              <Text style={styles.markerEmoji}>
                {marker.icon || (marker.type === 'destination' ? '🎯' : '📌')}
              </Text>
              {marker.title && <Text style={styles.markerLabel}>{marker.title}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Marker Info */}
        {selectedMarker && (
          <View style={styles.selectedMarkerInfo}>
            <Text style={styles.selectedMarkerTitle}>{selectedMarker.title}</Text>
            {selectedMarker.description && (
              <Text style={styles.selectedMarkerDesc}>{selectedMarker.description}</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMarker(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Web Notice */}
      <View style={styles.webNotice}>
        <Text style={styles.webNoticeText}>
          ℹ️ Versión web - Usa la app móvil para el mapa interactivo completo
        </Text>
      </View>
    </View>
  );
};

// ==========================================
// Native Map Component (Mobile)
// ==========================================

let NativeMapView: any = null;
let NativeMarker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    NativeMapView = Maps.default;
    NativeMarker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn('react-native-maps not available');
  }
}

const NativeMap = forwardRef<MapViewRef, MapViewProps>(({
  style,
  initialRegion = ARMENIA_CONFIG.initialRegion,
  markers = [],
  showsUserLocation = true,
  showsMyLocationButton = false,
  showsCompass = false,
  onRegionChange,
  onMarkerPress,
  onMapPress,
  children,
}, ref) => {
  const mapRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: MapRegion, duration: number = 500) => {
      mapRef.current?.animateToRegion(region, duration);
    },
    fitToCoordinates: (coordinates: Coordinates[], options?: any) => {
      mapRef.current?.fitToCoordinates(coordinates, options);
    },
  }));

  if (!NativeMapView) {
    return <WebMapPlaceholder style={style} initialRegion={initialRegion} markers={markers} />;
  }

  return (
    <NativeMapView
      ref={mapRef}
      style={style}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      showsCompass={showsCompass}
      onRegionChangeComplete={onRegionChange}
      onPress={(e: any) => onMapPress?.(e.nativeEvent.coordinate)}
    >
      {markers.map((marker) => (
        <NativeMarker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          onPress={() => onMarkerPress?.(marker)}
        />
      ))}
      {children}
    </NativeMapView>
  );
});

// ==========================================
// Unified Map Component
// ==========================================

export const MapView = forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  if (Platform.OS === 'web') {
    return <WebMapPlaceholder {...props} forwardedRef={ref} />;
  }
  return <NativeMap {...props} ref={ref} />;
});

MapView.displayName = 'MapView';

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  webMapContent: {
    flex: 1,
    padding: SPACING.md,
  },
  webMapTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  webMapSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  mapGrid: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
  },
  mapMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  userMarker: {
    backgroundColor: COLORS.primaryLight,
  },
  customMarker: {
    backgroundColor: COLORS.secondaryLight,
  },
  markerEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  markerLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  driversContainer: {
    marginTop: SPACING.md,
  },
  driversTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  driverEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  driverDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  selectedMarkerInfo: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedMarkerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedMarkerDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  webNotice: {
    backgroundColor: COLORS.info,
    padding: SPACING.sm,
  },
  webNoticeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    textAlign: 'center',
  },
});
