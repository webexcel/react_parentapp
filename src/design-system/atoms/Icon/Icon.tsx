import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';

export type IconName =
  | 'home'
  | 'homework'
  | 'marks'
  | 'chat'
  | 'profile'
  | 'circular'
  | 'attendance'
  | 'exam'
  | 'calendar'
  | 'fees'
  | 'gallery'
  | 'timetable'
  | 'notification'
  | 'search'
  | 'back'
  | 'forward'
  | 'close'
  | 'check'
  | 'chevronRight'
  | 'chevronDown'
  | 'download'
  | 'attachment'
  | 'audio'
  | 'pdf'
  | 'image'
  | 'phone'
  | 'logout'
  | 'settings'
  | 'menu'
  | 'dashboard'
  | 'campaign'
  | 'assignment'
  | 'star'
  | 'collections'
  | 'eventNote'
  | 'payments'
  | 'schedule'
  | 'gridView'
  | 'lock'
  | 'info'
  | 'warning'
  | 'receipt';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: object;
}

// Map our icon names to Material Icons
const iconMap: Record<IconName, string> = {
  home: 'home',
  homework: 'menu-book',
  marks: 'bar-chart',
  chat: 'chat',
  profile: 'person',
  circular: 'campaign',
  attendance: 'how-to-reg',
  exam: 'assignment',
  calendar: 'calendar-today',
  fees: 'payments',
  gallery: 'collections',
  timetable: 'schedule',
  notification: 'notifications',
  search: 'search',
  back: 'arrow-back',
  forward: 'arrow-forward',
  close: 'close',
  check: 'check-circle',
  chevronRight: 'chevron-right',
  chevronDown: 'expand-more',
  download: 'download',
  attachment: 'attach-file',
  audio: 'volume-up',
  pdf: 'picture-as-pdf',
  image: 'image',
  phone: 'phone',
  logout: 'logout',
  settings: 'settings',
  menu: 'menu',
  dashboard: 'dashboard',
  campaign: 'campaign',
  assignment: 'assignment',
  star: 'star',
  collections: 'collections',
  eventNote: 'event-note',
  payments: 'payments',
  schedule: 'schedule',
  gridView: 'grid-view',
  lock: 'lock',
  info: 'info',
  warning: 'warning',
  receipt: 'receipt',
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = colors.textPrimary,
  style,
}) => {
  const iconName = iconMap[name] || 'help-outline';

  return (
    <MaterialIcons
      name={iconName}
      size={size}
      color={color}
      style={style}
    />
  );
};

export { iconMap };
