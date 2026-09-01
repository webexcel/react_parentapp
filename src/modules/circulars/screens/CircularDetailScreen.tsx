import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Dimensions,
  Platform,
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
  Divider,
  AudioPlayer,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { Circular, Attachment } from '../types/circular.types';
import { useCirculars } from '../hooks/useCirculars';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

  // Reset when no longer active
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
    // Offset from center of the image
    const offsetX = tapX - screenWidth / 2;
    const offsetY = tapY - screenHeight / 2;
    // Translate so the tapped point stays in place after zoom
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
        // Always allow zoom out from anywhere
        resetZoom();
      } else {
        const { pageX, pageY } = e.nativeEvent;
        // Only zoom in if tap is within the central image area
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

type RouteParams = {
  CircularDetail: { circular: Circular };
};

export const CircularDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CircularDetail'>>();
  const { circular: routeCircular } = route.params;
  const { circulars, acknowledgeCircular, isAcknowledging } = useCirculars();

  const circular = circulars.find((c) => c.sn === routeCircular.sn) || routeCircular;

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Video player state
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Video posters are derived URLs and may 404; remember which failed so we
  // show the plain play placeholder instead of retrying every render.
  const [failedPosters, setFailedPosters] = useState<Record<string, boolean>>({});

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return dateString.replace(',', ' ').replace('-', ' at ');
  };

  const imageAttachments = circular.attachments.filter(a => a.type === 'image');
  const audioAttachments = circular.attachments.filter(a => a.type === 'audio');
  const videoAttachments = circular.attachments.filter(a => a.type === 'video');
  const pdfAttachments = circular.attachments.filter(a => a.type === 'pdf');
  const docAttachments = circular.attachments.filter(a => a.type === 'document');

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

  const downloadAndOpenDocument = useCallback(async (attachment: Attachment) => {
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

  const handleAttachmentPress = useCallback((attachment: Attachment) => {
    switch (attachment.type) {
      case 'pdf':
        openPdf(attachment.url);
        break;
      case 'document':
        downloadAndOpenDocument(attachment);
        break;
      default:
        Linking.openURL(attachment.url);
    }
  }, [openPdf, downloadAndOpenDocument]);

  const handleAcknowledge = () => {
    if (circular.sn && circular.adno) {
      acknowledgeCircular(circular.sn, circular.adno);
    }
  };

  const getAttachmentIcon = (type: string): any => {
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

        {/* Image Attachments - Tap to open full-screen viewer */}
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

        {/* Audio Attachments - Inline player */}
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

        {/* Video Attachments - Inline player */}
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
                      {/* Poster frame, derived by convention from the video URL
                          (see getThumbnailUrl). Not guaranteed to exist — older
                          uploads have no object there — so failures fall through
                          to the plain play icon below. */}
                      {attachment.thumb && !failedPosters[attachment.id] ? (
                        <Image
                          source={{ uri: attachment.thumb }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                          onError={() =>
                            setFailedPosters(prev => ({ ...prev, [attachment.id]: true }))
                          }
                        />
                      ) : null}
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

        {/* PDF Attachments - Open in browser */}
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

        {/* Document Attachments (doc/docx/xls/xlsx) - Download and open locally */}
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
        {circular.isAcknowledged ? (
          <View style={styles.acknowledgedContainer}>
            <Icon name="check" size={22} color={colors.success} />
            <Text variant="body" style={styles.acknowledgedText}>
              Acknowledged
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={handleAcknowledge}
            activeOpacity={0.7}
            disabled={isAcknowledging}
          >
            <Icon name="thumbUp" size={20} color="#FFFFFF" />
            <Text variant="body" style={styles.acknowledgeButtonText}>
              {isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}
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
          <Text variant="caption" style={styles.imageViewerCounter}>
            {imageViewerIndex + 1} / {imageAttachments.length}
          </Text>
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
    overflow: 'hidden',
  },
  videoLabel: {
    color: '#FFFFFF',
    marginTop: spacing.xs,
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
  videoPlayerWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  inlineVideo: {
    width: '100%',
    height: 220,
  },
});
