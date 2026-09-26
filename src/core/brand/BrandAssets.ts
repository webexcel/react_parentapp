import {ImageSourcePropType} from 'react-native';

// Brand logos - pre-required for React Native bundler
// Each brand's icon.png from brands/{brandId}/assets/
const brandLogos: Record<string, ImageSourcePropType> = {
  aadhithya: require('../../../brands/aadhithya/assets/icon.png'),
  aaimathaji: require('../../../brands/aaimathaji/assets/icon.png'),
  alphacbse: require('../../../brands/alphacbse/assets/icon.png'),
  alphamat: require('../../../brands/alphamat/assets/icon.png'),
  alphatechno: require('../../../brands/alphatechno/assets/icon.png'),
  avl: require('../../../brands/avl/assets/icon.png'),
  balakrishna: require('../../../brands/balakrishna/assets/icon.png'),
  bsschool: require('../../../brands/bsschool/assets/icon.png'),
  carmelnp: require('../../../brands/carmelnp/assets/icon.png'),
  crescent: require('../../../brands/crescent/assets/icon.png'),
  csistthomas: require('../../../brands/csistthomas/assets/icon.png'),
  doon: require('../../../brands/doon/assets/icon.png'),
  glory: require('../../../brands/glory/assets/icon.png'),
  greenworldschool: require('../../../brands/greenworldschool/assets/icon.png'),
  holyangels: require('../../../brands/holyangels/assets/icon.png'),
  holycresentmatric: require('../../../brands/holycresentmatric/assets/icon.png'),
  holycresentnaz: require('../../../brands/holycresentnaz/assets/icon.png'),
  holycresentsri: require('../../../brands/holycresentsri/assets/icon.png'),
  holycresentthiru: require('../../../brands/holycresentthiru/assets/icon.png'),
  infant: require('../../../brands/infant/assets/icon.png'),
  islamiah: require('../../../brands/islamiah/assets/icon.png'),
  joshua: require('../../../brands/joshua/assets/icon.png'),
  kalaimagal: require('../../../brands/kalaimagal/assets/icon.png'),
  kamalanehru: require('../../../brands/kamalanehru/assets/icon.png'),
  littleflower: require('../../../brands/littleflower/assets/icon.png'),
  measi: require('../../../brands/measi/assets/icon.png'),
  mountcarmel: require('../../../brands/mountcarmel/assets/icon.png'),
  mountseno: require('../../../brands/mountseno/assets/icon.png'),
  nationallotus: require('../../../brands/nationallotus/assets/icon.png'),
  ourladyexcel: require('../../../brands/ourladyexcel/assets/icon.png'),
  ourladynp: require('../../../brands/ourladynp/assets/icon.png'),
  periyar: require('../../../brands/periyar/assets/icon.png'),
  pssenior: require('../../../brands/pssenior/assets/icon.png'),
  railwaybalabhavan: require('../../../brands/railwaybalabhavan/assets/icon.png'),
  rpccbse: require('../../../brands/rpccbse/assets/icon.png'),
  rukmani: require('../../../brands/rukmani/assets/icon.png'),
  sivakasi: require('../../../brands/sivakasi/assets/icon.png'),
  stdominics: require('../../../brands/stdominics/assets/icon.png'),
  stjosephkodu: require('../../../brands/stjosephkodu/assets/icon.png'),
  stmoses: require('../../../brands/stmoses/assets/icon.png'),
  templegreen: require('../../../brands/templegreen/assets/icon.png'),
  templepark: require('../../../brands/templepark/assets/icon.png'),
  udhayamglobal: require('../../../brands/udhayamglobal/assets/icon.png'),
  venkateshwara: require('../../../brands/venkateshwara/assets/icon.png'),
  vidyaratna: require('../../../brands/vidyaratna/assets/icon.png'),
  vipschool: require('../../../brands/vipschool/assets/icon.png'),
  vnrvivekananda: require('../../../brands/vnrvivekananda/assets/icon.png'),
  vsnmatric: require('../../../brands/vsnmatric/assets/icon.png'),
};

// Default fallback logo
const defaultLogo: ImageSourcePropType = require('../../../brands/crescent/assets/icon.png');

/**
 * Get the logo for a specific brand
 * @param brandId - The brand identifier
 * @returns ImageSourcePropType for use with Image component
 */
export const getBrandLogo = (brandId: string): ImageSourcePropType => {
  return brandLogos[brandId] || defaultLogo;
};

/**
 * Get all available brand logos
 */
export const getAllBrandLogos = (): Record<string, ImageSourcePropType> => {
  return brandLogos;
};

export default brandLogos;
