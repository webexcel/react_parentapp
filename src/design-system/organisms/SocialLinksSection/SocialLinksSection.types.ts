import type { StyleProp, ViewStyle } from 'react-native';
import type { SocialLinkItem } from '../../../core/utils/socialLinks';

export interface SocialLinksSectionProps {
  /** Social links to render. An empty array renders nothing. */
  items: SocialLinkItem[];
  /** Section heading */
  title?: string;
  style?: StyleProp<ViewStyle>;
}
