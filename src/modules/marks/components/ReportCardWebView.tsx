import { useEffect } from 'react';
import { Linking } from 'react-native';

interface Props {
  visible: boolean;
  url: string;
  onClose: () => void;
}

export const ReportCardWebView: React.FC<Props> = ({ visible, url, onClose }) => {
  useEffect(() => {
    if (visible && url) {
      // Open directly in browser
      Linking.openURL(url).catch(() => {
        // Failed to open URL
      });
      // Close immediately after opening
      onClose();
    }
  }, [visible, url, onClose]);

  // Don't render anything - just open in browser
  return null;
};
