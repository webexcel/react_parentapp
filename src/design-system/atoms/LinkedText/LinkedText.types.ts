import { StyleProp, TextStyle } from 'react-native';
import { TextProps } from '../Text/Text.types';
import type { LinkChunk, LinkKind } from '../../../core/utils/linkify';

export interface LinkedTextProps extends Omit<TextProps, 'children'> {
  /** Message text to render. Links inside it become tappable. */
  children?: string | null;
  /**
   * Which kinds of link to look for.
   * Defaults to URLs and email addresses - pass 'phone' as well on screens
   * where a digit run is far more likely to be a number than a date.
   */
  detect?: LinkKind[];
  /** Style applied to the link runs only, on top of the default link styling */
  linkStyle?: StyleProp<TextStyle>;
  /** Handle the tap instead of opening the link (e.g. to confirm first) */
  onLinkPress?: (link: LinkChunk) => void;
}
