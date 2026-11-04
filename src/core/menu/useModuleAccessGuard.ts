import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../auth';
import { ROUTES } from '../constants';
import { ModuleName } from '../brand/BrandContext';
import { navigationRef } from '../../app/navigationRef';
import { AppToast } from '../../design-system/molecules/AppToast';
import { useMenuAccess } from './MenuContext';

/**
 * Put on every module screen. A menu is visible when ANY child has it, so the
 * selected child may not be one of them (e.g. the parent tapped Homework on the
 * Dashboard while a child without Homework is selected). Then switch to the
 * first child who does have it. Only when NO child has the menu (it was removed
 * while the parent was inside) go back to the Dashboard and say why.
 */
export const useModuleAccessGuard = (key: ModuleName): void => {
  const isFocused = useIsFocused();
  const { selectedStudentId, selectStudent } = useAuth();
  const { isMenuEnabledFor, studentsWithMenu, getMenuLabel } = useMenuAccess();
  const allowed = isMenuEnabledFor(key, selectedStudentId);
  const firstPermittedId = studentsWithMenu(key)[0]?.id;

  // Read through a ref so a re-render alone never fires the effect twice.
  const latest = useRef({ selectStudent, getMenuLabel });
  latest.current = { selectStudent, getMenuLabel };

  useEffect(() => {
    if (!isFocused || !selectedStudentId || allowed) return;
    if (firstPermittedId) {
      latest.current.selectStudent(firstPermittedId);
      return;
    }
    AppToast.show(`${latest.current.getMenuLabel(key)} is not available`);
    const nav = navigationRef.navigate as (name: string, params?: object) => void;
    nav(ROUTES.MAIN_TABS, { screen: ROUTES.DASHBOARD });
  }, [isFocused, selectedStudentId, allowed, firstPermittedId, key]);
};

/**
 * The children a module should list and fetch: only those who have this menu.
 * `selectedStudentId` is always one of them (the guard switches the global
 * selection if needed; until it does, the first permitted child is reported).
 */
export const useMenuStudents = (key: ModuleName) => {
  const { selectedStudentId, selectStudent } = useAuth();
  const { studentsWithMenu } = useMenuAccess();
  const students = studentsWithMenu(key);
  const effectiveId = students.some((s) => s.id === selectedStudentId)
    ? selectedStudentId
    : students[0]?.id ?? selectedStudentId;
  return { students, selectedStudentId: effectiveId, selectStudent };
};
