export type RuntimeEnv = 'web' | 'tauri' | 'electron';

export function getRuntime(): RuntimeEnv {
  if (typeof window !== 'undefined') {
    const w = window as any;
    if (w.isElectron) return 'electron';
    if (w.__TAURI__) return 'tauri';
  }
  return 'web';
}

export function isElectron(): boolean {
  return getRuntime() === 'electron';
}

export function isTauri(): boolean {
  return getRuntime() === 'tauri';
}

export function isWeb(): boolean {
  return getRuntime() === 'web';
}
