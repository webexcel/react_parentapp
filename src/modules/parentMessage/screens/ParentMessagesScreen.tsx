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
import { useParentMessages, useDeleteMessage } from '../hooks/useParentMessages';
import { ParentMessage } from '../types/parentMessage.types';
import { ROUTES } from '../../../core/constants';

export const ParentMessagesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Wrap async selectStudent for ListTemplate compatibility
  const handleSelectStudent = (id: string) => {
    selectStudent(id);
  };

  const { messages, isLoading, isFetching, error, refetch } = useParentMessages();
  const { deleteMessage, isLoading: isDeleting } = useDeleteMessage();

  // Auto-fetch when screen comes into focus
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

  const renderMessage = ({ item }: { item: ParentMessage }) => {
    const hasMedia = item.url && item.url.length > 0;
    const isVideo = item.url?.includes('.mp4');

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

        {hasMedia && (
          <View style={styles.mediaContainer}>
            {isVideo ? (
              <View style={styles.videoThumbnail}>
                {item.thumbnail ? (
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Icon name="playCircle" size={40} color={colors.white} />
                  </View>
                )}
                <View style={styles.videoOverlay}>
                  <Icon name="playCircle" size={32} color={colors.white} />
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: item.url! }}
                style={styles.attachmentImage}
                resizeMode="cover"
              />
            )}
          </View>
        )}

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
    paddingBottom: spacing.xl + 70, // Extra space for FAB
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
  videoThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundLight,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusBadge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
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
});
