import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ListTemplate,
  Text,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - spacing.base * 3) / 2;

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

  const handleImagePress = (image: GalleryImage) => {
    setSelectedImage(image);
    setShowImageViewer(true);
  };

  const handleCloseViewer = () => {
    setShowImageViewer(false);
    setSelectedImage(null);
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
              {formatDate(item.date)} • {item.imageCount} photos
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
        <Image
          source={{ uri: item.thumbnailUri || item.uri }}
          style={styles.gridImage}
        />
      </TouchableOpacity>
    ),
    []
  );

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

        {selectedImage && (
          <>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            {selectedImage.caption && (
              <View style={styles.captionContainer}>
                <Text variant="body" style={styles.captionText}>
                  {selectedImage.caption}
                </Text>
              </View>
            )}
          </>
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
                {formatDate(selectedAlbum.date)} • {selectedAlbum.imageCount} photos
              </Text>
              {selectedAlbum.description && (
                <Text variant="body" color="secondary" style={styles.albumDescription}>
                  {selectedAlbum.description}
                </Text>
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
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    padding: spacing.base,
  },
  captionText: {
    color: colors.white,
    textAlign: 'center',
  },
});
