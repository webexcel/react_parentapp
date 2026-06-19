import React, {createContext, useContext, useState, useCallback} from 'react';

interface SideMenuContextType {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const SideMenuContext = createContext<SideMenuContextType>({
  isOpen: false,
  openMenu: () => {},
  closeMenu: () => {},
  toggleMenu: () => {},
});

export const SideMenuProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <SideMenuContext.Provider value={{isOpen, openMenu, closeMenu, toggleMenu}}>
      {children}
    </SideMenuContext.Provider>
  );
};

export const useSideMenu = () => useContext(SideMenuContext);
