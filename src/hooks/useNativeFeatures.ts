import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';

export const useNativeFeatures = () => {
  const isNative = Capacitor.isNativePlatform();

  // Push Notifications
  const initPushNotifications = useCallback(async () => {
    if (!isNative) return;

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive === 'granted') {
      await PushNotifications.register();
    }

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      // TODO: Send token to backend for storage
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
  }, [isNative]);

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

  // Initialize push notifications on mount
  useEffect(() => {
    if (isNative) {
      initPushNotifications();
    }
  }, [isNative, initPushNotifications]);

  return {
    isNative,
    takePhoto,
    pickFromGallery,
    getCurrentPosition,
  };
};
