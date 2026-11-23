import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import { downloadPdf } from '../../../core/api/downloadPdf';
import {
  GenerateReportCardRequest,
  ReportCardTypesResponse,
} from '../types/reportCard.types';

export const reportCardApi = {
  /** Report card types the student can actually open (empty when none are set up). */
  getReportCardTypes: async (admissionId: string): Promise<ReportCardTypesResponse> => {
    const response = await apiClient.post<ReportCardTypesResponse>(
      API_ENDPOINTS.REPORT_CARD.GET_TYPES,
      { admissionId }
    );
    return response.data;
  },

  /**
   * Generates the report card and saves it to the app cache.
   * Returns the local file path; throws with the backend's message when the
   * response isn't a PDF (e.g. no template mapped yet).
   */
  generateReportCardPdf: (params: GenerateReportCardRequest): Promise<string> =>
    downloadPdf(
      API_ENDPOINTS.REPORT_CARD.GENERATE,
      params,
      `${ReactNativeBlobUtil.fs.dirs.CacheDir}/report_card_${params.admissionId}_${params.report_type_id}.pdf`,
      'Could not load the report card. Please try again.'
    ),

  /** Copies a generated report card into the device's Downloads. Returns the saved location. */
  saveToDownloads: async (sourcePath: string, fileName: string): Promise<string> => {
    if (Platform.OS === 'ios') {
      const dest = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
      if (await ReactNativeBlobUtil.fs.exists(dest)) await ReactNativeBlobUtil.fs.unlink(dest);
      await ReactNativeBlobUtil.fs.cp(sourcePath, dest);
      return dest;
    }

    if (Number(Platform.Version) >= 29) {
      return ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        { name: fileName, parentFolder: '', mimeType: 'application/pdf' },
        'Download',
        sourcePath
      );
    }

    // Android 7-9: public Downloads needs the legacy storage permission.
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Storage permission is needed to download the report card.');
    }
    const dest = `${ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir || ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;
    if (await ReactNativeBlobUtil.fs.exists(dest)) await ReactNativeBlobUtil.fs.unlink(dest);
    await ReactNativeBlobUtil.fs.cp(sourcePath, dest);
    await ReactNativeBlobUtil.fs.scanFile([{ path: dest, mime: 'application/pdf' }]).catch(() => {});
    return dest;
  },
};
