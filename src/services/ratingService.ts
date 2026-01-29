// ==========================================
// CERCA - Rating Service
// Handles post-trip ratings and reviews
// ==========================================

import { supabase } from './supabase';
import { config } from '../config/environment';

// ==========================================
// Types
// ==========================================

export interface RatingResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface RatingData {
  tripId: string;
  raterId: string;
  ratedId: string;
  raterRole: 'passenger' | 'driver';
  rating: number; // 1-5 stars
  comment?: string;
  tags?: string[]; // e.g., ['punctual', 'clean_car', 'friendly']
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  commonTags: { tag: string; count: number }[];
}

// ==========================================
// Development Mode
// ==========================================

const DEV_MODE = config.features.enableMockData;

// Predefined rating tags
export const RATING_TAGS = {
  passenger: [
    { id: 'friendly', label: 'Amigable', icon: '😊' },
    { id: 'polite', label: 'Educado', icon: '🙏' },
    { id: 'punctual', label: 'Puntual', icon: '⏰' },
    { id: 'clean', label: 'Limpio', icon: '✨' },
    { id: 'respectful', label: 'Respetuoso', icon: '🤝' },
    { id: 'good_directions', label: 'Buenas indicaciones', icon: '📍' },
  ],
  driver: [
    { id: 'safe_driving', label: 'Conduccion segura', icon: '🛡️' },
    { id: 'clean_car', label: 'Auto limpio', icon: '🚗' },
    { id: 'punctual', label: 'Puntual', icon: '⏰' },
    { id: 'friendly', label: 'Amigable', icon: '😊' },
    { id: 'good_music', label: 'Buena musica', icon: '🎵' },
    { id: 'knows_route', label: 'Conoce la ruta', icon: '🗺️' },
    { id: 'ac_working', label: 'Aire acondicionado', icon: '❄️' },
    { id: 'helpful', label: 'Servicial', icon: '🙌' },
  ],
};

// ==========================================
// Rating Service
// ==========================================

export const ratingService = {
  /**
   * Submit a rating for a trip
   */
  async submitRating(data: RatingData): Promise<RatingResult> {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: 'La calificacion debe ser entre 1 y 5' };
    }

    if (DEV_MODE) {
      console.log('[DEV] Rating submitted:', data.rating, 'stars for', data.raterRole === 'passenger' ? 'driver' : 'passenger');

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        data: {
          id: `rating_${Date.now()}`,
          ...data,
          createdAt: new Date(),
        },
      };
    }

    try {
      // Insert rating
      const { data: rating, error: ratingError } = await supabase
        .from('ratings')
        .insert({
          trip_id: data.tripId,
          rater_id: data.raterId,
          rated_id: data.ratedId,
          rater_role: data.raterRole,
          rating: data.rating,
          comment: data.comment,
          tags: data.tags || [],
        })
        .select()
        .single();

      if (ratingError) {
        console.error('Submit rating error:', ratingError);
        return { success: false, error: 'Error al enviar calificacion' };
      }

      // Update trip with rating
      const ratingField = data.raterRole === 'passenger' ? 'rating_for_driver' : 'rating_for_passenger';
      await supabase
        .from('trips')
        .update({ [ratingField]: data.rating })
        .eq('id', data.tripId);

      // Update user's average rating
      await this.updateUserRating(data.ratedId);

      return { success: true, data: rating };
    } catch (err) {
      console.error('Submit rating exception:', err);
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Update user's average rating based on all their ratings
   */
  async updateUserRating(userId: string): Promise<void> {
    if (DEV_MODE) {
      console.log('[DEV] Updated user rating for:', userId);
      return;
    }

    try {
      // Get all ratings for this user
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_id', userId);

      if (ratings && ratings.length > 0) {
        const total = ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
        const average = total / ratings.length;

        // Update user's rating in profiles
        await supabase
          .from('profiles')
          .update({ rating: parseFloat(average.toFixed(2)) })
          .eq('id', userId);
      }
    } catch (err) {
      console.error('Error updating user rating:', err);
    }
  },

  /**
   * Get rating statistics for a user
   */
  async getUserRatingStats(userId: string): Promise<RatingResult> {
    if (DEV_MODE) {
      // Return mock stats
      return {
        success: true,
        data: {
          averageRating: 4.8,
          totalRatings: 156,
          ratingBreakdown: {
            5: 120,
            4: 28,
            3: 6,
            2: 1,
            1: 1,
          },
          commonTags: [
            { tag: 'friendly', count: 89 },
            { tag: 'punctual', count: 76 },
            { tag: 'clean_car', count: 65 },
            { tag: 'safe_driving', count: 54 },
          ],
        } as RatingStats,
      };
    }

    try {
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select('rating, tags')
        .eq('rated_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      if (!ratings || ratings.length === 0) {
        return {
          success: true,
          data: {
            averageRating: 5.0,
            totalRatings: 0,
            ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            commonTags: [],
          },
        };
      }

      // Calculate stats
      const total = ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
      const averageRating = parseFloat((total / ratings.length).toFixed(2));

      const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r: any) => {
        ratingBreakdown[r.rating as keyof typeof ratingBreakdown]++;
      });

      // Count tags
      const tagCounts: Record<string, number> = {};
      ratings.forEach((r: any) => {
        (r.tags || []).forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const commonTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      return {
        success: true,
        data: {
          averageRating,
          totalRatings: ratings.length,
          ratingBreakdown,
          commonTags,
        },
      };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Get recent ratings for a user
   */
  async getUserRecentRatings(
    userId: string,
    limit: number = 10
  ): Promise<RatingResult> {
    if (DEV_MODE) {
      return {
        success: true,
        data: [
          {
            id: 'rating_1',
            rating: 5,
            comment: 'Excelente conductor, muy amable!',
            tags: ['friendly', 'safe_driving'],
            raterRole: 'passenger',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          },
          {
            id: 'rating_2',
            rating: 5,
            comment: 'Puntual y carro muy limpio',
            tags: ['punctual', 'clean_car'],
            raterRole: 'passenger',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
          {
            id: 'rating_3',
            rating: 4,
            comment: 'Buen servicio',
            tags: ['friendly'],
            raterRole: 'passenger',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          },
        ],
      };
    }

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('rated_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Check if a trip has already been rated
   */
  async hasRated(tripId: string, raterId: string): Promise<boolean> {
    if (DEV_MODE) {
      return false;
    }

    try {
      const { data } = await supabase
        .from('ratings')
        .select('id')
        .eq('trip_id', tripId)
        .eq('rater_id', raterId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  },

  /**
   * Report an issue with a trip
   */
  async reportIssue(
    tripId: string,
    reporterId: string,
    issueType: string,
    description: string
  ): Promise<RatingResult> {
    if (DEV_MODE) {
      console.log('[DEV] Issue reported:', issueType);

      return {
        success: true,
        data: {
          id: `report_${Date.now()}`,
          tripId,
          reporterId,
          issueType,
          description,
          status: 'pending',
          createdAt: new Date(),
        },
      };
    }

    try {
      const { data, error } = await supabase
        .from('trip_reports')
        .insert({
          trip_id: tripId,
          reporter_id: reporterId,
          issue_type: issueType,
          description,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Error al reportar problema' };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Get tag label by ID
   */
  getTagLabel(tagId: string, role: 'passenger' | 'driver'): string {
    const tags = RATING_TAGS[role];
    const tag = tags.find((t) => t.id === tagId);
    return tag?.label || tagId;
  },

  /**
   * Get tag icon by ID
   */
  getTagIcon(tagId: string, role: 'passenger' | 'driver'): string {
    const tags = RATING_TAGS[role];
    const tag = tags.find((t) => t.id === tagId);
    return tag?.icon || '📝';
  },
};
