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
  aadhithya: require('../../../../brands/aadhithya/assets/icon.png'),
  aaimathaji: require('../../../../brands/aaimathaji/assets/icon.png'),
  alphacbse: require('../../../../brands/alphacbse/assets/icon.png'),
  alphamat: require('../../../../brands/alphamat/assets/icon.png'),
  alphatechno: require('../../../../brands/alphatechno/assets/icon.png'),
  avl: require('../../../../brands/avl/assets/icon.png'),
  balakrishna: require('../../../../brands/balakrishna/assets/icon.png'),
  bsschool: require('../../../../brands/bsschool/assets/icon.png'),
  carmelnp: require('../../../../brands/carmelnp/assets/icon.png'),
  crescent: require('../../../../brands/crescent/assets/icon.png'),
  csistthomas: require('../../../../brands/csistthomas/assets/icon.png'),
  doon: require('../../../../brands/doon/assets/icon.png'),
  glory: require('../../../../brands/glory/assets/icon.png'),
  greenworldschool: require('../../../../brands/greenworldschool/assets/icon.png'),
  holyangels: require('../../../../brands/holyangels/assets/icon.png'),
  holycresentmatric: require('../../../../brands/holycresentmatric/assets/icon.png'),
  holycresentnaz: require('../../../../brands/holycresentnaz/assets/icon.png'),
  holycresentsri: require('../../../../brands/holycresentsri/assets/icon.png'),
  holycresentthiru: require('../../../../brands/holycresentthiru/assets/icon.png'),
  infant: require('../../../../brands/infant/assets/icon.png'),
  islamiah: require('../../../../brands/islamiah/assets/icon.png'),
  joshua: require('../../../../brands/joshua/assets/icon.png'),
  kalaimagal: require('../../../../brands/kalaimagal/assets/icon.png'),
  kamalanehru: require('../../../../brands/kamalanehru/assets/icon.png'),
  littleflower: require('../../../../brands/littleflower/assets/icon.png'),
  measi: require('../../../../brands/measi/assets/icon.png'),
  mountcarmel: require('../../../../brands/mountcarmel/assets/icon.png'),
  mountseno: require('../../../../brands/mountseno/assets/icon.png'),
  nationallotus: require('../../../../brands/nationallotus/assets/icon.png'),
  ourladyexcel: require('../../../../brands/ourladyexcel/assets/icon.png'),
  periyar: require('../../../../brands/periyar/assets/icon.png'),
  pssenior: require('../../../../brands/pssenior/assets/icon.png'),
  railwaybalabhavan: require('../../../../brands/railwaybalabhavan/assets/icon.png'),
  rpccbse: require('../../../../brands/rpccbse/assets/icon.png'),
  rukmani: require('../../../../brands/rukmani/assets/icon.png'),
  sivakasi: require('../../../../brands/sivakasi/assets/icon.png'),
  stdominics: require('../../../../brands/stdominics/assets/icon.png'),
  stjosephkodu: require('../../../../brands/stjosephkodu/assets/icon.png'),
  templegreen: require('../../../../brands/templegreen/assets/icon.png'),
  templepark: require('../../../../brands/templepark/assets/icon.png'),
  udhayamglobal: require('../../../../brands/udhayamglobal/assets/icon.png'),
  venkateshwara: require('../../../../brands/venkateshwara/assets/icon.png'),
  vidyaratna: require('../../../../brands/vidyaratna/assets/icon.png'),
  vnrvivekananda: require('../../../../brands/vnrvivekananda/assets/icon.png'),
  vsnmatric: require('../../../../brands/vsnmatric/assets/icon.png'),
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
