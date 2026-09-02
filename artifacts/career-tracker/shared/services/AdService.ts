/**
 * AdService — Abstract ad integration layer.
 *
 * Cross-cutting infrastructure (not a domain) — kept at the top level
 * because monetization is orthogonal to product domains.
 *
 * Production implementation would initialize AppLovin MAX SDK and
 * BidMachine SDK (requires a native/EAS build, not available in Expo Go).
 * This stub provides the full interface so swapping in real SDKs later
 * requires changes only in this file.
 */

interface IAdService {
  initialize(): Promise<void>;
  showBannerAd(): void;
  hideBannerAd(): void;
  showInterstitialAd(): Promise<boolean>;
  isBannerReady(): boolean;
  isInterstitialReady(): boolean;
  destroy(): void;
}

class AdServiceImpl implements IAdService {
  private initialized = false;
  private bannerVisible = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  showBannerAd(): void {
    if (!this.initialized) return;
    this.bannerVisible = true;
  }

  hideBannerAd(): void {
    if (!this.initialized) return;
    this.bannerVisible = false;
  }

  async showInterstitialAd(): Promise<boolean> {
    if (!this.initialized) return false;
    return false;
  }

  isBannerReady(): boolean {
    return this.initialized;
  }

  isInterstitialReady(): boolean {
    return this.initialized;
  }

  destroy(): void {
    this.initialized = false;
    this.bannerVisible = false;
  }
}

export const AdService: IAdService = new AdServiceImpl();
