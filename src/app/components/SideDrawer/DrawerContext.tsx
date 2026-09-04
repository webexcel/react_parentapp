import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SideDrawer } from './SideDrawer';

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

/**
 * DrawerProvider - owns the side drawer and exposes open/close to any screen.
 *
 * The drawer renders in a Modal, so it sits above the tab bar and any screen
 * without needing to be part of the navigator tree. It navigates through
 * `navigationRef` for the same reason.
 */
export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openDrawer, closeDrawer }),
    [isOpen, openDrawer, closeDrawer],
  );

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <SideDrawer visible={isOpen} onClose={closeDrawer} />
    </DrawerContext.Provider>
  );
};

/**
 * useDrawer - open or close the app's side menu.
 *
 * @example
 * const { openDrawer } = useDrawer();
 * <TouchableOpacity onPress={openDrawer}>
 */
export const useDrawer = (): DrawerContextType => {
  const context = useContext(DrawerContext);

  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }

  return context;
};
