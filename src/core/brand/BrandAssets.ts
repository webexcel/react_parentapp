import {ImageSourcePropType} from 'react-native';

// Brand logos - pre-required for React Native bundler
// Each brand's icon.png from brands/{brandId}/assets/
const brandLogos: Record<string, ImageSourcePropType> = {
  bsschool: require('../../../brands/bsschool/assets/icon.png'),
  crescent: require('../../../brands/crescent/assets/icon.png'),
  pssenior: require('../../../brands/pssenior/assets/icon.png'),
  railwaybalabhavan: require('../../../brands/railwaybalabhavan/assets/icon.png'),
  sivakasi: require('../../../brands/sivakasi/assets/icon.png'),
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
