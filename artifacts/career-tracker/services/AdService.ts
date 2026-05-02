/**
 * AdService — Abstract ad integration layer
 *
 * Production implementation would initialize AppLovin MAX SDK and
 * BidMachine SDK (requires a native/EAS build, not available in Expo Go).
 * This stub provides the full interface so swapping in real SDKs later
 * requires changes only in this file.
 *
 * AppLovin MAX docs: https://developers.applovin.com/en/react-native/overview/integration
 * BidMachine docs:   https://docs.bidmachine.io/docs/react-native
 */

export interface IAdService {
  initialize(): Promise<void>;
  showBannerAd(): void;
  hideBannerAd(): void;
  showInterstitialAd(): Promise<boolean>;
  isBannerReady(): boolean;
  isInterstitialReady(): boolean;
  destroy(): void;
}

const APPLOVIN_SDK_KEY = process.env['EXPO_PUBLIC_APPLOVIN_SDK_KEY'] ?? '';
const BANNER_AD_UNIT_ID = process.env['EXPO_PUBLIC_BANNER_AD_UNIT_ID'] ?? '';
const INTERSTITIAL_AD_UNIT_ID = process.env['EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID'] ?? '';

class AdServiceImpl implements IAdService {
  private initialized = false;
  private bannerVisible = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    /**
     * Production (EAS native build):
     *
     * import AppLovinMAX from 'react-native-applovin-max';
     * import BidMachine from 'react-native-bidmachine';
     *
     * await AppLovinMAX.initialize(APPLOVIN_SDK_KEY);
     * await BidMachine.initialize(BID_MACHINE_SOURCE_ID);
     *
     * AppLovinMAX.setMuted(false);
     * AppLovinMAX.loadInterstitial(INTERSTITIAL_AD_UNIT_ID);
     * AppLovinMAX.showBanner(BANNER_AD_UNIT_ID);
     */

    this.initialized = true;
    console.log('[AdService] Initialized (stub mode — native build required for real ads)');
  }

  showBannerAd(): void {
    if (!this.initialized) return;
    this.bannerVisible = true;
    // AppLovinMAX.showBanner(BANNER_AD_UNIT_ID);
  }

  hideBannerAd(): void {
    if (!this.initialized) return;
    this.bannerVisible = false;
    // AppLovinMAX.hideBanner(BANNER_AD_UNIT_ID);
  }

  async showInterstitialAd(): Promise<boolean> {
    if (!this.initialized) return false;
    /**
     * Production:
     * if (AppLovinMAX.isInterstitialReady(INTERSTITIAL_AD_UNIT_ID)) {
     *   AppLovinMAX.showInterstitial(INTERSTITIAL_AD_UNIT_ID);
     *   return true;
     * }
     */
    console.log('[AdService] Interstitial ad triggered (stub)');
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
    // AppLovinMAX.destroy();
  }
}

export const AdService: IAdService = new AdServiceImpl();
