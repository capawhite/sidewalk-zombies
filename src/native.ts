// Capacitor hooks. No-ops in the browser; on a device they make the status bar overlay the WebView
// so the existing safe-area CSS keeps the HUD off the notch.
import { Capacitor } from '@capacitor/core';

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setOverlaysWebView({ overlay: true });
  await StatusBar.setStyle({ style: Style.Dark });
}
