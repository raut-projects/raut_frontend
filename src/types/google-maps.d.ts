/**
 * Ambient declaration for the Google Maps JS API loaded via script tag.
 * `window.google` is typed loosely because only place/map access is needed.
 */
declare global {
  interface Window {
    google?: any;
  }
}
export {};
