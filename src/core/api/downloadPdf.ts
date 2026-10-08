import ReactNativeBlobUtil from 'react-native-blob-util';
import { apiClient } from './apiClient';

const readBlob = (blob: Blob, as: 'dataUrl' | 'text'): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    if (as === 'dataUrl') reader.readAsDataURL(blob);
    else reader.readAsText(blob);
  });

/**
 * POSTs to an endpoint that answers with a PDF (or a JSON
 * { status: false, message } when it can't) and saves the PDF to `path`.
 * Goes through apiClient — not a native download — so the call gets the
 * shared auth/error handling and shows up in the request log and DevTools.
 *
 * @returns the saved file path
 * @throws Error with the backend's message when the response isn't a PDF
 */
export const downloadPdf = async (
  endpoint: string,
  body: object,
  path: string,
  fallbackMessage: string
): Promise<string> => {
  const response = await apiClient.post(endpoint, body, { responseType: 'blob' });
  const blob = response.data as Blob;
  const contentType = String(response.headers?.['content-type'] || blob?.type || '');

  if (!contentType.includes('application/pdf')) {
    let message = fallbackMessage;
    try {
      const json = JSON.parse(await readBlob(blob, 'text'));
      if (json?.message) message = json.message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  const dataUrl = await readBlob(blob, 'dataUrl');
  await ReactNativeBlobUtil.fs.writeFile(path, dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  return path;
};
