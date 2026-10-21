import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../auth';
import { ROUTES } from '../constants';
import { ModuleName } from '../brand/BrandContext';
import { navigationRef } from '../../app/navigationRef';
import { AppToast } from '../../design-system/molecules/AppToast';
import { useMenuAccess } from './MenuContext';

/**
 * Put on every module screen. When the selected child doesn't have this menu
 * (typically right after the parent switches child inside the module), go to
 * the Dashboard — which now shows that child's menus — and say why.
 */
export const useModuleAccessGuard = (key: ModuleName): void => {
  const isFocused = useIsFocused();
  const { students, selectedStudentId } = useAuth();
  const { isMenuEnabled, getMenuLabel } = useMenuAccess();
  const allowed = isMenuEnabled(key);

  // Read through a ref so a re-render alone never fires the redirect twice.
  const latest = useRef({ students, getMenuLabel });
  latest.current = { students, getMenuLabel };

  useEffect(() => {
    if (!isFocused || !selectedStudentId || allowed) return;
    const student = latest.current.students.find((s) => s.id === selectedStudentId);
    const studentName = student?.name?.trim() || 'this student';
    AppToast.show(`${latest.current.getMenuLabel(key)} is not available for ${studentName}`);
    const nav = navigationRef.navigate as (name: string, params?: object) => void;
    nav(ROUTES.MAIN_TABS, { screen: ROUTES.DASHBOARD });
  }, [isFocused, selectedStudentId, allowed, key]);
};
