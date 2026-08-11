import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Capacitor configuration.
 *
 * NOTE: no `server.url` is set — the native app must load the bundled web
 * assets from `dist/`. For local hot-reload against the Lovable sandbox, set
 * CAP_SERVER_URL when running `npx cap sync` (never for release builds).
 */
const devServerUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  // TODO(release-blocker): replace with the final reverse-DNS bundle identifier
  // (e.g. de.feyrn.app) once the Apple/Google developer accounts are set up.
  // This value must match the iOS Bundle ID and the Android applicationId.
  appId: 'app.lovable.9f6d8b6f42e546a3b92c0b1a93b59e9d',
  appName: 'Feyrn',
  webDir: 'dist',
  ...(devServerUrl ? { server: { url: devServerUrl, cleartext: true } } : {}),
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      // Never block the app: hide automatically after a short timeout.
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#08080F',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#08080F',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
