import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Modal,
  Animated,
  Easing,
  Image,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon, colors } from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useBrand } from '../../../core/brand';
import { getBrandLogo } from '../../../core/brand/BrandAssets';
import { ROUTES } from '../../../core/constants';
import { navigateFromRoot } from '../../navigationRef';
import { styles, DRAWER_MAX_WIDTH } from './SideDrawer.styles';
import type { DrawerMenuItem, SideDrawerProps } from './SideDrawer.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(DRAWER_MAX_WIDTH, SCREEN_WIDTH * 0.82);
const ANIMATION_DURATION = 240;
/** Drag this far left and the drawer closes on release */
const SWIPE_CLOSE_THRESHOLD = PANEL_WIDTH / 3;

const getInitial = (name?: string): string =>
  name?.trim()?.charAt(0)?.toUpperCase() || '?';

export const SideDrawer: React.FC<SideDrawerProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { students, logout } = useAuth();
  const { brand, brandId, isModuleEnabled } = useBrand();

  // Keeps the Modal mounted while the close animation plays
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  // Extra offset applied while the user drags the panel
  const drag = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (toValue: number, onFinish?: () => void) => {
      Animated.timing(progress, {
        toValue,
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onFinish?.();
        }
      });
    },
    [progress],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      // Wait for the Modal to mount before animating in
      requestAnimationFrame(() => animateTo(1));
    } else if (mounted) {
      animateTo(0, () => setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Close, then run `after` once the panel has slid away */
  const closeThen = useCallback(
    (after?: () => void) => {
      animateTo(0, () => {
        setMounted(false);
        onClose();
        after?.();
      });
    },
    [animateTo, onClose],
  );

  // Drag the panel left to dismiss
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dx < -8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dx < 0) {
            drag.setValue(gesture.dx);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -SWIPE_CLOSE_THRESHOLD || gesture.vx < -0.5) {
            closeThen();
          } else {
            Animated.spring(drag, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start();
          }
        },
      }),
    [closeThen, drag],
  );

  const handleNavigate = useCallback(
    (item: DrawerMenuItem) => {
      closeThen(() => {
        if (item.isTab) {
          // Tab screens are nested inside the root stack's tab navigator
          navigateFromRoot(ROUTES.MAIN_TABS, { screen: item.route });
        } else {
          navigateFromRoot(item.route);
        }
      });
    },
    [closeThen],
  );

  const handleLogout = useCallback(() => {
    closeThen(() => {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]);
    });
  }, [closeThen, logout]);

  // The menu mirrors the brand's enabled modules, so a disabled module never
  // shows a dead entry here.
  const { mainItems, accountItems } = useMemo(() => {
    const main: DrawerMenuItem[] = [];
    const push = (enabled: boolean, item: DrawerMenuItem) => {
      if (enabled) {
        main.push(item);
      }
    };

    push(isModuleEnabled('dashboard'), {
      id: 'dashboard', label: 'Home', icon: 'home', route: ROUTES.DASHBOARD, isTab: true,
    });
    push(isModuleEnabled('circulars'), {
      id: 'circulars', label: 'Circulars', icon: 'campaign', route: ROUTES.CIRCULARS, isTab: true,
    });
    push(isModuleEnabled('homework'), {
      id: 'homework', label: 'Homework', icon: 'homework', route: ROUTES.HOMEWORK, isTab: true,
    });
    push(isModuleEnabled('attendance'), {
      id: 'attendance', label: 'Attendance', icon: 'attendance', route: ROUTES.ATTENDANCE,
    });
    push(isModuleEnabled('marks'), {
      id: 'marks', label: 'View Marks', icon: 'marks', route: ROUTES.MARKS,
    });
    push(isModuleEnabled('exams'), {
      id: 'exams', label: 'Exam Schedule', icon: 'exam', route: ROUTES.EXAM_SCHEDULE,
    });
    push(isModuleEnabled('timetable'), {
      id: 'timetable', label: 'Timetable', icon: 'timetable', route: ROUTES.TIMETABLE,
    });
    push(isModuleEnabled('calendar'), {
      id: 'calendar', label: 'Calendar', icon: 'calendar', route: ROUTES.CALENDAR,
    });
    push(isModuleEnabled('gallery'), {
      id: 'gallery', label: 'Gallery', icon: 'gallery', route: ROUTES.GALLERY,
    });
    push(isModuleEnabled('fees'), {
      id: 'fees', label: 'Fee Details', icon: 'payments', route: ROUTES.FEE_DETAILS,
    });
    push(isModuleEnabled('parentMessage'), {
      id: 'parentMessage', label: 'Write to School', icon: 'message', route: ROUTES.PARENT_MESSAGES,
    });
    push(isModuleEnabled('leaveLetter'), {
      id: 'leaveLetter', label: 'Leave Letter', icon: 'eventNote', route: ROUTES.LEAVE_LETTER,
    });
    push(isModuleEnabled('chat'), {
      id: 'chat', label: 'Chat', icon: 'chat', route: ROUTES.CHAT, isTab: true,
    });

    const account: DrawerMenuItem[] = [];
    if (isModuleEnabled('profile')) {
      account.push({
        id: 'profile', label: 'Profile', icon: 'profile', route: ROUTES.PROFILE, isTab: true,
      });
    }
    account.push({
      id: 'notifications',
      label: 'Notification Settings',
      icon: 'notification',
      route: ROUTES.NOTIFICATION_SETTINGS,
    });

    return { mainItems: main, accountItems: account };
  }, [isModuleEnabled]);

  if (!mounted) {
    return null;
  }

  const translateX = Animated.add(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-PANEL_WIDTH, 0],
    }),
    drag,
  );

  const renderItem = (item: DrawerMenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleNavigate(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.menuIcon}>
        <Icon name={item.icon} size={19} color={colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      <Icon name="chevronRight" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={() => closeThen()}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => closeThen()}>
          <Animated.View
            style={[
              styles.scrim,
              {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.panel,
            {
              width: PANEL_WIDTH,
              maxWidth: PANEL_WIDTH,
              paddingTop: insets.top + 12,
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Brand header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image
                source={getBrandLogo(brandId)}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.brandText}>
                <Text style={styles.brandName} numberOfLines={2}>
                  {brand.brand.name}
                </Text>
                {!!brand.brand.tagline && (
                  <Text style={styles.brandTagline} numberOfLines={1}>
                    {brand.brand.tagline}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => closeThen()}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              >
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {students.length > 0 && (
              <View style={styles.students}>
                {students.map((student, index) => (
                  <View
                    key={student.id}
                    style={[styles.studentRow, index > 0 && styles.studentRowSpacing]}
                  >
                    <View style={styles.studentAvatar}>
                      {student.photo ? (
                        <Image
                          source={{ uri: student.photo }}
                          style={styles.studentAvatarImage}
                        />
                      ) : (
                        <Text style={styles.studentAvatarText}>
                          {getInitial(student.name)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {student.name}
                      </Text>
                      <Text style={styles.studentClass} numberOfLines={1}>
                        {student.className}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Menu */}
          <ScrollView
            style={styles.menu}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            {mainItems.map(renderItem)}
            {accountItems.length > 0 && <View style={styles.sectionDivider} />}
            {accountItems.map(renderItem)}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={styles.logoutIcon}>
                <Icon name="logout" size={19} color={colors.error} />
              </View>
              <Text style={styles.logoutLabel}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
