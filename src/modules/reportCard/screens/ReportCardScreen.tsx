import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import FileViewer from 'react-native-file-viewer';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  ListTemplate,
  Text,
  Button,
  EmptyState,
  colors,
  spacing,
  borderRadius,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useIsModuleEnabled } from '../../../core/brand/featureFlags';
import { ROUTES } from '../../../core/constants';
import { useReportCardTypes, useReportCardPdf } from '../hooks/useReportCard';
import { ReportTypeDropdown } from '../components/ReportTypeDropdown';
import { reportCardApi } from '../services/reportCardApi';
import { ReportCardType } from '../types/reportCard.types';

export const ReportCardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // The parent picks a report card first, unless there is only one.
  const [selectedType, setSelectedType] = useState<ReportCardType | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { types, isLoading: isLoadingTypes, error: typesError } = useReportCardTypes(
    selectedStudent?.studentId
  );

  // Types differ per student (exam group), so start over on a student switch.
  useEffect(() => {
    setSelectedType(types.length === 1 ? types[0] : null);
  }, [selectedStudentId, types]);
  // A locked card is explained from the type list; it is never requested.
  const { pdfPath, isLoading: isGenerating, error: pdfError, refetch } = useReportCardPdf(
    selectedStudent?.studentId,
    selectedType?.locked ? null : selectedType
  );
  const isFeesEnabled = useIsModuleEnabled('fees');

  const handleDownload = async () => {
    if (!pdfPath || !selectedType) return;
    try {
      setDownloading(true);
      const fileName = `ReportCard_${selectedStudent?.name || selectedStudent?.studentId}_${selectedType.report_type}`
        .replace(/[^A-Za-z0-9_-]+/g, '_') + '.pdf';
      await reportCardApi.saveToDownloads(pdfPath, fileName);
      // Open the generated file (same content as the saved copy).
      await FileViewer.open(pdfPath, { showOpenWithDialog: true, displayName: fileName });
    } catch (e: any) {
      Alert.alert('Download failed', e?.message || 'Could not download the report card.');
    } finally {
      setDownloading(false);
    }
  };

  const renderBody = () => {
    if (isLoadingTypes) {
      return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
    }
    if (typesError) {
      return (
        <EmptyState
          icon="marks"
          title="Unable to Load Report Cards"
          description="Please check your connection and try again."
        />
      );
    }
    if (types.length === 0) {
      return (
        <EmptyState
          icon="marks"
          title="No Report Cards"
          description="Report cards have not been published yet."
        />
      );
    }
    if (!selectedType) {
      return (
        <EmptyState
          icon="marks"
          title="Select a Report Card"
          description="Choose a report card above to view it."
        />
      );
    }
    if (selectedType.locked) {
      const isFees = selectedType.lock_reason === 'fees';
      return (
        <View style={styles.messageBox}>
          <EmptyState
            style={styles.messageState}
            icon="lock"
            title={isFees ? 'Term Fees Pending' : 'Not Published Yet'}
            description={
              selectedType.lock_message ||
              (isFees
                ? 'Please clear the pending fees to view this report card.'
                : 'The report card will be available once the school publishes all its marks.')
            }
          />
          {isFees && isFeesEnabled && (
            <Button
              title="Go to Fees"
              variant="outline"
              size="sm"
              style={styles.messageAction}
              onPress={() => navigation.navigate(ROUTES.FEE_DETAILS)}
            />
          )}
        </View>
      );
    }
    if (isGenerating) {
      return (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="secondary" style={styles.loaderText}>
            Preparing report card...
          </Text>
        </View>
      );
    }
    if (pdfError || !pdfPath) {
      return (
        <View style={styles.messageBox}>
          <EmptyState
            style={styles.messageState}
            icon="marks"
            title="Report Card Not Available"
            description={pdfError?.message || 'Please try again later.'}
          />
          <Button title="Try Again" variant="outline" size="sm" style={styles.messageAction} onPress={() => refetch()} />
        </View>
      );
    }
    return (
      <>
        <View style={styles.pdfContainer}>
          <Pdf
            source={{ uri: `file://${pdfPath}` }}
            style={styles.pdf}
            trustAllCerts={false}
            onError={() => Alert.alert('Error', 'Could not display the report card.')}
          />
        </View>
        <Button
          title="Download"
          onPress={handleDownload}
          loading={downloading}
          disabled={downloading}
          fullWidth
          leftIcon={<Icon name="download-outline" size={20} color={colors.textWhite} />}
          style={styles.downloadButton}
        />
      </>
    );
  };

  return (
    <ListTemplate
      headerProps={{
        title: 'Report Card',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}
    >
      <View style={styles.container}>
        {types.length > 0 && (
          <ReportTypeDropdown
            types={types}
            selected={selectedType}
            onSelect={setSelectedType}
            disabled={isGenerating}
          />
        )}
        {renderBody()}
      </View>
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.base,
  },
  loader: {
    marginTop: spacing['2xl'],
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: spacing.md,
  },
  // Message + its action, centred together (no flex on the message, so the
  // button sits right under it instead of at the bottom of the screen).
  messageBox: {
    flex: 1,
    justifyContent: 'center',
  },
  messageState: {
    flex: 0,
  },
  messageAction: {
    alignSelf: 'center',
    marginTop: spacing.base,
  },
  pdfContainer: {
    flex: 1,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  pdf: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  downloadButton: {
    marginTop: spacing.md,
  },
});
