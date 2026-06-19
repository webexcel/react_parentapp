import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Text, Icon} from '../design-system';
import type {IconName} from '../design-system/atoms/Icon/Icon';
import {useTheme} from '../design-system/theme/ThemeContext';
import {useBrand, useBrandId, useBrandName} from '../core/brand';
import {getBrandLogo} from '../core/brand/BrandAssets';
import {useAuth} from '../core/auth';
import {ROUTES} from '../core/constants';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DRAWER_WIDTH = 280;

interface MenuItem {
  label: string;
  icon: IconName;
  route: string;
  module?: string;
}

const menuItems: MenuItem[] = [
  {label: 'Dashboard', icon: 'dashboard', route: ROUTES.DASHBOARD},
  {label: 'Circulars', icon: 'campaign', route: ROUTES.CIRCULARS, module: 'circulars'},
  {label: 'Homework', icon: 'homework', route: ROUTES.HOMEWORK, module: 'homework'},
  {label: 'Attendance', icon: 'attendance', route: ROUTES.ATTENDANCE, module: 'attendance'},
  {label: 'View Marks', icon: 'marks', route: ROUTES.MARKS, module: 'marks'},
  {label: 'Exam Schedule', icon: 'exam', route: ROUTES.EXAM_SCHEDULE, module: 'exams'},
  {label: 'Gallery', icon: 'gallery', route: ROUTES.GALLERY, module: 'gallery'},
  {label: 'Calendar', icon: 'calendar', route: ROUTES.CALENDAR, module: 'calendar'},
  {label: 'Fee Details', icon: 'fees', route: ROUTES.FEE_DETAILS, module: 'fees'},
  {label: 'Timetable', icon: 'timetable', route: ROUTES.TIMETABLE, module: 'timetable'},
  {label: 'Write to School', icon: 'message', route: ROUTES.PARENT_MESSAGES},
  {label: 'Leave Letter', icon: 'leaveLetter', route: ROUTES.LEAVE_LETTER},
];

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({visible, onClose}) => {
  const {colors} = useTheme();
  const navigation = useNavigation<any>();
  const {isModuleEnabled} = useBrand();
  const {logout} = useAuth();
  const brandId = useBrandId();
  const brandName = useBrandName();
  const logo = getBrandLogo(brandId);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    onClose();
    // For tab screens, navigate to tabs first then the screen
    if (
      route === ROUTES.DASHBOARD ||
      route === ROUTES.HOMEWORK ||
      route === ROUTES.CIRCULARS ||
      route === ROUTES.CHAT ||
      route === ROUTES.PROFILE
    ) {
      navigation.navigate(ROUTES.MAIN_TABS, {screen: route});
    } else {
      navigation.navigate(route);
    }
  };

  const filteredItems = menuItems.filter(item => {
    if (!item.module) return true;
    return isModuleEnabled(item.module as any);
  });

  if (!visible) {
    // Still render but offscreen so animation out completes
    // Use pointerEvents to not block touches when hidden
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.wrapper]}
      pointerEvents={visible ? 'auto' : 'none'}>
      {/* Dark overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {opacity: overlayOpacity},
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.surface,
            transform: [{translateX}],
          },
        ]}>
        {/* Header with school logo */}
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandName}>{brandName}</Text>
        </View>

        {/* Menu items */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          {filteredItems.map(item => (
            <TouchableOpacity
              key={item.route}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}>
              <Icon name={item.icon} size={22} color={colors.textSecondary} />
              <Text style={[styles.menuLabel, {color: colors.textPrimary}]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Logout - inside scroll, after all menu items */}
          <View style={[styles.logoutSection, {borderTopColor: colors.border}]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { onClose(); logout(); }}
              activeOpacity={0.7}>
              <Icon name="logout" size={22} color="#DC6B6B" />
              <Text style={styles.logoutLabel}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 1000,
    elevation: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  menuList: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuLabel: {
    fontSize: 15,
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutSection: {
    borderTopWidth: 1,
    paddingVertical: 8,
    marginBottom: 24,
  },
  logoutLabel: {
    fontSize: 15,
    marginLeft: 16,
    fontWeight: '500',
    color: '#DC6B6B',
  },
});
