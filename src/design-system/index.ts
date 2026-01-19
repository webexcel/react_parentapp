// Theme
export {
  colors,
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  borderRadius,
  shadows,
} from './theme';

// Atoms
export {
  Button,
  Text,
  Input,
  Avatar,
  Badge,
  Chip,
  Spinner,
  Divider,
  Icon,
  iconMap,
  Switch,
} from './atoms';

export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  TextProps,
  TextVariant,
  TextColor,
  InputProps,
  AvatarProps,
  AvatarSize,
  BadgeProps,
  BadgeVariant,
  ChipProps,
  SpinnerProps,
  DividerProps,
  IconProps,
  IconName,
  SwitchProps,
} from './atoms';

// Molecules
export {
  OtpInput,
  SearchBar,
  StudentChip,
  StatCard,
  EmptyState,
} from './molecules';

export type {
  OtpInputProps,
  SearchBarProps,
  StudentChipProps,
  StatCardProps,
  EmptyStateProps,
} from './molecules';

// Organisms
export {
  ScreenHeader,
  StudentSelector,
  StudentCardSelector,
  QuickAccessGrid,
  BottomNavigation,
} from './organisms';

export type {
  ScreenHeaderProps,
  StudentSelectorProps,
  StudentCardSelectorProps,
  Student,
  QuickAccessGridProps,
  QuickAccessItem,
  BottomNavigationProps,
  NavItem,
} from './organisms';

// Templates
export {
  AuthTemplate,
  ListTemplate,
  DashboardTemplate,
} from './templates';

export type {
  AuthTemplateProps,
  ListTemplateProps,
  DashboardTemplateProps,
} from './templates';
