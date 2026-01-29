import React, {useState, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  ListTemplate,
  Text,
  Icon,
  EmptyState,
  colors,
  spacing,
  borderRadius,
} from '../../../design-system';
import {useAuth} from '../../../core/auth';
import {useLeaveLetter} from '../hooks/useLeaveLetter';
import {LeaveRequestForm} from '../components/LeaveRequestForm';
import {LeaveRequestCard} from '../components/LeaveRequestCard';
import {LeaveRequest, LeaveFormData} from '../types/leaveLetter.types';

export const LeaveLetterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {students, selectedStudentId, selectStudent} = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleSelectStudent = (id: string) => {
    selectStudent(id);
  };

  const {
    leaveRequests,
    isLoading,
    isFetching,
    error,
    refetch,
    insertLeaveRequest,
    isInserting,
    updateLeaveRequest,
    isUpdating,
    deleteLeaveRequest,
    isDeleting,
  } = useLeaveLetter();

  // Auto-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (data: LeaveFormData) => {
    try {
      if (editingRequest) {
        await updateLeaveRequest({
          id: editingRequest.id,
          sessionType: data.sessionType,
          startDate: formatDateForApi(data.startDate),
          endDate: formatDateForApi(data.endDate),
          message: data.message,
        });
        Alert.alert('Success', 'Leave request updated successfully');
      } else {
        await insertLeaveRequest({
          sessionType: data.sessionType,
          startDate: formatDateForApi(data.startDate),
          endDate: formatDateForApi(data.endDate),
          message: data.message,
        });
        Alert.alert('Success', 'Leave request submitted successfully');
      }
      setShowFormModal(false);
      setEditingRequest(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit leave request. Please try again.');
    }
  };

  const handleEdit = (request: LeaveRequest) => {
    setEditingRequest(request);
    setShowFormModal(true);
  };

  const handleDelete = (request: LeaveRequest) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this leave request?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(request.id);
            try {
              await deleteLeaveRequest(request.id);
              Alert.alert('Success', 'Leave request deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete leave request');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    setShowFormModal(false);
    setEditingRequest(null);
  };

  const openNewRequestForm = () => {
    setEditingRequest(null);
    setShowFormModal(true);
  };

  const getInitialFormData = (): Partial<LeaveFormData> | undefined => {
    if (!editingRequest) return undefined;
    return {
      sessionType: String(editingRequest.abtype),
      startDate: new Date(editingRequest.fdate),
      endDate: new Date(editingRequest.tdate),
      message: editingRequest.reson,
    };
  };

  const renderRequest = ({item}: {item: LeaveRequest}) => (
    <LeaveRequestCard
      request={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isDeleting={deletingId === item.id}
    />
  );

  return (
    <ListTemplate
      headerProps={{
        title: 'Leave Letter',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={handleSelectStudent}>
      {(isLoading || isFetching) && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="secondary" style={{marginTop: spacing.md}}>
            Loading leave requests...
          </Text>
        </View>
      ) : error ? (
        <EmptyState
          icon="calendar"
          title="Unable to Load Requests"
          description="Please check your connection and try again."
        />
      ) : (
        <FlatList
          data={leaveRequests}
          keyExtractor={item => item.id.toString()}
          renderItem={renderRequest}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title="No Leave Requests"
              description="Tap the + button to submit a new leave request."
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
      <TouchableOpacity style={styles.fab} onPress={openNewRequestForm}>
        <Icon name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="h2">
              {editingRequest ? 'Edit Request' : 'New Leave Request'}
            </Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <LeaveRequestForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isInserting || isUpdating}
              initialData={getInitialFormData()}
              isEditMode={!!editingRequest}
            />
          </ScrollView>
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
    paddingBottom: spacing.xl + 70, // Extra space for FAB
    flexGrow: 1,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: spacing.base,
  },
});
