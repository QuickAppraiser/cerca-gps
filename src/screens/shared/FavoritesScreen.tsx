// ==========================================
// CERCA - Favorites Screen
// Manage saved locations (home, work, etc.)
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/common/Card';

// ==========================================
// Types
// ==========================================

interface FavoritesScreenProps {
  navigation: any;
}

interface FavoriteLocation {
  id: string;
  name: string;
  address: string;
  icon: string;
  type: 'home' | 'work' | 'custom';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ==========================================
// Mock Data
// ==========================================

const DEFAULT_FAVORITES: FavoriteLocation[] = [
  {
    id: 'home',
    name: 'Casa',
    address: '',
    icon: '🏠',
    type: 'home',
  },
  {
    id: 'work',
    name: 'Trabajo',
    address: '',
    icon: '💼',
    type: 'work',
  },
];

// ==========================================
// Main Component
// ==========================================

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteLocation[]>(DEFAULT_FAVORITES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteLocation | null>(null);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // ==========================================
  // Handlers
  // ==========================================

  const handleEditFavorite = (favorite: FavoriteLocation) => {
    setEditingFavorite(favorite);
    setNewName(favorite.name);
    setNewAddress(favorite.address);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingFavorite(null);
    setNewName('');
    setNewAddress('');
    setShowAddModal(true);
  };

  const handleSaveFavorite = () => {
    if (!newAddress.trim()) {
      Alert.alert('Error', 'Por favor ingresa una direccion');
      return;
    }

    if (editingFavorite) {
      // Update existing
      setFavorites(prev =>
        prev.map(f =>
          f.id === editingFavorite.id
            ? { ...f, name: newName || f.name, address: newAddress }
            : f
        )
      );
    } else {
      // Add new
      if (!newName.trim()) {
        Alert.alert('Error', 'Por favor ingresa un nombre');
        return;
      }
      const newFavorite: FavoriteLocation = {
        id: `custom_${Date.now()}`,
        name: newName,
        address: newAddress,
        icon: '📍',
        type: 'custom',
      };
      setFavorites(prev => [...prev, newFavorite]);
    }

    setShowAddModal(false);
    setEditingFavorite(null);
    setNewName('');
    setNewAddress('');
  };

  const handleDeleteFavorite = (id: string) => {
    const favorite = favorites.find(f => f.id === id);
    if (favorite?.type !== 'custom') {
      // Just clear the address for home/work
      setFavorites(prev =>
        prev.map(f => (f.id === id ? { ...f, address: '' } : f))
      );
    } else {
      // Delete custom favorites
      Alert.alert(
        'Eliminar favorito',
        `Seguro que deseas eliminar "${favorite?.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => setFavorites(prev => prev.filter(f => f.id !== id)),
          },
        ]
      );
    }
  };

  const handleSelectDestination = (favorite: FavoriteLocation) => {
    if (!favorite.address) {
      handleEditFavorite(favorite);
      return;
    }

    // Navigate to confirm trip with this destination
    navigation.navigate('SetDestination', {
      prefilledAddress: favorite.address,
      prefilledName: favorite.name,
    });
  };

  // ==========================================
  // Render
  // ==========================================

  const renderFavoriteCard = (favorite: FavoriteLocation) => {
    const hasAddress = !!favorite.address;

    return (
      <TouchableOpacity
        key={favorite.id}
        style={styles.favoriteCard}
        onPress={() => handleSelectDestination(favorite)}
        onLongPress={() => hasAddress && handleDeleteFavorite(favorite.id)}
      >
        <View style={styles.favoriteIcon}>
          <Text style={styles.favoriteIconText}>{favorite.icon}</Text>
        </View>
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteName}>{favorite.name}</Text>
          {hasAddress ? (
            <Text style={styles.favoriteAddress} numberOfLines={1}>
              {favorite.address}
            </Text>
          ) : (
            <Text style={styles.favoriteEmpty}>Toca para agregar direccion</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditFavorite(favorite)}
        >
          <Text style={styles.editButtonText}>
            {hasAddress ? '✏️' : '➕'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lugares Favoritos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso rapido</Text>
          <Text style={styles.sectionSubtitle}>
            Guarda tus lugares frecuentes para viajar mas rapido
          </Text>

          {favorites
            .filter(f => f.type === 'home' || f.type === 'work')
            .map(renderFavoriteCard)}
        </View>

        {/* Custom Favorites */}
        {favorites.filter(f => f.type === 'custom').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Otros lugares</Text>
            {favorites.filter(f => f.type === 'custom').map(renderFavoriteCard)}
          </View>
        )}

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Consejos</Text>
          <Text style={styles.tipsText}>
            • Mantén presionado un favorito para eliminarlo{'\n'}
            • Tus favoritos aparecerán como sugerencias al buscar destino{'\n'}
            • Guarda Casa y Trabajo para acceso con un solo toque
          </Text>
        </Card>

        {/* Recent Destinations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinos recientes</Text>
          <Card style={styles.recentCard}>
            <View style={styles.recentItem}>
              <Text style={styles.recentIcon}>🕐</Text>
              <View style={styles.recentInfo}>
                <Text style={styles.recentAddress}>Centro Comercial Portal</Text>
                <Text style={styles.recentTime}>Hace 2 dias</Text>
              </View>
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentDivider} />
            <View style={styles.recentItem}>
              <Text style={styles.recentIcon}>🕐</Text>
              <View style={styles.recentInfo}>
                <Text style={styles.recentAddress}>Terminal de Transporte</Text>
                <Text style={styles.recentTime}>Hace 5 dias</Text>
              </View>
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingFavorite ? `Editar ${editingFavorite.name}` : 'Agregar favorito'}
            </Text>

            {!editingFavorite && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Ej: Gimnasio, Casa de mama..."
                  placeholderTextColor={COLORS.gray[400]}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Direccion</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={newAddress}
                onChangeText={setNewAddress}
                placeholder="Ingresa la direccion completa"
                placeholderTextColor={COLORS.gray[400]}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingFavorite(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={handleSaveFavorite}
              >
                <Text style={styles.saveModalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==========================================
// Styles
// ==========================================

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
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  favoriteIconText: {
    fontSize: 24,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  favoriteAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  favoriteEmpty: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
  },
  tipsCard: {
    backgroundColor: COLORS.primaryLight + '20',
    marginBottom: SPACING.lg,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  tipsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  recentCard: {
    padding: 0,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  recentDivider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginHorizontal: SPACING.md,
  },
  recentIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentAddress: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  recentTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveModalButton: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveModalButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
});
