import {useState, useEffect} from 'react';
import axios from 'axios';
import DeviceInfo from 'react-native-device-info';
import {useBrand} from '../brand';
import {config} from '../constants/config';
import {API_ENDPOINTS} from '../api/apiEndpoints';

function isVersionLower(current: string, minimum: string): boolean {
  const curr = current.split('.').map(Number);
  const min = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((curr[i] || 0) < (min[i] || 0)) return true;
    if ((curr[i] || 0) > (min[i] || 0)) return false;
  }
  return false;
}

interface ForceUpdateState {
  needsUpdate: boolean;
  playStoreUrl: string;
  isChecking: boolean;
}

export const useForceUpdate = (): ForceUpdateState => {
  const {brandId} = useBrand();
  const [state, setState] = useState<ForceUpdateState>({
    needsUpdate: false,
    playStoreUrl: '',
    isChecking: true,
  });

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const currentVersion = DeviceInfo.getVersion();
        const url = `${config.API_BASE_URL}${API_ENDPOINTS.APP_VERSION.CHECK}`;
        // console.log('[ForceUpdate] Checking version:', currentVersion, 'URL:', url);

        const response = await axios.post(url, {brandId}, {timeout: 10000});
        // console.log('[ForceUpdate] Response:', JSON.stringify(response.data));

        if (response.data?.status && response.data?.data) {
          const {minVersion, playStoreUrl} = response.data.data;
          const needsUpdate = isVersionLower(currentVersion, minVersion);
          // console.log('[ForceUpdate] minVersion:', minVersion, 'needsUpdate:', needsUpdate);
          setState({needsUpdate, playStoreUrl, isChecking: false});
        } else {
          setState(prev => ({...prev, isChecking: false}));
        }
      } catch (error) {
        // console.log('[ForceUpdate] Version check failed, skipping:', error);
        setState(prev => ({...prev, isChecking: false}));
      }
    };

    checkVersion();
  }, [brandId]);

  return state;
};
