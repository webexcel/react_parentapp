import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Video from 'react-native-video';
import ReactNativeBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import {
  Text,
  LinkedText,
  Badge,
  Button,
  Icon,
  AudioPlayer,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { Homework, HomeworkAttachment } from '../types/homework.types';
import { parseLocalDate, daysFromToday } from '../../../core/utils/dates';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Zoomable Image Component ---
interface ZoomableImageProps {
  uri: string;
  active: boolean;
  onZoomChange: (zoomed: boolean) => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ uri, active, onZoomChange }) => {
  const pinchRef = useRef<any>(null);
  const panRef = useRef<any>(null);

  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const lastTap = useRef(0);
  const isZoomed = useRef(false);

  const setZoomed = (zoomed: boolean) => {
    if (isZoomed.current !== zoomed) {
      isZoomed.current = zoomed;
      onZoomChange(zoomed);
    }
  };

  React.useEffect(() => {
    if (!active && lastScale.current !== 1) {
      lastScale.current = 1;
      lastTranslateX.current = 0;
      lastTranslateY.current = 0;
      baseScale.setValue(1);
      pinchScale.setValue(1);
      translateX.setOffset(0);
      translateX.setValue(0);
      translateY.setOffset(0);
      translateY.setValue(0);
      setZoomed(false);
    }
  }, [active]);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      if (lastScale.current < 1) lastScale.current = 1;
      if (lastScale.current > 5) lastScale.current = 5;
      baseScale.setValue(lastScale.current);
      pinchScale.setValue(1);

      if (lastScale.current <= 1) {
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
        translateX.setOffset(0);
        translateX.setValue(0);
        translateY.setOffset(0);
        translateY.setValue(0);
        setZoomed(false);
      } else {
        setZoomed(true);
      }
    }
  };

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true },
  );

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastTranslateX.current += event.nativeEvent.translationX;
      lastTranslateY.current += event.nativeEvent.translationY;
      translateX.setOffset(lastTranslateX.current);
      translateX.setValue(0);
      translateY.setOffset(lastTranslateY.current);
      translateY.setValue(0);
    }
  };

  const resetZoom = () => {
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    translateX.setOffset(0);
    translateY.setOffset(0);
    Animated.parallel([
      Animated.spring(baseScale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    pinchScale.setValue(1);
    setZoomed(false);
  };

  const zoomInAt = (tapX: number, tapY: number) => {
    const zoomFactor = 3;
    const offsetX = tapX - screenWidth / 2;
    const offsetY = tapY - screenHeight / 2;
    const tx = -offsetX * (zoomFactor - 1);
    const ty = -offsetY * (zoomFactor - 1);

    lastScale.current = zoomFactor;
    lastTranslateX.current = tx;
    lastTranslateY.current = ty;
    translateX.setOffset(tx);
    translateX.setValue(0);
    translateY.setOffset(ty);
    translateY.setValue(0);

    Animated.spring(baseScale, { toValue: zoomFactor, useNativeDriver: true }).start();
    pinchScale.setValue(1);
    setZoomed(true);
  };

  const onTap = (e: any) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (lastScale.current > 1) {
        resetZoom();
      } else {
        const { pageX, pageY } = e.nativeEvent;
        const margin = screenHeight * 0.15;
        if (pageY > margin && pageY < screenHeight - margin) {
          zoomInAt(pageX, pageY);
        }
      }
    }
    lastTap.current = now;
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={onTap} style={zoomStyles.container}>
      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={onPinchEvent}
        onHandlerStateChange={onPinchStateChange}
        simultaneousHandlers={panRef}
      >
        <Animated.View style={zoomStyles.container}>
          <PanGestureHandler
            ref={panRef}
            onGestureEvent={onPanEvent}
            onHandlerStateChange={onPanStateChange}
            simultaneousHandlers={pinchRef}
            minDist={10}
            avgTouches
          >
            <Animated.View
              style={[
                zoomStyles.container,
                { transform: [{ scale }, { translateX }, { translateY }] },
              ]}
            >
              <Image
                source={{ uri }}
                style={zoomStyles.image}
                resizeMode="contain"
              />
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </TouchableOpacity>
  );
};

const zoomStyles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
});

// --- Homework Card Component ---
interface HomeworkCardProps {
  homework: Homework;
  onAcknowledge?: () => void;
  isAcknowledging?: boolean;
}

export const HomeworkCard: React.FC<HomeworkCardProps> = ({
  homework,
  onAcknowledge,
  isAcknowledging,
}) => {
  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Video player state
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const imageAttachments = homework.attachments.filter(a => a.type === 'image');
  const audioAttachments = homework.attachments.filter(a => a.type === 'audio');
  const videoAttachments = homework.attachments.filter(a => a.type === 'video');
  const pdfAttachments = homework.attachments.filter(a => a.type === 'pdf');
  const docAttachments = homework.attachments.filter(a => a.type === 'document');

  const formatDate = (dateString: string) => {
    // Local-midnight parse: a bare 'YYYY-MM-DD' read via new Date() is UTC
    // midnight, so toLocaleDateString would print the previous day on any
    // device at a negative UTC offset.
    const date = parseLocalDate(dateString);
    if (!date) return '';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDaysRemaining = () => {
    // daysFromToday anchors BOTH ends to local midnight. The old version
    // subtracted `new Date()` (i.e. now, mid-afternoon) from a midnight due
    // date and took Math.ceil, so a homework due today read as 1 day left for
    // most of the day and 'Due today' almost never appeared.
    const diffDays = daysFromToday(homework.dueDate);
    if (diffDays === null) return '';
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const getStatusVariant = () => {
    switch (homework.status) {
      case 'overdue': return 'error';
      case 'completed': return 'success';
      default: return 'warning';
    }
  };

  const openImageViewer = useCallback((index: number) => {
    setImageViewerIndex(index);
    setImageViewerVisible(true);
  }, []);

  const toggleVideo = useCallback((id: string) => {
    setPlayingVideoId(prev => prev === id ? null : id);
  }, []);

  const openPdf = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open PDF.');
    }
  }, []);

  const getMimeType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeMap: Record<string, string> = {
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf',
    };
    return mimeMap[ext] || 'application/octet-stream';
  };

  const downloadAndOpenDocument = useCallback(async (attachment: HomeworkAttachment) => {
    try {
      setDownloadingId(attachment.id);
      const fileName = attachment.url.split('/').pop() || `document_${Date.now()}`;
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const filePath = `${dirs.DownloadDir}/${fileName}`;

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

      const downloadedPath = res.path();
      await FileViewer.open(downloadedPath, { showOpenWithDialog: true });
    } catch {
      Alert.alert('Error', 'Could not download or open the file.');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return 'pdf';
      case 'image': return 'image';
      case 'audio': return 'audio';
      case 'video': return 'playCircle';
      default: return 'attachment';
    }
  };

  const getAttachmentColor = (type: string) => {
    switch (type) {
      case 'pdf': return colors.error;
      case 'image': return colors.success;
      case 'audio': return colors.warning;
      case 'video': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* Subject Tag */}
        <View style={styles.header}>
          <View
            style={[styles.subjectTag, { backgroundColor: `${homework.subjectColor}15` }]}
          >
            <View style={[styles.subjectDot, { backgroundColor: homework.subjectColor }]} />
            <Text variant="caption" semibold style={{ color: homework.subjectColor }}>
              {homework.subject}
            </Text>
          </View>
          <Badge
            label={homework.status === 'completed' ? 'Completed' : getDaysRemaining()}
            variant={getStatusVariant()}
            size="sm"
          />
        </View>

        {/* Title and Description */}
        <Text variant="body" semibold style={styles.title} numberOfLines={2}>
          {homework.title}
        </Text>

        {homework.description && (
          <LinkedText variant="bodySmall" color="secondary" numberOfLines={2} style={styles.description}>
            {homework.description}
          </LinkedText>
        )}

        {/* Due Date and Teacher */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="calendar" size={14} color={colors.textMuted} />
            <Text variant="caption" color="muted" style={styles.metaText}>
              Due: {formatDate(homework.dueDate)}
            </Text>
          </View>
          {homework.teacherName && (
            <View style={styles.metaItem}>
              <Icon name="profile" size={14} color={colors.textMuted} />
              <Text variant="caption" color="muted" style={styles.metaText}>
                {homework.teacherName}
              </Text>
            </View>
          )}
        </View>

        {/* Image Thumbnails */}
        {imageAttachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {imageAttachments.map((attachment, index) => (
              <TouchableOpacity
                key={attachment.id}
                onPress={() => openImageViewer(index)}
                activeOpacity={0.8}
                style={index > 0 ? { marginLeft: spacing.sm } : undefined}
              >
                <Image
                  source={{ uri: attachment.url }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Audio - Inline player */}
        {audioAttachments.length > 0 && (
          <View style={styles.mediaSection}>
            {audioAttachments.map((attachment, index) => (
              <View key={attachment.id} style={index > 0 ? { marginTop: spacing.sm } : undefined}>
                <AudioPlayer url={attachment.url} title={attachment.name} />
              </View>
            ))}
          </View>
        )}

        {/* Video - Inline player */}
        {videoAttachments.length > 0 && (
          <View style={styles.mediaSection}>
            {videoAttachments.map((attachment) => {
              const isPlaying = playingVideoId === attachment.id;
              return (
                <View key={attachment.id} style={styles.videoContainer}>
                  {isPlaying ? (
                    <View style={styles.videoPlayerWrapper}>
                      <Video
                        source={{ uri: attachment.url }}
                        style={styles.inlineVideo}
                        controls
                        resizeMode="contain"
                        onEnd={() => setPlayingVideoId(null)}
                        onError={() => {
                          setPlayingVideoId(null);
                          Alert.alert('Error', 'Could not play video.');
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.videoPlaceholder}
                      onPress={() => toggleVideo(attachment.id)}
                      activeOpacity={0.8}
                    >
                      <Icon name="playCircle" size={36} color="#FFFFFF" />
                      <Text variant="caption" style={styles.videoLabel}>Tap to play</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* PDF - Open in browser */}
        {pdfAttachments.length > 0 && (
          <View style={styles.mediaSection}>
            {pdfAttachments.map((attachment) => (
              <TouchableOpacity
                key={attachment.id}
                style={styles.fileButton}
                onPress={() => openPdf(attachment.url)}
                activeOpacity={0.7}
              >
                <Icon name="pdf" size={20} color={colors.error} />
                <Text variant="caption" semibold style={{ color: colors.error, marginLeft: spacing.xs }}>
                  PDF
                </Text>
                <Icon name="chevronRight" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Documents - Download and open locally */}
        {docAttachments.length > 0 && (
          <View style={styles.mediaSection}>
            {docAttachments.map((attachment) => {
              const isDownloading = downloadingId === attachment.id;
              return (
                <TouchableOpacity
                  key={attachment.id}
                  style={styles.fileButton}
                  onPress={() => downloadAndOpenDocument(attachment)}
                  activeOpacity={0.7}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : (
                    <Icon name="attachment" size={20} color={colors.textSecondary} />
                  )}
                  <Text variant="caption" semibold style={{ color: colors.textSecondary, marginLeft: spacing.xs, flex: 1 }}>
                    {isDownloading ? 'Downloading...' : attachment.name}
                  </Text>
                  <Icon name="chevronRight" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Acknowledge Button */}
        {homework.status !== 'completed' && !homework.isAcknowledged && onAcknowledge && (
          <Button
            title="Mark as Complete"
            variant="secondary"
            size="sm"
            onPress={onAcknowledge}
            loading={isAcknowledging}
            fullWidth
            style={styles.acknowledgeButton}
          />
        )}

        {homework.isAcknowledged && homework.status !== 'completed' && (
          <View style={styles.acknowledgedBadge}>
            <Icon name="check" size={14} color={colors.success} />
            <Text variant="caption" style={{ color: colors.success, marginLeft: spacing.xs }}>
              Acknowledged
            </Text>
          </View>
        )}
      </View>

      {/* Full-screen Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setImageViewerVisible(false); setIsImageZoomed(false); }}
      >
        <View style={styles.imageViewerModal}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => { setImageViewerVisible(false); setIsImageZoomed(false); }}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: imageViewerIndex * screenWidth, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setImageViewerIndex(newIndex);
            }}
            scrollEnabled={!isImageZoomed}
          >
            {imageAttachments.map((attachment, index) => (
              <ZoomableImage
                key={attachment.id || index}
                uri={attachment.url}
                active={imageViewerIndex === index}
                onZoomChange={setIsImageZoomed}
              />
            ))}
          </ScrollView>
          {imageAttachments.length > 1 && (
            <Text variant="caption" style={styles.imageViewerCounter}>
              {imageViewerIndex + 1} / {imageAttachments.length}
            </Text>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  title: {
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  metaText: {
    marginLeft: spacing.xs,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  videoContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  videoPlayerWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  inlineVideo: {
    width: '100%',
    height: 200,
  },
  videoPlaceholder: {
    backgroundColor: '#1a1a2e',
    height: 160,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    color: '#FFFFFF',
    marginTop: spacing.xs,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  acknowledgeButton: {
    marginTop: spacing.md,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Image viewer modal styles
  imageViewerModal: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerCounter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
