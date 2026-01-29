// ==========================================
// CERCA - Trip Completed Screen
// Post-trip rating and summary
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { ratingService, RATING_TAGS } from '../../services/ratingService';
import { walletService } from '../../services/walletService';
import { formatCurrency, formatDistance, formatDuration } from '../../utils/validation';

type TripCompletedScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export const TripCompletedScreen: React.FC<TripCompletedScreenProps> = ({
  navigation,
  route,
}) => {
  const { trip, userRole = 'passenger' } = route.params || {};

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const { user } = useAuthStore();

  // Get the person being rated
  const ratedPerson = userRole === 'passenger' ? trip?.driver : trip?.passenger;
  const ratingTags = userRole === 'passenger' ? RATING_TAGS.driver : RATING_TAGS.passenger;

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmitRating = async () => {
    if (!user?.id || !ratedPerson?.id || !trip?.id) {
      Alert.alert('Error', 'Informacion del viaje incompleta');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await ratingService.submitRating({
        tripId: trip.id,
        raterId: user.id,
        ratedId: ratedPerson.id,
        raterRole: userRole,
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      if (result.success) {
        setHasRated(true);

        // If paid with credits, process payment
        if (trip.paymentMethod === 'credits' && userRole === 'passenger') {
          await walletService.payTrip({
            userId: user.id,
            tripId: trip.id,
            amount: trip.finalPrice || trip.estimatedPrice,
            paymentMethod: 'credits',
          });
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudo enviar la calificacion');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigation.replace('Home');
  };

  const handleFinish = () => {
    navigation.replace('Home');
  };

  // Trip summary data
  const tripSummary = {
    origin: trip?.origin?.address || 'Origen',
    destination: trip?.destination?.address || 'Destino',
    distance: trip?.route?.distance || trip?.estimatedDistance || 0,
    duration: trip?.route?.duration || trip?.estimatedDuration || 0,
    price: trip?.finalPrice || trip?.estimatedPrice || 0,
    paymentMethod: trip?.paymentMethod || 'cash',
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
          >
            <Text style={[styles.star, star <= rating && styles.starFilled]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTags = () => {
    return (
      <View style={styles.tagsContainer}>
        {ratingTags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            style={[
              styles.tag,
              selectedTags.includes(tag.id) && styles.tagSelected,
            ]}
            onPress={() => handleTagToggle(tag.id)}
          >
            <Text style={styles.tagIcon}>{tag.icon}</Text>
            <Text
              style={[
                styles.tagLabel,
                selectedTags.includes(tag.id) && styles.tagLabelSelected,
              ]}
            >
              {tag.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (hasRated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.successTitle}>Gracias por tu calificacion!</Text>
          <Text style={styles.successSubtitle}>
            Tu opinion nos ayuda a mejorar el servicio
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total pagado</Text>
              <Text style={styles.summaryValue}>{formatCurrency(tripSummary.price)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Metodo de pago</Text>
              <Text style={styles.summaryValue}>
                {tripSummary.paymentMethod === 'credits' ? '💳 Creditos' : '💵 Efectivo'}
              </Text>
            </View>
          </View>

          <Button
            title="Volver al inicio"
            onPress={handleFinish}
            fullWidth
            size="lg"
            style={styles.finishButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Completed Header */}
        <View style={styles.header}>
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkIcon}>✓</Text>
          </View>
          <Text style={styles.title}>Viaje completado!</Text>
        </View>

        {/* Trip Summary */}
        <Card style={styles.tripSummary}>
          <View style={styles.tripLocations}>
            <View style={styles.tripLocation}>
              <View style={[styles.dot, styles.originDot]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {tripSummary.origin}
              </Text>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.tripLocation}>
              <View style={[styles.dot, styles.destinationDot]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {tripSummary.destination}
              </Text>
            </View>
          </View>

          <View style={styles.tripStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDistance(tripSummary.distance)}</Text>
              <Text style={styles.statLabel}>Distancia</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(tripSummary.duration)}</Text>
              <Text style={styles.statLabel}>Duracion</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.priceValue]}>
                {formatCurrency(tripSummary.price)}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Card>

        {/* Rate Driver/Passenger */}
        <Card style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>
            Como fue tu experiencia con {ratedPerson?.name || (userRole === 'passenger' ? 'el conductor' : 'el pasajero')}?
          </Text>

          {/* Avatar */}
          <View style={styles.ratedPersonInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userRole === 'passenger' ? '🚗' : '👤'}
              </Text>
            </View>
            <View style={styles.ratedPersonDetails}>
              <Text style={styles.ratedPersonName}>
                {ratedPerson?.name || 'Usuario'}
              </Text>
              {ratedPerson?.rating && (
                <Text style={styles.ratedPersonRating}>
                  ⭐ {ratedPerson.rating.toFixed(1)}
                </Text>
              )}
            </View>
          </View>

          {/* Star Rating */}
          {renderStars()}

          <Text style={styles.ratingHint}>
            {rating === 5 && 'Excelente!'}
            {rating === 4 && 'Muy bien!'}
            {rating === 3 && 'Bien'}
            {rating === 2 && 'Regular'}
            {rating === 1 && 'Malo'}
          </Text>

          {/* Tags */}
          <Text style={styles.tagsTitle}>Que te gusto?</Text>
          {renderTags()}

          {/* Comment */}
          <Text style={styles.commentLabel}>Comentario (opcional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Cuentanos mas sobre tu experiencia..."
            placeholderTextColor={COLORS.gray[400]}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Omitir</Text>
        </TouchableOpacity>
        <Button
          title="Enviar calificacion"
          onPress={handleSubmitRating}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  checkmarkIcon: {
    fontSize: 40,
    color: COLORS.white,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  tripSummary: {
    marginBottom: SPACING.lg,
  },
  tripLocations: {
    marginBottom: SPACING.md,
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  originDot: {
    backgroundColor: COLORS.primary,
  },
  destinationDot: {
    backgroundColor: COLORS.emergency,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray[300],
    marginLeft: 5,
    marginVertical: 4,
  },
  locationText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  tripStats: {
    flexDirection: 'row',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
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
  priceValue: {
    color: COLORS.primary,
  },
  ratingCard: {
    marginBottom: SPACING.lg,
  },
  ratingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  ratedPersonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 30,
  },
  ratedPersonDetails: {
    alignItems: 'flex-start',
  },
  ratedPersonName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ratedPersonRating: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  starButton: {
    padding: SPACING.xs,
  },
  star: {
    fontSize: 48,
    color: COLORS.gray[300],
  },
  starFilled: {
    color: COLORS.warning,
  },
  ratingHint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  tagsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  tagSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  tagIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  tagLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  tagLabelSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  commentLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  commentInput: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: SPACING.md,
  },
  skipButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successEmoji: {
    fontSize: 50,
  },
  successTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  finishButton: {
    width: '100%',
  },
});
