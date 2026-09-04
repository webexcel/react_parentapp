import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Animated,
  ScrollView,
  BackHandler,
} from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Video from 'react-native-video';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ListTemplate,
  Text,
  LinkedText,
  Icon,
  EmptyState,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useGallery } from '../hooks/useGallery';
import { GalleryAlbum, GalleryImage } from '../types/gallery.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - spacing.base * 3) / 2;

// --- Zoomable Image for Gallery Viewer (matches circular viewer pattern) ---
interface ZoomableGalleryImageProps {
  uri: string;
  active: boolean;
  onZoomChange: (zoomed: boolean) => void;
}

const ZoomableGalleryImage: React.FC<ZoomableGalleryImageProps> = ({ uri, active, onZoomChange }) => {
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
    const offsetX = tapX - SCREEN_WIDTH / 2;
    const offsetY = tapY - SCREEN_HEIGHT / 2;
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
        const margin = SCREEN_HEIGHT * 0.15;
        if (pageY > margin && pageY < SCREEN_HEIGHT - margin) {
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
                style={styles.zoomImage}
                resizeMode="contain"
              />
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </TouchableOpacity>
  );
};

// --- Video Player for Gallery Viewer ---
const GalleryVideoPlayer: React.FC<{ uri: string; isActive: boolean }> = ({ uri, isActive }) => {
  const [paused, setPaused] = useState(true);

  // Pause when swiped away
  React.useEffect(() => {
    if (!isActive) setPaused(true);
  }, [isActive]);

  return (
    <View style={styles.zoomContainer}>
      <Video
        source={{ uri }}
        style={styles.videoPlayer}
        resizeMode="contain"
        paused={paused}
        controls
        onEnd={() => setPaused(true)}
      />
      {paused && (
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={() => setPaused(false)}
          activeOpacity={0.8}
        >
          <View style={styles.playButton}>
            <Icon name="playCircle" size={40} color={colors.white} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const GalleryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const { albums, isLoading, isFetching, error, refetch } = useGallery();

  const [refreshing, setRefreshing] = useState(false);

  // Auto-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showImageViewer) {
          setShowImageViewer(false);
          setSelectedImage(null);
          setIsImageZoomed(false);
          return true;
        }
        if (selectedAlbum) {
          setSelectedAlbum(null);
          return true;
        }
        return false; // let navigation handle it
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showImageViewer, selectedAlbum])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    // Handle DD-Mon-YYYY format from API
    if (dateString.includes('-')) {
      return dateString;
    }
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleAlbumPress = (album: GalleryAlbum) => {
    setSelectedAlbum(album);
  };

  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const handleImagePress = (image: GalleryImage) => {
    const index = selectedAlbum?.images.findIndex(i => i.id === image.id) || 0;
    setImageViewerIndex(index >= 0 ? index : 0);
    setSelectedImage(image);
    setShowImageViewer(true);
  };

  const handleCloseViewer = () => {
    setShowImageViewer(false);
    setSelectedImage(null);
    setIsImageZoomed(false);
  };

  const handleBackFromAlbum = () => {
    setSelectedAlbum(null);
  };

  const renderAlbum = useCallback(
    ({ item }: { item: GalleryAlbum }) => (
      <TouchableOpacity
        style={styles.albumCard}
        onPress={() => handleAlbumPress(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.coverImage }} style={styles.albumCover} />
        <View style={styles.albumOverlay}>
          <View style={styles.albumInfo}>
            <Text variant="body" semibold style={styles.albumTitle}>
              {item.title}
            </Text>
            <Text variant="caption" style={styles.albumMeta}>
              {formatDate(item.date)} • {item.imageCount} items
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    []
  );

  const renderImage = useCallback(
    ({ item }: { item: GalleryImage }) => (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => handleImagePress(item)}
        activeOpacity={0.8}
      >
        {item.type === 'video' ? (
          <View style={styles.videoThumbContainer}>
            <View style={styles.videoThumbPlaceholder}>
              <Icon name="playCircle" size={40} color={colors.white} />
            </View>
            <View style={styles.videoBadge}>
              <Icon name="playCircle" size={16} color={colors.white} />
              <Text variant="caption" style={styles.videoBadgeText}>Video</Text>
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: item.thumbnailUri || item.uri }}
            style={styles.gridImage}
          />
        )}
      </TouchableOpacity>
    ),
    []
  );

  const albumImages = selectedAlbum?.images || [];

  const renderImageViewer = () => (
    <Modal
      visible={showImageViewer}
      transparent
      animationType="fade"
      onRequestClose={handleCloseViewer}
    >
      <View style={styles.viewerContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={handleCloseViewer}>
          <Icon name="close" size={28} color={colors.white} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: imageViewerIndex * SCREEN_WIDTH, y: 0 }}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setImageViewerIndex(newIndex);
            if (albumImages[newIndex]) {
              setSelectedImage(albumImages[newIndex]);
            }
          }}
          scrollEnabled={!isImageZoomed}
        >
          {albumImages.map((image, idx) => (
            image.type === 'video' ? (
              <GalleryVideoPlayer key={image.id} uri={image.uri} isActive={idx === imageViewerIndex} />
            ) : (
              <ZoomableGalleryImage
                key={image.id}
                uri={image.uri}
                active={imageViewerIndex === idx}
                onZoomChange={setIsImageZoomed}
              />
            )
          ))}
        </ScrollView>

        {/* Caption */}
        {selectedImage?.caption && (
          <View style={styles.captionContainer}>
            <Text variant="body" style={styles.captionText}>
              {selectedImage.caption}
            </Text>
          </View>
        )}

        {/* Counter */}
        {albumImages.length > 1 && (
          <Text variant="caption" style={styles.imageCounter}>
            {imageViewerIndex + 1} / {albumImages.length}
          </Text>
        )}
      </View>
    </Modal>
  );

  // Loading state
  if ((isLoading || isFetching) && !refreshing) {
    return (
      <ListTemplate
        headerProps={{
          title: 'Photo Gallery',
          showBack: true,
          onBack: () => navigation.goBack(),
        }}
        students={students}
        selectedStudentId={selectedStudentId || ''}
        onSelectStudent={selectStudent}
        hideStudentSelector
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading gallery...
          </Text>
        </View>
      </ListTemplate>
    );
  }

  // Album detail view
  if (selectedAlbum) {
    return (
      <ListTemplate
        headerProps={{
          title: selectedAlbum.title,
          showBack: true,
          onBack: handleBackFromAlbum,
        }}
        students={students}
        selectedStudentId={selectedStudentId || ''}
        onSelectStudent={selectStudent}
        hideStudentSelector
      >
        <FlatList
          key="album-images"
          data={selectedAlbum.images}
          keyExtractor={(item) => item.id}
          renderItem={renderImage}
          numColumns={2}
          columnWrapperStyle={styles.imageRow}
          contentContainerStyle={styles.imageGrid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.albumHeader}>
              <Text variant="caption" color="secondary">
                {formatDate(selectedAlbum.date)} • {selectedAlbum.imageCount} items
              </Text>
              {selectedAlbum.description && (
                <LinkedText variant="body" color="secondary" style={styles.albumDescription}>
                  {selectedAlbum.description}
                </LinkedText>
              )}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="gallery"
              title="No Photos"
              description="No photos available in this album."
            />
          }
        />
        {renderImageViewer()}
      </ListTemplate>
    );
  }

  // Albums list view
  return (
    <ListTemplate
      headerProps={{
        title: 'Photo Gallery',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}
      hideStudentSelector
    >
      <FlatList
        key="album-list"
        data={albums}
        keyExtractor={(item) => item.id}
        renderItem={renderAlbum}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="gallery"
            title="No Albums"
            description={error ? 'Failed to load gallery. Pull to refresh.' : 'No photo albums available yet.'}
          />
        }
      />
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  albumCard: {
    height: 180,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.base,
    ...shadows.md,
  },
  albumCover: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  albumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  albumInfo: {
    padding: spacing.base,
  },
  albumTitle: {
    color: colors.white,
  },
  albumMeta: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  albumDescription: {
    marginTop: spacing.sm,
  },
  imageGrid: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  imageRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.border,
    ...shadows.sm,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  albumHeader: {
    marginBottom: spacing.md,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: spacing.sm,
  },
  zoomContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: spacing.base,
  },
  captionText: {
    color: colors.white,
    textAlign: 'center',
  },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  videoThumbContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  videoBadgeText: {
    color: colors.white,
    fontSize: 11,
  },
});
