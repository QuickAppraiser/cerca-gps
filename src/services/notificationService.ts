// ==========================================
// CERCA - Push Notifications Service
// With Expo Push Notifications
// ==========================================

import { Platform } from 'react-native';
import { config } from '../config/environment';

// Types
interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

interface NotificationResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface TripNotificationData {
  tripId: string;
  type: 'trip_request' | 'trip_accepted' | 'driver_arriving' | 'trip_started' | 'trip_completed' | 'trip_cancelled';
  title: string;
  body: string;
  data?: Record<string, any>;
}

// In development, we'll use mock notifications
const DEV_MODE = config.isDevelopment;

// Expo push notification setup (only import on native)
let Notifications: any = null;
let Device: any = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (e) {
    console.warn('expo-notifications not available');
  }
}

// Configure notification handler
const configureNotifications = () => {
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

// Initialize on import
configureNotifications();

export const notificationService = {
  // Register for push notifications
  async registerForPushNotifications(): Promise<NotificationResult> {
    if (DEV_MODE || !Notifications || !Device) {
      console.log('[DEV] Push notifications registration simulated');
      return {
        success: true,
        data: { token: 'dev-expo-push-token-' + Date.now() },
      };
    }

    try {
      // Check if physical device
      if (!Device.isDevice) {
        return {
          success: false,
          error: 'Push notifications require a physical device',
        };
      }

      // Get existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return {
          success: false,
          error: 'Permission to send push notifications was denied',
        };
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: config.expo?.projectId,
      });

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('trips', {
          name: 'Trip Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2D6A4F',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('emergency', {
          name: 'Emergency Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#E63946',
          sound: 'default',
        });
      }

      return {
        success: true,
        data: { token: tokenData.data },
      };
    } catch (error: any) {
      console.error('Error registering for push notifications:', error);
      return {
        success: false,
        error: error.message || 'Failed to register for push notifications',
      };
    }
  },

  // Save push token to user profile
  async savePushToken(userId: string, token: string): Promise<NotificationResult> {
    if (DEV_MODE) {
      console.log('[DEV] Push token saved:', token.substring(0, 20) + '...');
      return { success: true };
    }

    try {
      const { supabase } = require('./supabase');

      const { error } = await supabase
        .from('profiles')
        .update({
          push_token: token,
          push_token_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error saving push token:', error);
      return {
        success: false,
        error: error.message || 'Failed to save push token',
      };
    }
  },

  // Send local notification (for testing and immediate feedback)
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    channelId: string = 'trips'
  ): Promise<NotificationResult> {
    if (!Notifications) {
      console.log('[WEB] Local notification:', title, body);
      // On web, use browser notifications if available
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon.png' });
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              new Notification(title, { body, icon: '/icon.png' });
            }
          }
        } catch (e) {
          console.warn('Browser notification failed:', e);
        }
      }
      return { success: true };
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Immediate
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending local notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send notification',
      };
    }
  },

  // Trip-specific notifications
  async notifyTripRequest(
    driverPushToken: string,
    tripData: {
      tripId: string;
      passengerName: string;
      origin: string;
      destination: string;
      price: number;
      distance: number;
    }
  ): Promise<NotificationResult> {
    const notification: TripNotificationData = {
      tripId: tripData.tripId,
      type: 'trip_request',
      title: 'Nueva solicitud de viaje',
      body: `${tripData.passengerName} - $${tripData.price.toLocaleString()} (${tripData.distance.toFixed(1)} km)`,
      data: tripData,
    };

    return this.sendPushNotification(driverPushToken, notification);
  },

  async notifyTripAccepted(
    passengerPushToken: string,
    tripData: {
      tripId: string;
      driverName: string;
      vehicle: string;
      plate: string;
      eta: number;
    }
  ): Promise<NotificationResult> {
    const notification: TripNotificationData = {
      tripId: tripData.tripId,
      type: 'trip_accepted',
      title: 'Conductor en camino',
      body: `${tripData.driverName} llega en ${tripData.eta} min - ${tripData.vehicle} (${tripData.plate})`,
      data: tripData,
    };

    return this.sendPushNotification(passengerPushToken, notification);
  },

  async notifyDriverArriving(
    passengerPushToken: string,
    tripData: {
      tripId: string;
      driverName: string;
      eta: number;
    }
  ): Promise<NotificationResult> {
    const notification: TripNotificationData = {
      tripId: tripData.tripId,
      type: 'driver_arriving',
      title: 'Tu conductor esta llegando',
      body: `${tripData.driverName} esta a ${tripData.eta} minutos`,
      data: tripData,
    };

    return this.sendPushNotification(passengerPushToken, notification);
  },

  async notifyTripStarted(
    passengerPushToken: string,
    tripData: {
      tripId: string;
      destination: string;
    }
  ): Promise<NotificationResult> {
    const notification: TripNotificationData = {
      tripId: tripData.tripId,
      type: 'trip_started',
      title: 'Viaje iniciado',
      body: `En camino a ${tripData.destination}`,
      data: tripData,
    };

    return this.sendPushNotification(passengerPushToken, notification);
  },

  async notifyTripCompleted(
    userPushToken: string,
    tripData: {
      tripId: string;
      price: number;
      distance: number;
      duration: number;
    }
  ): Promise<NotificationResult> {
    const notification: TripNotificationData = {
      tripId: tripData.tripId,
      type: 'trip_completed',
      title: 'Viaje completado',
      body: `Total: $${tripData.price.toLocaleString()} - Califica tu experiencia`,
      data: tripData,
    };

    return this.sendPushNotification(userPushToken, notification);
  },

  async notifyTripCancelled(
    userPushToken: string,
    tripData: {
      tripId: string;
      reason: string;
      cancelledBy: 'passenger' | 'driver' | 'system';
    }
  ): Promise<NotificationResult> {
    const notification: TripNotificationData = {
      tripId: tripData.tripId,
      type: 'trip_cancelled',
      title: 'Viaje cancelado',
      body: tripData.cancelledBy === 'driver'
        ? 'El conductor cancelo el viaje'
        : tripData.cancelledBy === 'system'
        ? 'El viaje fue cancelado por el sistema'
        : 'Has cancelado el viaje',
      data: tripData,
    };

    return this.sendPushNotification(userPushToken, notification);
  },

  // Send push notification via Expo Push Service
  async sendPushNotification(
    expoPushToken: string,
    notification: TripNotificationData
  ): Promise<NotificationResult> {
    if (DEV_MODE) {
      console.log('[DEV] Push notification sent:', notification.title);
      // In dev mode, show as local notification if on native
      return this.sendLocalNotification(
        notification.title,
        notification.body,
        notification.data
      );
    }

    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          tripId: notification.tripId,
          type: notification.type,
        },
        channelId: notification.type === 'trip_request' ? 'trips' : 'default',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data?.status === 'error') {
        throw new Error(result.data.message);
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send push notification',
      };
    }
  },

  // Add notification listeners
  addNotificationListener(
    callback: (notification: any) => void
  ): () => void {
    if (!Notifications) {
      console.log('[WEB] Notification listener not available');
      return () => {};
    }

    const subscription = Notifications.addNotificationReceivedListener(callback);
    return () => subscription.remove();
  },

  addNotificationResponseListener(
    callback: (response: any) => void
  ): () => void {
    if (!Notifications) {
      console.log('[WEB] Notification response listener not available');
      return () => {};
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    return () => subscription.remove();
  },

  // Get last notification response (for handling notification opens)
  async getLastNotificationResponse(): Promise<any> {
    if (!Notifications) return null;

    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      console.error('Error getting last notification response:', error);
      return null;
    }
  },

  // Badge management
  async setBadgeCount(count: number): Promise<void> {
    if (!Notifications) return;

    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  },

  async clearBadge(): Promise<void> {
    return this.setBadgeCount(0);
  },
};
