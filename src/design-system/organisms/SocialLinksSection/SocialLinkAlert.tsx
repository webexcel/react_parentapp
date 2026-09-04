import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text } from '../../atoms/Text';
import type { SocialLinkItem, SocialLinkOpenStatus } from '../../../core/utils/socialLinks';
import { alertStyles as styles } from './SocialLinksSection.styles';

export interface SocialLinkAlertProps {
  /** The link that could not be opened, or null when the modal is hidden */
  item: SocialLinkItem | null;
  /** Why it could not be opened */
  status: Exclude<SocialLinkOpenStatus, 'opened'>;
  onClose: () => void;
}

/**
 * Shown when a social link could not be handed off to its native app -
 * the app's own styling rather than an OS alert dialog.
 */
export const SocialLinkAlert: React.FC<SocialLinkAlertProps> = ({
  item,
  status,
  onClose,
}) => {
  const visible = item !== null;

  const title =
    status === 'not-installed'
      ? `${item?.label} not installed`
      : `Couldn't open ${item?.label}`;

  const message =
    status === 'not-installed'
      ? `Install the ${item?.label} app on your device to open this link.`
      : 'Something went wrong while opening this link. Please try again.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View
            style={[styles.iconCircle, { backgroundColor: item?.bgColor }]}
          >
            <MaterialCommunityIcons
              name={item?.icon || 'help-circle-outline'}
              size={36}
              color={item?.brandColor}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: item?.brandColor }]}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
