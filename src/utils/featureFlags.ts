/**
 * Feature flags for gradual rollout of new features
 */

export class FeatureFlags {
  /**
   * Enable single-phase OCR for improved accuracy and performance
   */
  public static enableSinglePhaseOCR(): void {
    if (typeof window !== 'undefined') {
      if (!window.EXPERIMENTAL_FEATURES) {
        (window as any).EXPERIMENTAL_FEATURES = {};
      }
      (window as any).EXPERIMENTAL_FEATURES.singlePhaseOCR = true;
      console.log('🔬 Single-phase OCR enabled via feature flag');
    }
  }

  /**
   * Disable single-phase OCR (fallback to traditional approach)
   */
  public static disableSinglePhaseOCR(): void {
    if (typeof window !== 'undefined' && (window as any).EXPERIMENTAL_FEATURES) {
      (window as any).EXPERIMENTAL_FEATURES.singlePhaseOCR = false;
      console.log('🔬 Single-phase OCR disabled via feature flag');
    }
  }

  /**
   * Check if single-phase OCR is enabled
   */
  public static isSinglePhaseOCREnabled(): boolean {
    return process.env.NODE_ENV === 'development' || 
           (typeof window !== 'undefined' && 
            (window as any).EXPERIMENTAL_FEATURES?.singlePhaseOCR === true);
  }
}