import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Linking, Image, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScreenHeader,
  Text,
  Badge,
  Icon,
  Divider,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { Circular, Attachment } from '../types/circular.types';

const { width: screenWidth } = Dimensions.get('window');

type RouteParams = {
  CircularDetail: { circular: Circular };
};

export const CircularDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CircularDetail'>>();
  const { circular } = route.params;

  const formatDate = (dateString: string) => {
    // API returns format like "10,Jan-14:30"
    if (!dateString) return '';
    return dateString.replace(',', ' ').replace('-', ' at ');
  };

  const handleAttachmentPress = async (attachment: Attachment) => {
    try {
      await Linking.openURL(attachment.url);
    } catch (error) {
      console.error('Error opening attachment:', error);
    }
  };

  const getAttachmentIcon = (type: string): any => {
    switch (type) {
      case 'pdf':
        return 'pdf';
      case 'image':
        return 'image';
      case 'audio':
        return 'audio';
      default:
        return 'attachment';
    }
  };

  const getAttachmentColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return colors.error;
      case 'image':
        return colors.success;
      case 'audio':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  // Separate image attachments from other attachments
  const imageAttachments = circular.attachments.filter(a => a.type === 'image');
  const otherAttachments = circular.attachments.filter(a => a.type !== 'image');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Circular"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with date */}
        <View style={styles.headerCard}>
          <View style={styles.dateContainer}>
            <Icon name="calendar" size={16} color={colors.textMuted} />
            <Text variant="caption" color="muted" style={styles.dateText}>
              {formatDate(circular.date)}
            </Text>
          </View>

          <Text variant="h3" style={styles.title}>
            {circular.title}
          </Text>
        </View>

        {/* Message Content */}
        <View style={styles.contentCard}>
          <Text variant="body" style={styles.bodyText}>
            {circular.content}
          </Text>
        </View>

        {/* Image Attachments - Show full images */}
        {imageAttachments.length > 0 && (
          <View style={styles.imagesCard}>
            {imageAttachments.map((attachment, index) => (
              <TouchableOpacity
                key={attachment.id || index}
                onPress={() => handleAttachmentPress(attachment)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: attachment.url }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Other Attachments (PDF, Audio, etc.) */}
        {otherAttachments.length > 0 && (
          <View style={styles.attachmentsCard}>
            <Text variant="bodySmall" semibold color="secondary" style={styles.sectionTitle}>
              Attachments
            </Text>

            {otherAttachments.map((attachment, index) => (
              <TouchableOpacity
                key={attachment.id || index}
                style={styles.attachmentItem}
                onPress={() => handleAttachmentPress(attachment)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.attachmentIconContainer,
                    { backgroundColor: `${getAttachmentColor(attachment.type)}15` },
                  ]}
                >
                  <Icon
                    name={getAttachmentIcon(attachment.type)}
                    size={24}
                    color={getAttachmentColor(attachment.type)}
                  />
                </View>
                <View style={styles.attachmentInfo}>
                  <Text variant="body" semibold>
                    {attachment.type.toUpperCase()}
                  </Text>
                  <Text variant="caption" color="muted">
                    Tap to open
                  </Text>
                </View>
                <Icon name="chevronRight" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  headerCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateText: {
    marginLeft: spacing.xs,
  },
  title: {
    marginBottom: spacing.xs,
  },
  contentCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  bodyText: {
    lineHeight: 24,
  },
  imagesCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  fullImage: {
    width: screenWidth - spacing.base * 2 - spacing.sm * 2,
    height: 250,
    borderRadius: borderRadius.lg,
  },
  attachmentsCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    ...shadows.sm,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  attachmentInfo: {
    flex: 1,
  },
});
