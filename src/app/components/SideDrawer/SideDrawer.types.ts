import type { IconName } from '../../../design-system';

export interface DrawerMenuItem {
  id: string;
  label: string;
  icon: IconName;
  /** Route to open when tapped */
  route: string;
  /** True when the route lives in the bottom tab navigator rather than the root stack */
  isTab?: boolean;
}

export interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}
