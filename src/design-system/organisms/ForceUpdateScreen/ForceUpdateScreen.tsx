import React, {useEffect} from 'react';
import {
  View,
  StyleSheet,
  Linking,
  BackHandler,
  StatusBar,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';
import {useBrand} from '../../../core/brand';
import {Text} from '../../atoms/Text';

const brandLogos: Record<string, ImageSourcePropType> = {
  aaimathaji: require('../../../../brands/aaimathaji/assets/icon.png'),
  crescent: require('../../../../brands/crescent/assets/icon.png'),
  pssenior: require('../../../../brands/pssenior/assets/icon.png'),
  bsschool: require('../../../../brands/bsschool/assets/icon.png'),
  sivakasi: require('../../../../brands/sivakasi/assets/icon.png'),
  railwaybalabhavan: require('../../../../brands/railwaybalabhavan/assets/icon.png'),
  littleflower: require('../../../../brands/littleflower/assets/icon.png'),
  stdominics: require('../../../../brands/stdominics/assets/icon.png'),
};

interface ForceUpdateScreenProps {
  playStoreUrl: string;
}

export const ForceUpdateScreen: React.FC<ForceUpdateScreenProps> = ({
  playStoreUrl,
}) => {
  const {brand, brandId} = useBrand();
  const primaryColor = brand?.theme?.colors?.primary || '#137fec';
  const brandName = brand?.brand?.name || 'School';
  const brandLogo = brandLogos[brandId] || brandLogos.crescent;

  // Block Android back button
  useEffect(() => {
    const handler = () => true;
    const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => subscription.remove();
  }, []);

  const handleUpdate = () => {
    if (playStoreUrl) {
      Linking.openURL(playStoreUrl);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: primaryColor}]}>
      <StatusBar backgroundColor={primaryColor} barStyle="light-content" />

      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Image
            source={brandLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Update Required</Text>

        <Text style={styles.message}>
          A new version of {brandName} is available. Please update to continue
          using the app.
        </Text>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdate}
          activeOpacity={0.8}>
          <Text style={[styles.updateButtonText, {color: primaryColor}]}>
            Update Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  updateButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
