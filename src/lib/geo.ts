import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type SystemLocationPermission = 'granted' | 'denied' | 'prompt' | 'unavailable';

/** Current OS/browser permission for location — never triggers a prompt. */
export async function checkLocationPermission(): Promise<SystemLocationPermission> {
  try {
    if (Capacitor.isNativePlatform()) {
      const p = await Geolocation.checkPermissions();
      if (p.location === 'granted' || p.coarseLocation === 'granted') return 'granted';
      if (p.location === 'denied') return 'denied';
      return 'prompt';
    }
    if (!('geolocation' in navigator)) return 'unavailable';
    if (!navigator.permissions?.query) return 'prompt';
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Shows the OS/browser location prompt (only if it can still be shown).
 * Returns true when the app may read the location afterwards.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const p = await Geolocation.requestPermissions();
      return p.location === 'granted' || p.coarseLocation === 'granted';
    }
    // Browsers have no separate permission call: a position request triggers the prompt.
    return (await readPosition()) !== null;
  } catch {
    return false;
  }
}

/** One position read. Never prompts on native; returns null when not allowed or unavailable. */
export async function readPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      if ((await checkLocationPermission()) !== 'granted') return null;
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10_000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
    if (!('geolocation' in navigator)) return null;
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
      );
    });
  } catch {
    return null;
  }
}

/** Where to re-enable location once the OS permission was denied (no prompt can be shown anymore). */
export function deniedLocationHint(): string {
  if (Capacitor.getPlatform() === 'ios') return 'Öffne Einstellungen → Feyrn → Standort und wähle „Beim Verwenden der App“.';
  if (Capacitor.getPlatform() === 'android') return 'Öffne Einstellungen → Apps → Feyrn → Berechtigungen → Standort.';
  return 'Erlaube den Standort in den Website-Einstellungen deines Browsers (Schloss-Symbol neben der Adresse).';
}
