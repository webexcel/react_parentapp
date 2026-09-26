import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Navigation ref - lets code outside the screen tree (the side drawer, and
 * later notification deep links) drive navigation.
 */
export const navigationRef = createNavigationContainerRef<any>();

/**
 * Navigate to a screen registered on the root stack.
 */
export const navigateFromRoot = (name: string, params?: object): void => {
  if (navigationRef.isReady()) {
    // The ref is untyped (no route map), so navigate is called loosely here.
    (navigationRef.navigate as (n: string, p?: object) => void)(name, params);
  }
};
