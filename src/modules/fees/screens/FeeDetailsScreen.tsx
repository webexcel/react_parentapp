import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  Icon,
  colors,
  spacing,
  borderRadius,
  shadows,
  ListTemplate,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useFeeDetails, useFeeSelection, usePaymentHistory } from '../hooks';
import { FeeItemCard, PaymentSummaryBar } from '../components';

type TabType = 'pending' | 'history';

export const FeeDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  // Fetch fee details
  const {
    fees: initialFees,
    totalAmount,
    balanceAmount,
    isLoading,
    error,
    refetch,
  } = useFeeDetails();

  // Fetch payment history
  const {
    receipts,
    totalPaid,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = usePaymentHistory();

  // Manage fee selection with sequential order rule
  const {
    fees,
    selectedFees,
    selectedAmount,
    selectedCount,
    canProceedToPayment,
    toggleFeeSelection,
    selectAllFees,
    clearSelection,
  } = useFeeSelection(initialFees);

  // Track previous fees length and IDs to detect actual changes
  const prevFeesKeyRef = useRef<string>('');

  // Reset selection when fees actually change (not on every render)
  useEffect(() => {
    // Create a stable key from fee IDs to compare
    const currentKey = initialFees.map(f => f.feeheadId).join(',');
    if (prevFeesKeyRef.current && prevFeesKeyRef.current !== currentKey) {
      clearSelection();
    }
    prevFeesKeyRef.current = currentKey;
  }, [initialFees, clearSelection]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    clearSelection();
    await Promise.all([refetch(), refetchHistory()]);
    setRefreshing(false);
  }, [refetch, refetchHistory, clearSelection]);

  const handlePayPress = useCallback(() => {
    if (!canProceedToPayment) {
      Alert.alert(
        'Invalid Selection',
        'Please select fees in order. You cannot skip fees in the payment sequence.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to payment screen with selected fees
    Alert.alert(
      'Proceed to Payment',
      `You are about to pay ₹${selectedAmount.toLocaleString('en-IN')} for ${selectedCount} fee(s).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // TODO: Navigate to payment gateway
            console.log('Selected fees for payment:', selectedFees);
          },
        },
      ]
    );
  }, [canProceedToPayment, selectedAmount, selectedCount, selectedFees]);

  const handleFeePress = useCallback(
    (feeheadId: number) => {
      toggleFeeSelection(feeheadId);
    },
    [toggleFeeSelection]
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <ListTemplate
        headerProps={{
          title: 'Fee Details',
          showBack: true,
          onBack: () => navigation.goBack(),
        }}
        students={students}
        selectedStudentId={selectedStudentId || ''}
        onSelectStudent={selectStudent}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading fee details...</Text>
        </View>
      </ListTemplate>
    );
  }

  // Error state
  if (error) {
    return (
      <ListTemplate
        headerProps={{
          title: 'Fee Details',
          showBack: true,
          onBack: () => navigation.goBack(),
        }}
        students={students}
        selectedStudentId={selectedStudentId || ''}
        onSelectStudent={selectStudent}
      >
        <View style={styles.errorContainer}>
          <Icon name="warning" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load fees</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
        </View>
      </ListTemplate>
    );
  }

  return (
    <ListTemplate
      headerProps={{
        title: 'Fee Details',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}
    >

      {/* Fee Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: colors.success }]} />
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(totalPaid)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: colors.error }]} />
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {formatCurrency(balanceAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}
          >
            Pending Fees
          </Text>
          {fees.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{fees.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}
          >
            Payment History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'pending' ? (
          <>
            {/* Payment Order Notice - only show when there are pending fees */}
            {fees.length > 0 && (
              <View style={styles.noticeCard}>
                <Icon name="info" size={20} color={colors.primary} />
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle}>Payment Order</Text>
                  <Text style={styles.noticeText}>
                    Fees must be paid in sequence. Select fees starting from the first
                    pending fee. You can pay multiple fees together, but cannot skip any.
                  </Text>
                </View>
              </View>
            )}

            {/* Fee List */}
            {fees.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="check" size={48} color={colors.success} />
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptyMessage}>
                  No pending fees. All dues have been paid.
                </Text>
              </View>
            ) : (
              fees.map((fee) => (
                <FeeItemCard
                  key={fee.feeheadId}
                  fee={fee}
                  onPress={handleFeePress}
                  showOrder
                />
              ))
            )}
          </>
        ) : (
          <>
            {/* Payment History */}
            {isHistoryLoading ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : receipts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="receipt" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Payment History</Text>
                <Text style={styles.emptyMessage}>
                  Payment records will appear here after payments are made.
                </Text>
              </View>
            ) : (
              receipts.map((receipt) => (
                <View key={receipt.receiptId} style={styles.receiptCard}>
                  <View style={styles.receiptHeader}>
                    <View style={styles.receiptIconContainer}>
                      <Icon name="receipt" size={20} color={colors.success} />
                    </View>
                    <View style={styles.receiptInfo}>
                      <Text style={styles.receiptNo}>{receipt.receiptNo}</Text>
                      <Text style={styles.receiptDate}>{formatDate(receipt.date)}</Text>
                    </View>
                    <Text style={styles.receiptAmount}>
                      {formatCurrency(receipt.totalAmount)}
                    </Text>
                  </View>

                  <View style={styles.receiptItems}>
                    {receipt.items.map((item, index) => (
                      <View
                        key={item.FEE_REC_DET_ID}
                        style={[
                          styles.receiptItem,
                          index < receipt.items.length - 1 && styles.receiptItemBorder,
                        ]}
                      >
                        <Text style={styles.receiptItemName}>{item.FEE_HEAD}</Text>
                        <Text style={styles.receiptItemAmount}>
                          {formatCurrency(item.PAID_AMOUNT)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Payment Bar - Only show on pending tab */}
      {activeTab === 'pending' && fees.length > 0 && (
        <PaymentSummaryBar
          selectedCount={selectedCount}
          totalFees={fees.length}
          selectedAmount={selectedAmount}
          onPayPress={handlePayPress}
          disabled={!canProceedToPayment}
        />
      )}
    </ListTemplate>
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
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surfaceLight,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.base,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.xs,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noticeCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  noticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  historyLoading: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  receiptCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiptIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptNo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  receiptDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  receiptItems: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  receiptItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  receiptItemName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  receiptItemAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
