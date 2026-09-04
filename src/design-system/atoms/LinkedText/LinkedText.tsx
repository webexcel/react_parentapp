/**
 * LinkedText
 *
 * Renders plain message text with any URLs, email addresses and phone numbers
 * inside it turned into tappable links. Drop-in replacement for <Text> on any
 * surface showing text the school typed - circulars, homework notes, messages -
 * where a link would otherwise render as dead text.
 *
 * Detection rules live in core/utils/linkify.
 */
import React, { useCallback, useMemo } from 'react';
import { Alert, Linking, Text as RNText } from 'react-native';
import { Text } from '../Text';
import { useColors } from '../../theme/ThemeContext';
import { parseLinks, LinkChunk } from '../../../core/utils/linkify';
import { LinkedTextProps } from './LinkedText.types';
import { styles } from './LinkedText.styles';

const FAILURE_MESSAGE: Record<LinkChunk['kind'], string> = {
  url: 'Could not open this link.',
  email: 'No email app is set up on this device.',
  phone: 'Could not start the call.',
};

export const LinkedText: React.FC<LinkedTextProps> = ({
  children,
  detect,
  linkStyle,
  onLinkPress,
  ...textProps
}) => {
  const colors = useColors();

  const chunks = useMemo(
    () => parseLinks(children, detect),
    [children, detect],
  );

  const openLink = useCallback(
    async (link: LinkChunk) => {
      if (onLinkPress) {
        onLinkPress(link);
        return;
      }

      try {
        await Linking.openURL(link.href);
      } catch {
        Alert.alert('Error', FAILURE_MESSAGE[link.kind]);
      }
    },
    [onLinkPress],
  );

  // Nothing to link - render exactly what <Text> would.
  if (chunks.length === 0) {
    return <Text {...textProps}>{children ?? ''}</Text>;
  }

  return (
    <Text {...textProps}>
      {chunks.map((chunk, index) => {
        if (chunk.kind === 'text') {
          return chunk.value;
        }

        return (
          <RNText
            key={`${chunk.href}-${index}`}
            style={[styles.link, { color: colors.primary }, linkStyle]}
            accessibilityRole="link"
            suppressHighlighting
            onPress={() => openLink(chunk)}>
            {chunk.value}
          </RNText>
        );
      })}
    </Text>
  );
};
