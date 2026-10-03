// Device buzz — Capacitor Haptics on native, Vibration API on Android web.
import { Capacitor } from '@capacitor/core';

export type BuzzKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

let hapticsReady: Promise<typeof import('@capacitor/haptics') | null> | null = null;

function loadHaptics() {
  if (!hapticsReady) {
    hapticsReady = Capacitor.isNativePlatform()
      ? import('@capacitor/haptics').catch(() => null)
      : Promise.resolve(null);
  }
  return hapticsReady;
}

const VIBRATE_MS: Record<BuzzKind, number | number[]> = {
  light: 12,
  medium: 24,
  heavy: 40,
  success: [10, 40, 18],
  warning: [20, 30, 20],
  error: [40, 50, 60],
};

export function buzz(kind: BuzzKind = 'light') {
  void (async () => {
    try {
      const mod = await loadHaptics();
      if (mod) {
        const { Haptics, ImpactStyle, NotificationType } = mod;
        if (kind === 'success' || kind === 'warning' || kind === 'error') {
          const map = {
            success: NotificationType.Success,
            warning: NotificationType.Warning,
            error: NotificationType.Error,
          } as const;
          await Haptics.notification({ type: map[kind] });
          return;
        }
        const style = kind === 'heavy' ? ImpactStyle.Heavy
          : kind === 'medium' ? ImpactStyle.Medium
          : ImpactStyle.Light;
        await Haptics.impact({ style });
        return;
      }
    } catch { /* fall through */ }
    try {
      const pat = VIBRATE_MS[kind];
      navigator.vibrate?.(pat as number & number[]);
    } catch { /* ignore */ }
  })();
}
