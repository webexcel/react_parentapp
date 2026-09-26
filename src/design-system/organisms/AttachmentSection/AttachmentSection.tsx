import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import ReactNativeBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { Text } from '../../atoms/Text';
import { Icon } from '../../atoms/Icon';
import { AudioPlayer } from '../../molecules/AudioPlayer';
import { colors, spacing, borderRadius } from '../../theme';
import type { Attachment } from '../../../core/utils/attachments';

export interface AttachmentSectionProps {
  attachments: Attachment[];
  /**
   * 'full'    — large stacked images, inline video, labelled sections.
   * 'compact' — smaller media, used inside modals (e.g. the flash message
   *             popup) where vertical space is tight.
   */
  variant?: 'full' | 'compact';
  /** Called when an image is tapped, if the host has its own full-screen viewer. */
  onImagePress?: (index: number) => void;
  style?: object;
}

const MIME_BY_EXT: Record<string, string> = {
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

const getMimeType = (fileName: string): string =>
  MIME_BY_EXT[fileName.split('.').pop()?.toLowerCase() || ''] || 'application/octet-stream';

/**
 * Video tile with a derived poster frame.
 *
 * `attachment.thumb` is computed by convention (see getThumbnailUrl) and is not
 * guaranteed to exist — videos uploaded before the convention, and web uploads
 * where the browser could not grab a frame, have no object at that key. On load
 * error we fall back to a plain play placeholder.
 */
const VideoTile: React.FC<{ attachment: Attachment; compact: boolean }> = ({
  attachment,
  compact,
}) => {
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const height = compact ? 180 : 220;

  if (playing) {
    return (
      <View style={[styles.videoWrapper, { height }]}>
        <Video
          source={{ uri: attachment.url }}
          style={StyleSheet.absoluteFill}
          controls
          resizeMode="contain"
          onEnd={() => setPlaying(false)}
          onError={() => {
            setPlaying(false);
            Alert.alert('Error', 'Could not play video.');
          }}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.videoWrapper, { height }]}
      onPress={() => setPlaying(true)}
      activeOpacity={0.85}
    >
      {attachment.thumb && !posterFailed ? (
        <Image
          source={{ uri: attachment.thumb }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setPosterFailed(true)}
        />
      ) : null}
      <View style={styles.videoOverlay}>
        <Icon name="playCircle" size={44} color="#FFFFFF" />
        <Text variant="caption" style={styles.videoLabel}>
          Tap to play
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Renders a mixed list of attachments — images, video, audio, PDF and
 * documents. Shared by circulars, homework and flash messages so every surface
 * handles every format the backend can store.
 */
export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  attachments,
  variant = 'full',
  onImagePress,
  style,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const compact = variant === 'compact';

  const images = attachments.filter(a => a.type === 'image');
  const videos = attachments.filter(a => a.type === 'video');
  const audios = attachments.filter(a => a.type === 'audio');
  const pdfs = attachments.filter(a => a.type === 'pdf');
  const docs = attachments.filter(a => a.type === 'document');

  const openExternally = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open this file.');
    }
  }, []);

  const downloadAndOpen = useCallback(async (attachment: Attachment) => {
    try {
      setDownloadingId(attachment.id);
      const fileName = attachment.url.split('/').pop() || `document_${Date.now()}`;
      const filePath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filePath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: fileName,
          description: 'Downloading attachment...',
          mime: getMimeType(fileName),
          mediaScannable: true,
        },
      }).fetch('GET', attachment.url);

      await FileViewer.open(res.path(), { showOpenWithDialog: true });
    } catch {
      Alert.alert('Error', 'Could not download or open the file.');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  if (attachments.length === 0) return null;

  const renderFileRow = (
    attachment: Attachment,
    iconName: string,
    iconColor: string,
    subtitle: string,
    onPress: () => void,
  ) => {
    const isDownloading = downloadingId === attachment.id;
    return (
      <TouchableOpacity
        key={attachment.id}
        style={styles.fileRow}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isDownloading}
      >
        <View style={[styles.fileIcon, { backgroundColor: `${iconColor}15` }]}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Icon name={iconName as any} size={22} color={iconColor} />
          )}
        </View>
        <View style={styles.fileInfo}>
          <Text variant="body" semibold numberOfLines={1}>
            {attachment.name}
          </Text>
          <Text variant="caption" color="muted">
            {isDownloading ? 'Downloading…' : subtitle}
          </Text>
        </View>
        <Icon name="chevronRight" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {images.length > 0 && (
        <View style={styles.group}>
          {images.map((attachment, index) => (
            <TouchableOpacity
              key={attachment.id}
              onPress={() => onImagePress?.(index)}
              activeOpacity={onImagePress ? 0.9 : 1}
              disabled={!onImagePress}
            >
              <Image
                source={{ uri: attachment.url }}
                style={[styles.image, compact && styles.imageCompact]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {videos.length > 0 && (
        <View style={styles.group}>
          {!compact && (
            <Text variant="bodySmall" semibold color="secondary" style={styles.groupTitle}>
              Videos
            </Text>
          )}
          {videos.map(attachment => (
            <VideoTile key={attachment.id} attachment={attachment} compact={compact} />
          ))}
        </View>
      )}

      {audios.length > 0 && (
        <View style={styles.group}>
          {!compact && (
            <Text variant="bodySmall" semibold color="secondary" style={styles.groupTitle}>
              Audio
            </Text>
          )}
          {audios.map(attachment => (
            <View key={attachment.id} style={styles.audioRow}>
              <AudioPlayer url={attachment.url} title={attachment.name} />
            </View>
          ))}
        </View>
      )}

      {pdfs.length > 0 && (
        <View style={styles.group}>
          {!compact && (
            <Text variant="bodySmall" semibold color="secondary" style={styles.groupTitle}>
              Documents
            </Text>
          )}
          {pdfs.map(attachment =>
            renderFileRow(attachment, 'pdf', colors.error, 'Tap to open', () =>
              openExternally(attachment.url),
            ),
          )}
        </View>
      )}

      {docs.length > 0 && (
        <View style={styles.group}>
          {!compact && (
            <Text variant="bodySmall" semibold color="secondary" style={styles.groupTitle}>
              Files
            </Text>
          )}
          {docs.map(attachment =>
            renderFileRow(
              attachment,
              'attachment',
              colors.textSecondary,
              'Tap to download',
              () => downloadAndOpen(attachment),
            ),
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  group: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundLight,
    marginBottom: spacing.sm,
  },
  imageCompact: {
    height: 180,
  },
  videoWrapper: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    color: '#FFFFFF',
    marginTop: spacing.xs,
  },
  audioRow: {
    marginBottom: spacing.sm,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
});
