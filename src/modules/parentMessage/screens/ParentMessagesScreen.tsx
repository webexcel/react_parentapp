import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Video from 'react-native-video';
import ReactNativeBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import {
  ListTemplate,
  Text,
  Icon,
  EmptyState,
  AudioPlayer,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useParentMessages, useDeleteMessage } from '../hooks/useParentMessages';
import { ParentMessage } from '../types/parentMessage.types';
import { ROUTES } from '../../../core/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// File type detection from URL
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.3gp', '.wmv'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.aac', '.ogg', '.m4a', '.wma', '.flac'];
const DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf'];

const getUrlFileCategory = (url: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  const lower = url.toLowerCase().split('?')[0];
  if (IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext))) return 'image';
  if (VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext))) return 'video';
  if (AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext))) return 'audio';
  if (DOC_EXTENSIONS.some(ext => lower.endsWith(ext))) return 'document';
  return 'other';
};

const getFileName = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 1]?.split('?')[0] || 'attachment';
};

const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pdf: 'application/pdf',
    txt: 'text/plain',
    csv: 'text/csv',
    rtf: 'application/rtf',
  };
  return mimeMap[ext] || 'application/octet-stream';
};

// Zoomable image for full-screen viewer (same as circular module)
interface ZoomableImageProps {
  uri: string;
  active: boolean;
  onZoomChange: (zoomed: boolean) => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ uri, active, onZoomChange }) => {
  const pinchRef = React.useRef<any>(null);
  const panRef = React.useRef<any>(null);

  const baseScale = React.useRef(new Animated.Value(1)).current;
  const pinchScale = React.useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);

  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;

  const lastScale = React.useRef(1);
  const lastTranslateX = React.useRef(0);
  const lastTranslateY = React.useRef(0);
  const lastTap = React.useRef(0);
  const isZoomed = React.useRef(false);

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

export const ParentMessagesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUri, setImageViewerUri] = useState('');
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Video player state
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);

  // Download state
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleSelectStudent = (id: string) => {
    selectStudent(id);
  };

  const { messages, isLoading, isFetching, error, refetch } = useParentMessages();
  const { deleteMessage, isLoading: isDeleting } = useDeleteMessage();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessage(id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openImageViewer = useCallback((uri: string) => {
    setImageViewerUri(uri);
    setImageViewerVisible(true);
  }, []);

  const downloadAndOpenFile = useCallback(async (id: number, url: string) => {
    try {
      setDownloadingId(id);
      const fileName = getFileName(url);
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
      }).fetch('GET', url);

      const downloadedPath = res.path();
      await FileViewer.open(downloadedPath, { showOpenWithDialog: true });
    } catch {
      Alert.alert('Error', 'Could not download or open the file.');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const renderMediaPreview = (item: ParentMessage) => {
    if (!item.url || item.url.length === 0) return null;

    const category = getUrlFileCategory(item.url);
    const fileName = getFileName(item.url);

    switch (category) {
      case 'image':
        return (
          <TouchableOpacity
            style={styles.mediaContainer}
            onPress={() => openImageViewer(item.url!)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.url }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );

      case 'video': {
        const isPlaying = playingVideoId === item.id;
        return (
          <View style={styles.mediaContainer}>
            {isPlaying ? (
              <View style={styles.videoPlayerWrapper}>
                <Video
                  source={{ uri: item.url }}
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
                onPress={() => setPlayingVideoId(item.id)}
                activeOpacity={0.8}
              >
                {item.thumbnail ? (
                  <>
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    <View style={styles.videoOverlay}>
                      <Icon name="playCircle" size={40} color="#FFFFFF" />
                      <Text variant="caption" style={styles.videoLabel}>
                        Tap to play
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Icon name="playCircle" size={40} color="#FFFFFF" />
                    <Text variant="caption" style={styles.videoLabel}>
                      Tap to play
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      }

      case 'audio':
        return (
          <View style={styles.mediaContainer}>
            <AudioPlayer url={item.url} title={fileName} />
          </View>
        );

      case 'document': {
        const isDownloading = downloadingId === item.id;
        const isPdf = item.url.toLowerCase().endsWith('.pdf');
        return (
          <TouchableOpacity
            style={styles.mediaContainer}
            onPress={() => downloadAndOpenFile(item.id, item.url!)}
            activeOpacity={0.7}
            disabled={isDownloading}
          >
            <View style={styles.fileCard}>
              <View style={[styles.fileIconCircle, { backgroundColor: isPdf ? `${colors.error}15` : `${colors.textSecondary}15` }]}>
                {isDownloading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Icon name={isPdf ? 'pdf' : 'attachment'} size={24} color={isPdf ? colors.error : colors.textSecondary} />
                )}
              </View>
              <View style={styles.fileInfo}>
                <Text variant="body" semibold numberOfLines={1}>
                  {fileName}
                </Text>
                <Text variant="caption" color="secondary">
                  {isDownloading ? 'Downloading...' : 'Tap to download & open'}
                </Text>
              </View>
              <Icon name="chevronRight" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        );
      }

      default:
        return (
          <TouchableOpacity
            style={styles.mediaContainer}
            onPress={() => downloadAndOpenFile(item.id, item.url!)}
            activeOpacity={0.7}
          >
            <View style={styles.fileCard}>
              <View style={[styles.fileIconCircle, { backgroundColor: `${colors.textSecondary}15` }]}>
                <Icon name="attachment" size={24} color={colors.textSecondary} />
              </View>
              <View style={styles.fileInfo}>
                <Text variant="body" semibold numberOfLines={1}>
                  {fileName}
                </Text>
                <Text variant="caption" color="secondary">
                  Tap to download & open
                </Text>
              </View>
              <Icon name="chevronRight" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        );
    }
  };

  const renderMessage = ({ item }: { item: ParentMessage }) => {
    return (
      <View style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <View style={styles.messageIcon}>
            <Icon name="message" size={20} color={colors.primary} />
          </View>
          <View style={styles.messageHeaderText}>
            <Text variant="caption" color="secondary">
              {formatDate(item.Date)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            disabled={isDeleting}
          >
            <Icon name="delete" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        <Text variant="body" style={styles.messageText}>
          {item.description}
        </Text>

        {renderMediaPreview(item)}

        <View style={styles.statusBadge}>
          <Text variant="caption" style={styles.statusText}>
            Sent
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ListTemplate
      headerProps={{
        title: 'My Messages',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={handleSelectStudent}
    >
      {(isLoading || isFetching) && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="secondary" style={{ marginTop: spacing.md }}>
            Loading messages...
          </Text>
        </View>
      ) : error ? (
        <EmptyState
          icon="message"
          title="Unable to Load Messages"
          description="Please check your connection and try again."
        />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          ListEmptyComponent={
            <EmptyState
              icon="message"
              title="No Messages"
              description="You haven't sent any messages to the school yet."
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate(ROUTES.SEND_MESSAGE)}
      >
        <Icon name="add" size={28} color={colors.white} />
      </TouchableOpacity>

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
          <ZoomableImage
            uri={imageViewerUri}
            active={imageViewerVisible}
            onZoomChange={setIsImageZoomed}
          />
        </View>
      </Modal>
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing.xl + 70,
    flexGrow: 1,
  },
  messageCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    padding: spacing.base,
    ...shadows.sm,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  messageIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageHeaderText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  messageText: {
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  mediaContainer: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a2e',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  videoOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: '100%',
    height: '100%',
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
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  fileIconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  statusText: {
    color: colors.success,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  // Image viewer styles
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
});
