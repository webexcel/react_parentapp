import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { STORAGE_KEYS } from '../constants/keys';
import { useAuth } from '../auth';
import { useBrand, ModuleName } from '../brand/BrandContext';

/**
 * Parent menus are configured per school in SchoolTree (school-wide, per class
 * and per student) and served by parentMenu/getMenus, keyed by admission
 * number. The app shows the SELECTED child's menus.
 *
 * Until the school is configured (configured:false, or nothing fetched or
 * cached yet) the brand config decides, exactly as before.
 */

export interface ParentMenu {
  key: ModuleName;
  name: string;
  icon: string | null;
  order: number;
  quickAccess: 0 | 1;
  category: string | null;
}

interface MenuData {
  configured: boolean;
  byStudent: Record<string, ParentMenu[]>;
}

interface MenuContextType {
  /** True when this school's menus come from the server */
  configured: boolean;
  /** Menu visible for the selected child */
  isMenuEnabled: (key: ModuleName) => boolean;
  /** Menu visible for a specific child */
  isMenuEnabledFor: (key: ModuleName, studentId: string | null | undefined) => boolean;
  /** Menu visible for at least one child (screen registration) */
  isMenuEnabledForAny: (key: ModuleName) => boolean;
  /** Server label/icon/order for the selected child, when configured */
  getMenu: (key: ModuleName) => ParentMenu | undefined;
  /** Display name for a menu, even one the selected child doesn't have */
  getMenuLabel: (key: ModuleName) => string;
  refetch: () => void;
}

// Always shown; not configurable from SchoolTree.
const ALWAYS_ON: ModuleName[] = ['dashboard', 'profile'];

const DEFAULT_LABELS: Record<ModuleName, string> = {
  dashboard: 'Home',
  circulars: 'Circulars',
  homework: 'Homework',
  attendance: 'Attendance',
  exams: 'Exam Schedule',
  marks: 'View Marks',
  fees: 'Fee Details',
  calendar: 'Calendar',
  gallery: 'Gallery',
  timetable: 'Timetable',
  chat: 'Chat',
  profile: 'Profile',
  parentMessage: 'Write to School',
  leaveLetter: 'Leave Letter',
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, students, selectedStudentId } = useAuth();
  const { isModuleEnabled: isBrandEnabled } = useBrand();
  const [cached, setCached] = useState<MenuData | null>(null);

  // Last fetched menus, so a cold start (or no network) shows the same menus.
  useEffect(() => {
    if (!isAuthenticated) {
      setCached(null);
      return;
    }
    AsyncStorage.getItem(STORAGE_KEYS.PARENT_MENUS)
      .then((raw) => setCached(raw ? JSON.parse(raw) : null))
      .catch(() => setCached(null));
  }, [isAuthenticated]);

  const query = useQuery({
    queryKey: ['parentMenus', token],
    queryFn: async (): Promise<MenuData> => {
      const response = await apiClient.post(API_ENDPOINTS.PARENT_MENU.GET_MENUS, {});
      const data: MenuData = {
        configured: response.data?.configured === true,
        byStudent: response.data?.byStudent || {},
      };
      await AsyncStorage.setItem(STORAGE_KEYS.PARENT_MENUS, JSON.stringify(data));
      return data;
    },
    enabled: isAuthenticated && !!token,
  });

  const data = query.data ?? cached;
  const configured = !!data?.configured;

  const isMenuEnabledFor = useCallback(
    (key: ModuleName, studentId: string | null | undefined): boolean => {
      if (ALWAYS_ON.includes(key)) return true;
      const menus = studentId ? data?.byStudent?.[String(studentId)] : undefined;
      // Not configured, or the server couldn't match this child: brand config.
      if (!configured || !menus) return isBrandEnabled(key);
      return menus.some((m) => m.key === key);
    },
    [data, configured, isBrandEnabled]
  );

  const value = useMemo<MenuContextType>(() => {
    const selectedMenus = selectedStudentId ? data?.byStudent?.[String(selectedStudentId)] : undefined;
    return {
      configured,
      isMenuEnabled: (key) => isMenuEnabledFor(key, selectedStudentId),
      isMenuEnabledFor,
      isMenuEnabledForAny: (key) =>
        students.length === 0 ? isMenuEnabledFor(key, null) : students.some((s) => isMenuEnabledFor(key, s.id)),
      getMenu: (key) => (configured ? selectedMenus?.find((m) => m.key === key) : undefined),
      getMenuLabel: (key) => {
        const fromServer = Object.values(data?.byStudent || {})
          .flat()
          .find((m) => m.key === key)?.name;
        return fromServer || DEFAULT_LABELS[key] || key;
      },
      refetch: () => {
        query.refetch();
      },
    };
  }, [configured, data, isMenuEnabledFor, selectedStudentId, students, query]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

export const useMenuAccess = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuAccess must be used within a MenuProvider');
  }
  return context;
};

/** Menu access when a MenuProvider is mounted, otherwise null (brand config applies). */
export const useOptionalMenuAccess = (): MenuContextType | null => useContext(MenuContext) ?? null;
