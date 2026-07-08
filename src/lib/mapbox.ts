// Public Mapbox access token (pk.*). Safe to ship in the client bundle; access
// is restricted server-side via URL allow-lists on the Mapbox account.
// Kept out of source so it can be rotated / scoped per environment.
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

if (!MAPBOX_TOKEN && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[mapbox] VITE_MAPBOX_TOKEN is not set. Map and geocoding features will not work. ' +
      'Add it to your .env file.',
  );
}
