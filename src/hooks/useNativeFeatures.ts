import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export const useNativeFeatures = () => {
  const isNative = Capacitor.isNativePlatform();
  const { data: profile } = useProfile();

  // Push Notifications
  const initPushNotifications = useCallback(async () => {
    if (!isNative) return;

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive === 'granted') {
      await PushNotifications.register();
    }

    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration token:', token.value);
      if (!profile) return;
      const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
      const { error } = await supabase.from('push_tokens').upsert(
        {
          profile_id: profile.id,
          token: token.value,
          platform,
        },
        { onConflict: 'token' },
      );
      if (error) console.error('Failed to store push token:', error);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err.error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action:', notification);
    });
  }, [isNative, profile]);

  // Camera
  const takePhoto = useCallback(async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Let user choose camera or gallery
    });
    return image;
  }, []);

  const pickFromGallery = useCallback(async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });
    return image;
  }, []);

  // Geolocation
  const getCurrentPosition = useCallback(async () => {
    const permResult = await Geolocation.requestPermissions();
    if (permResult.location === 'granted' || permResult.coarseLocation === 'granted') {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }
    return null;
  }, []);

  // Initialize push notifications when profile is available
  useEffect(() => {
    if (isNative && profile) {
      initPushNotifications();
    }
  }, [isNative, profile, initPushNotifications]);

  return {
    isNative,
    takePhoto,
    pickFromGallery,
    getCurrentPosition,
  };
};
