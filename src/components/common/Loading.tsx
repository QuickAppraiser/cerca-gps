// ==========================================
// CERCA - Loading Components
// Spinner, skeleton screens, and loading states
// ==========================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';

// ==========================================
// Full Screen Loading Spinner
// ==========================================

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Cargando...',
  showLogo = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.loadingScreen}>
      {showLogo && (
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logo}>🚗</Text>
        </Animated.View>
      )}
      <Text style={styles.appName}>CERCA</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
      <Text style={styles.loadingMessage}>{message}</Text>
    </View>
  );
};

// ==========================================
// Inline Loading Spinner
// ==========================================

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'small',
  color = COLORS.primary,
  message,
}) => (
  <View style={styles.spinnerContainer}>
    <ActivityIndicator size={size} color={color} />
    {message && <Text style={styles.spinnerMessage}>{message}</Text>}
  </View>
);

// ==========================================
// Skeleton Components for Loading States
// ==========================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// ==========================================
// Card Skeleton
// ==========================================

export const CardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.cardSkeletonHeader}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.cardSkeletonHeaderText}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
    <Skeleton width="100%" height={14} style={{ marginTop: 16 }} />
    <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
  </View>
);

// ==========================================
// List Skeleton
// ==========================================

interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3 }) => (
  <View style={styles.listSkeleton}>
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={styles.listSkeletonItem}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.listSkeletonContent}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
    ))}
  </View>
);

// ==========================================
// Map Skeleton
// ==========================================

export const MapSkeleton: React.FC = () => (
  <View style={styles.mapSkeleton}>
    <View style={styles.mapSkeletonContent}>
      <Text style={styles.mapSkeletonIcon}>🗺️</Text>
      <Text style={styles.mapSkeletonText}>Cargando mapa...</Text>
      <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
    </View>
  </View>
);

// ==========================================
// Button Loading State
// ==========================================

interface LoadingButtonProps {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<{ visible: boolean; message?: string }> = ({
  visible,
  message = 'Procesando...',
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.overlayMessage}>{message}</Text>
      </View>
    </View>
  );
};

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  // Loading Screen
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logo: {
    fontSize: 64,
  },
  appName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xl,
    letterSpacing: 4,
  },
  spinner: {
    marginBottom: SPACING.md,
  },
  loadingMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Spinner
  spinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  spinnerMessage: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Skeleton
  skeleton: {
    backgroundColor: COLORS.gray[200],
  },

  // Card Skeleton
  cardSkeleton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSkeletonHeaderText: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  // List Skeleton
  listSkeleton: {
    padding: SPACING.md,
  },
  listSkeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  listSkeletonContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  // Map Skeleton
  mapSkeleton: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapSkeletonContent: {
    alignItems: 'center',
  },
  mapSkeletonIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  mapSkeletonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  overlayMessage: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
});
