import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  ImageSourcePropType,
} from 'react-native';
import {useBrand} from '../../../core/brand';
import {Text} from '../Text';

const {height} = Dimensions.get('window');

// Pre-load all brand logos (React Native requires static imports)
const brandLogos: Record<string, ImageSourcePropType> = {
  crescent: require('../../../../brands/crescent/assets/icon.png'),
  pssenior: require('../../../../brands/pssenior/assets/icon.png'),
  bsschool: require('../../../../brands/bsschool/assets/icon.png'),
  sivakasi: require('../../../../brands/sivakasi/assets/icon.png'),
  railwaybalabhavan: require('../../../../brands/railwaybalabhavan/assets/icon.png'),
};

export interface SplashScreenProps {
  /** Callback when splash animation completes */
  onAnimationComplete?: () => void;
  /** Custom logo source (overrides brand logo) */
  logo?: ImageSourcePropType;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
  logo,
}) => {
  const {brand, brandId} = useBrand();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const loaderAnim = useRef(new Animated.Value(0)).current;

  // Get splash config from brand or use defaults
  const splashConfig = brand?.features?.splash || {};
  const showTagline = splashConfig.showTagline !== false;
  const showLoader = splashConfig.showLoader !== false;
  const duration = splashConfig.duration || 2500;

  const primaryColor = brand?.theme?.colors?.primary || '#137fec';
  const brandName = brand?.brand?.name || 'School';
  const tagline = brand?.brand?.tagline || '';

  // Get brand-specific logo or fallback to crescent
  const brandLogo = brandLogos[brandId] || brandLogos.crescent;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate loader after logo appears
    if (showLoader) {
      setTimeout(() => {
        Animated.timing(loaderAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 400);
    }

    // Call completion callback
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, {backgroundColor: primaryColor}]}>
      <StatusBar backgroundColor={primaryColor} barStyle="light-content" />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        {/* Logo Circle with Icon */}
        <View style={styles.logoCircle}>
          <Image
            source={logo || brandLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Brand Name */}
        <Text style={styles.brandName}>{brandName}</Text>

        {/* Tagline */}
        {showTagline && tagline ? (
          <Text style={styles.tagline}>{tagline}</Text>
        ) : null}
      </Animated.View>

      {/* Loading Indicator */}
      {showLoader && (
        <Animated.View style={[styles.loaderContainer, {opacity: loaderAnim}]}>
          <LoadingDots />
        </Animated.View>
      )}
    </View>
  );
};

// Simple loading dots animation
const LoadingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, {toValue: 1, duration: 300, useNativeDriver: true}),
        Animated.timing(dot, {toValue: 0.3, duration: 300, useNativeDriver: true}),
      ]);

    Animated.loop(
      Animated.parallel([
        createAnimation(dot1, 0),
        createAnimation(dot2, 150),
        createAnimation(dot3, 300),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, {opacity: dot1}]} />
      <Animated.View style={[styles.dot, {opacity: dot2}]} />
      <Animated.View style={[styles.dot, {opacity: dot3}]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
});
