/**
 * Social Links
 *
 * Resolves the brand's social media links into renderable items and opens each
 * one in its native app. Opening reports back whether it succeeded so the
 * caller can show a styled modal - we never silently fall back to a browser.
 *
 * Note: on Android 11+ (targetSdk 30+) `Linking.canOpenURL` only sees packages
 * declared in the <queries> block of AndroidManifest.xml, and on iOS only
 * schemes listed under LSApplicationQueriesSchemes in Info.plist. Both are
 * configured for the platforms below - adding a new platform here means adding
 * it there too, otherwise it will always report "not installed".
 */
import { Linking, Platform } from 'react-native';
import type { SocialLinks } from '../brand/BrandConfig';

export type SocialPlatformId = 'youtube' | 'whatsapp' | 'instagram' | 'facebook';

export interface SocialLinkItem {
  id: SocialPlatformId;
  label: string;
  /** MaterialCommunityIcons glyph name */
  icon: string;
  brandColor: string;
  bgColor: string;
  /** The https link exactly as configured in brand.config.json (normalized) */
  url: string;
}

interface SocialPlatform {
  label: string;
  icon: string;
  brandColor: string;
  bgColor: string;
  /** URL used purely to detect whether the app is installed */
  probeScheme: string;
  /** Builds the deep link that opens the app on the right page */
  toAppUrl: (url: string) => string;
}

/**
 * Strip the scheme from a URL: "https://www.youtube.com/@vsn" -> "www.youtube.com/@vsn"
 */
const withoutScheme = (url: string): string => url.replace(/^https?:\/\//i, '');

/**
 * Pull the phone number out of a WhatsApp link.
 * Handles wa.me/919876543210, api.whatsapp.com/send?phone=91..., or a raw number.
 */
const whatsappPhone = (url: string): string => {
  const fromQuery = url.match(/[?&]phone=(\+?\d+)/i);
  if (fromQuery) {
    return fromQuery[1].replace(/\D/g, '');
  }
  const fromPath = withoutScheme(url).match(/wa\.me\/(\+?\d+)/i);
  if (fromPath) {
    return fromPath[1].replace(/\D/g, '');
  }
  return url.replace(/\D/g, '');
};

/**
 * Pull the handle out of an Instagram profile link.
 */
const instagramHandle = (url: string): string => {
  const match = withoutScheme(url).match(/instagram\.com\/([^/?#]+)/i);
  return match ? match[1] : withoutScheme(url).replace(/^@/, '');
};

export const SOCIAL_PLATFORMS: Record<SocialPlatformId, SocialPlatform> = {
  youtube: {
    label: 'YouTube',
    icon: 'youtube',
    brandColor: '#FF0000',
    bgColor: '#FEE2E2',
    probeScheme: Platform.OS === 'android' ? 'vnd.youtube://' : 'youtube://',
    toAppUrl: url =>
      Platform.OS === 'android'
        ? `vnd.youtube://${withoutScheme(url)}`
        : `youtube://${withoutScheme(url)}`,
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'whatsapp',
    brandColor: '#25D366',
    bgColor: '#DCFCE7',
    probeScheme: 'whatsapp://send',
    toAppUrl: url => {
      const phone = whatsappPhone(url);
      return phone ? `whatsapp://send?phone=${phone}` : url;
    },
  },
  instagram: {
    label: 'Instagram',
    icon: 'instagram',
    brandColor: '#E4405F',
    bgColor: '#FCE7F3',
    probeScheme: 'instagram://app',
    toAppUrl: url => {
      const handle = instagramHandle(url);
      return handle ? `instagram://user?username=${handle}` : url;
    },
  },
  facebook: {
    label: 'Facebook',
    icon: 'facebook',
    brandColor: '#1877F2',
    bgColor: '#DBEAFE',
    probeScheme: 'fb://',
    toAppUrl: url => `fb://facewebmodal/f?href=${encodeURIComponent(url)}`,
  },
};

/** Display order of the icons in the section */
const PLATFORM_ORDER: SocialPlatformId[] = [
  'youtube',
  'whatsapp',
  'instagram',
  'facebook',
];

/**
 * Add a scheme when the brand config holds a bare domain ("facebook.com/x").
 */
const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/**
 * Build the list of social items for a brand. Platforms with a missing or blank
 * link are dropped - an empty array means the section should not be rendered.
 */
export const getSocialItems = (social?: SocialLinks): SocialLinkItem[] => {
  if (!social) {
    return [];
  }

  return PLATFORM_ORDER.reduce<SocialLinkItem[]>((items, id) => {
    const url = normalizeUrl(social[id] || '');
    if (url) {
      const platform = SOCIAL_PLATFORMS[id];
      items.push({
        id,
        label: platform.label,
        icon: platform.icon,
        brandColor: platform.brandColor,
        bgColor: platform.bgColor,
        url,
      });
    }
    return items;
  }, []);
};

/**
 * Outcome of trying to open a social link.
 * - 'opened'        - handed off to the native app
 * - 'not-installed' - the app is not on this device
 * - 'failed'        - the app is installed but the link could not be opened
 */
export type SocialLinkOpenStatus = 'opened' | 'not-installed' | 'failed';

/**
 * Open a social link in its native app.
 *
 * Returns the outcome instead of alerting, so the caller can present it in the
 * app's own styling rather than an OS dialog.
 */
export const openSocialLink = async (
  item: SocialLinkItem,
): Promise<SocialLinkOpenStatus> => {
  const platform = SOCIAL_PLATFORMS[item.id];

  let isInstalled = false;
  try {
    isInstalled = await Linking.canOpenURL(platform.probeScheme);
  } catch {
    isInstalled = false;
  }

  if (!isInstalled) {
    return 'not-installed';
  }

  try {
    await Linking.openURL(platform.toAppUrl(item.url));
    return 'opened';
  } catch {
    // The app is installed but rejected the deep link - open the plain link,
    // which the installed app handles via app/universal links.
    try {
      await Linking.openURL(item.url);
      return 'opened';
    } catch {
      return 'failed';
    }
  }
};
