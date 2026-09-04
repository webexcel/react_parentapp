import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text } from '../../atoms/Text';
import { Icon } from '../../atoms/Icon';
import {
  openSocialLink,
  SocialLinkItem,
  SocialLinkOpenStatus,
} from '../../../core/utils/socialLinks';
import { SocialLinkAlert } from './SocialLinkAlert';
import { styles } from './SocialLinksSection.styles';
import type { SocialLinksSectionProps } from './SocialLinksSection.types';

type FailedOpen = {
  item: SocialLinkItem;
  status: Exclude<SocialLinkOpenStatus, 'opened'>;
};

const SocialLinkButton: React.FC<{
  item: SocialLinkItem;
  onFailed: (failure: FailedOpen) => void;
}> = ({ item, onFailed }) => {
  const handlePress = useCallback(async () => {
    const status = await openSocialLink(item);
    if (status !== 'opened') {
      onFailed({ item, status });
    }
  }, [item, onFailed]);

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.label}`}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
        <MaterialCommunityIcons
          name={item.icon}
          size={26}
          color={item.brandColor}
        />
      </View>
      <Text style={styles.label}>{item.label}</Text>
    </TouchableOpacity>
  );
};

export const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
  items,
  title = 'Follow Us',
  style,
}) => {
  const [failed, setFailed] = useState<FailedOpen | null>(null);

  const handleClose = useCallback(() => setFailed(null), []);

  if (!items.length) {
    return null;
  }

  return (
    <View style={style}>
      <View style={styles.header}>
        <Icon name="thumbUp" size={20} color="#2563EB" />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.card}>
        {items.map((item) => (
          <SocialLinkButton key={item.id} item={item} onFailed={setFailed} />
        ))}
      </View>

      <SocialLinkAlert
        item={failed?.item ?? null}
        status={failed?.status ?? 'not-installed'}
        onClose={handleClose}
      />
    </View>
  );
};
