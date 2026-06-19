import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import ReactNativeBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import {
  ScreenHeader,
  Text,
  Badge,
  Icon,
  AudioPlayer,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { Homework, HomeworkAttachment } from '../types/homework.types';
import { useHomework } from '../hooks/useHomework';

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
    <TouchableOpacity activeOpacity={1} onPress={onTap} style={styles.zoomContainer}>
      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={onPinchEvent}
        onHandlerStateChange={onPinchStateChange}
        simultaneousHandlers={panRef}
      >
        <Animated.View style={styles.zoomContainer}>
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
                styles.zoomContainer,
                { transform: [{ scale }, { translateX }, { translateY }] },
              ]}
            >
              <Image
                source={{ uri }}
                style={styles.imageViewerImage}
                resizeMode="contain"
              />
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </TouchableOpacity>
  );
};

// --- Homework Detail Screen ---
type RouteParams = {
  HomeworkDetail: { homework: Homework };
};

export const HomeworkDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'HomeworkDetail'>>();
  const { homework: routeHomework } = route.params;
  const { homework: allHomework, acknowledgeHomeworkAsync, isAcknowledging } = useHomework();

  const homework = allHomework.find((h) => h.id === routeHomework.id) || routeHomework;

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
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysRemaining = () => {
    const dueDate = new Date(homework.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  const handleAcknowledge = () => {
    Alert.alert(
      'Mark as Complete',
      `Are you sure you want to mark "${homework.title}" as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await acknowledgeHomeworkAsync(homework.id);
              Alert.alert('Success', 'Homework marked as complete');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to mark homework as complete');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Homework"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with subject and status */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
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
          <Text variant="h3" style={styles.title}>
            {homework.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="calendar" size={14} color={colors.textMuted} />
              <Text variant="caption" color="muted" style={styles.metaText}>
                Due: {formatDate(homework.dueDate)}
              </Text>
            </View>
            {homework.teacherName ? (
              <View style={styles.metaItem}>
                <Icon name="profile" size={14} color={colors.textMuted} />
                <Text variant="caption" color="muted" style={styles.metaText}>
                  {homework.teacherName}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Description Content */}
        {homework.description ? (
          <View style={styles.contentCard}>
            <Text variant="body" style={styles.bodyText}>
              {homework.description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                /^https?:\/\//.test(part) ? (
                  <Text
                    key={i}
                    style={styles.linkText}
                    onPress={() => Linking.openURL(part)}>
                    {part}
                  </Text>
                ) : (
                  part
                ),
              )}
            </Text>
          </View>
        ) : null}

        {/* Image Attachments */}
        {imageAttachments.length > 0 && (
          <View style={styles.imagesCard}>
            {imageAttachments.map((attachment, index) => (
              <TouchableOpacity
                key={attachment.id || index}
                onPress={() => openImageViewer(index)}
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

        {/* Audio Attachments */}
        {audioAttachments.length > 0 && (
          <View style={styles.attachmentsCard}>
            <Text variant="bodySmall" semibold color="secondary" style={styles.sectionTitle}>
              Audio
            </Text>
            {audioAttachments.map((attachment, index) => (
              <View key={attachment.id || index} style={index > 0 ? styles.audioSpacing : undefined}>
                <AudioPlayer url={attachment.url} title={attachment.name} />
              </View>
            ))}
          </View>
        )}

        {/* Video Attachments */}
        {videoAttachments.length > 0 && (
          <View style={styles.attachmentsCard}>
            <Text variant="bodySmall" semibold color="secondary" style={styles.sectionTitle}>
              Videos
            </Text>
            {videoAttachments.map((attachment, index) => {
              const isPlaying = playingVideoId === attachment.id;
              return (
                <View key={attachment.id || index} style={styles.videoContainer}>
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
                      <Icon name="playCircle" size={40} color="#FFFFFF" />
                      <Text variant="caption" style={styles.videoLabel}>
                        Tap to play
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* PDF Attachments */}
        {pdfAttachments.length > 0 && (
          <View style={styles.attachmentsCard}>
            <Text variant="bodySmall" semibold color="secondary" style={styles.sectionTitle}>
              Documents
            </Text>
            {pdfAttachments.map((attachment, index) => (
              <TouchableOpacity
                key={attachment.id || index}
                style={styles.attachmentItem}
                onPress={() => openPdf(attachment.url)}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentIconContainer, { backgroundColor: `${colors.error}15` }]}>
                  <Icon name="pdf" size={24} color={colors.error} />
                </View>
                <View style={styles.attachmentInfo}>
                  <Text variant="body" semibold>PDF</Text>
                  <Text variant="caption" color="muted">Tap to open</Text>
                </View>
                <Icon name="chevronRight" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Document Attachments */}
        {docAttachments.length > 0 && (
          <View style={styles.attachmentsCard}>
            <Text variant="bodySmall" semibold color="secondary" style={styles.sectionTitle}>
              Files
            </Text>
            {docAttachments.map((attachment, index) => {
              const isDownloading = downloadingId === attachment.id;
              return (
                <TouchableOpacity
                  key={attachment.id || index}
                  style={styles.attachmentItem}
                  onPress={() => downloadAndOpenDocument(attachment)}
                  activeOpacity={0.7}
                  disabled={isDownloading}
                >
                  <View style={[styles.attachmentIconContainer, { backgroundColor: `${colors.textSecondary}15` }]}>
                    {isDownloading ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      <Icon name="attachment" size={24} color={colors.textSecondary} />
                    )}
                  </View>
                  <View style={styles.attachmentInfo}>
                    <Text variant="body" semibold>
                      {attachment.name}
                    </Text>
                    <Text variant="caption" color="muted">
                      {isDownloading ? 'Downloading...' : 'Tap to download & open'}
                    </Text>
                  </View>
                  <Icon name="chevronRight" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Acknowledge Button */}
        {homework.isAcknowledged || homework.status === 'completed' ? (
          <View style={styles.acknowledgedContainer}>
            <Icon name="check" size={22} color={colors.success} />
            <Text variant="body" style={styles.acknowledgedText}>
              {homework.status === 'completed' ? 'Completed' : 'Acknowledged'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={handleAcknowledge}
            activeOpacity={0.7}
            disabled={isAcknowledging}
          >
            <Icon name="check" size={20} color="#FFFFFF" />
            <Text variant="body" style={styles.acknowledgeButtonText}>
              {isAcknowledging ? 'Marking...' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Full-screen Image Viewer */}
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
  headerRow: {
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
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  metaText: {
    marginLeft: spacing.xs,
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
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline' as const,
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
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  audioSpacing: {
    marginTop: spacing.sm,
  },
  videoContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  videoPlaceholder: {
    backgroundColor: '#1a1a2e',
    height: 200,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    color: '#FFFFFF',
    marginTop: spacing.xs,
  },
  videoPlayerWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  inlineVideo: {
    width: '100%',
    height: 220,
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
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  acknowledgeButtonText: {
    marginLeft: spacing.sm,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  acknowledgedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  acknowledgedText: {
    marginLeft: spacing.sm,
    color: colors.success,
    fontWeight: '700',
  },
  // Image viewer
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
  zoomContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: screenWidth,
    height: screenHeight,
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
