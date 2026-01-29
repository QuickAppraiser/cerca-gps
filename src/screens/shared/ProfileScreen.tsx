// ==========================================
// CERCA - Profile Screen
// User profile with stats and settings
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { ratingService } from '../../services/ratingService';
import { formatCurrency } from '../../utils/validation';
import { config } from '../../config/environment';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: Record<number, number>;
  commonTags: { tag: string; count: number }[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);

  const { user, logout } = useAuthStore();
  const isDriver = user?.role === 'driver';

  useEffect(() => {
    loadRatingStats();
  }, []);

  const loadRatingStats = async () => {
    if (!user?.id) return;

    const result = await ratingService.getUserRatingStats(user.id);
    if (result.success) {
      setRatingStats(result.data);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesion',
      'Estas seguro de que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Si, salir',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            await authService.signOut();
            logout();
            // Navigation handled by AppNavigator
          },
        },
      ]
    );
  };

  const getTagLabel = (tagId: string) => {
    return ratingService.getTagLabel(tagId, isDriver ? 'driver' : 'passenger');
  };

  const getTagIcon = (tagId: string) => {
    return ratingService.getTagIcon(tagId, isDriver ? 'driver' : 'passenger');
  };

  const menuItems = [
    {
      id: 'trips',
      icon: '📜',
      label: 'Historial de viajes',
      onPress: () => navigation.navigate('TripHistory'),
    },
    {
      id: 'credits',
      icon: '💳',
      label: 'Creditos y pagos',
      onPress: () => navigation.navigate('Credits'),
      badge: user?.credits ? formatCurrency(user.credits) : undefined,
    },
    {
      id: 'promos',
      icon: '🎟️',
      label: 'Codigos promocionales',
      onPress: () => navigation.navigate('Promos'),
    },
    {
      id: 'referrals',
      icon: '🎁',
      label: 'Invitar amigos',
      onPress: () => navigation.navigate('Referrals'),
    },
    {
      id: 'favorites',
      icon: '⭐',
      label: 'Lugares favoritos',
      onPress: () => navigation.navigate('Favorites'),
    },
    {
      id: 'emergency',
      icon: '🆘',
      label: 'Contactos de emergencia',
      onPress: () => navigation.navigate('EmergencyContacts'),
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Configuracion',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'help',
      icon: '❓',
      label: 'Ayuda y soporte',
      onPress: () => navigation.navigate('Support'),
    },
  ];

  // Driver-specific menu items
  if (isDriver) {
    menuItems.splice(2, 0, {
      id: 'earnings',
      icon: '💰',
      label: 'Mis ganancias',
      onPress: () => navigation.navigate('DriverEarnings'),
    });
    menuItems.splice(3, 0, {
      id: 'documents',
      icon: '📄',
      label: 'Mis documentos',
      onPress: () => navigation.navigate('Documents'),
    });
    menuItems.splice(4, 0, {
      id: 'vehicle',
      icon: '🚗',
      label: 'Mi vehiculo',
      onPress: () => navigation.navigate('Vehicle'),
    });
  }

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <View style={styles.ratingBar} key={stars}>
        <Text style={styles.ratingBarLabel}>{stars}</Text>
        <View style={styles.ratingBarTrack}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Mi perfil</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dev Mode Banner */}
        {config.isDevelopment && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerText}>Modo desarrollo</Text>
          </View>
        )}

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]?.toUpperCase() || '👤'}
              </Text>
            </View>
            {isDriver && (
              <View style={styles.driverBadge}>
                <Text style={styles.driverBadgeText}>🚗 Conductor</Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⭐ {user?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalTrips || 0}</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.tokens || 0}</Text>
              <Text style={styles.statLabel}>Tokens</Text>
            </View>
          </View>
        </Card>

        {/* Rating Stats */}
        {ratingStats && ratingStats.totalRatings > 0 && (
          <Card style={styles.ratingsCard}>
            <View style={styles.ratingsHeader}>
              <Text style={styles.ratingsTitle}>Mis calificaciones</Text>
              <Text style={styles.ratingsCount}>
                {ratingStats.totalRatings} opiniones
              </Text>
            </View>

            {/* Rating Bars */}
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((stars) =>
                renderRatingBar(
                  stars,
                  ratingStats.ratingBreakdown[stars] || 0,
                  ratingStats.totalRatings
                )
              )}
            </View>

            {/* Common Tags */}
            {ratingStats.commonTags.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.tagsTitle}>Lo que dicen de ti</Text>
                <View style={styles.tags}>
                  {ratingStats.commonTags.slice(0, 4).map((tag) => (
                    <View key={tag.tag} style={styles.tag}>
                      <Text style={styles.tagIcon}>{getTagIcon(tag.tag)}</Text>
                      <Text style={styles.tagLabel}>{getTagLabel(tag.tag)}</Text>
                      <Text style={styles.tagCount}>{tag.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badge && (
                <Text style={styles.menuBadge}>{item.badge}</Text>
              )}
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Become Driver (for passengers) */}
        {!isDriver && (
          <Card style={styles.becomeDriverCard}>
            <View style={styles.becomeDriverContent}>
              <Text style={styles.becomeDriverIcon}>🚗</Text>
              <View style={styles.becomeDriverText}>
                <Text style={styles.becomeDriverTitle}>
                  Quieres ser conductor CERCA?
                </Text>
                <Text style={styles.becomeDriverSubtitle}>
                  Genera ingresos manejando con nosotros
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.becomeDriverButton}
              onPress={() => navigation.navigate('DriverRegister')}
            >
              <Text style={styles.becomeDriverButtonText}>Registrarme</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.error} />
          ) : (
            <Text style={styles.logoutText}>Cerrar sesion</Text>
          )}
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>
          CERCA v1.0.0 {config.isDevelopment ? '(Dev)' : ''}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
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
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  devBanner: {
    backgroundColor: COLORS.warning,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  devBannerText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  driverBadge: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  driverBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userPhone: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.gray[200],
  },
  ratingsCard: {
    marginBottom: SPACING.lg,
  },
  ratingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ratingsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ratingsCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  ratingBars: {
    gap: SPACING.xs,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ratingBarLabel: {
    width: 16,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
    borderRadius: 4,
  },
  ratingBarCount: {
    width: 30,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  tagsSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  tagsTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  tagIcon: {
    fontSize: 14,
  },
  tagLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  tagCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  menuIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  menuBadge: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  menuArrow: {
    fontSize: 24,
    color: COLORS.gray[400],
  },
  becomeDriverCard: {
    backgroundColor: COLORS.secondary + '15',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    marginBottom: SPACING.lg,
  },
  becomeDriverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  becomeDriverIcon: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  becomeDriverText: {
    flex: 1,
  },
  becomeDriverTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  becomeDriverSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  becomeDriverButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  becomeDriverButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  logoutButton: {
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '500',
  },
  version: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
});
