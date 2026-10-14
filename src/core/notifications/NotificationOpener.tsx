/**
 * NotificationOpener
 *
 * Opens the screen a tapped push notification is about. A tap can arrive
 * before the app is ready for it (cold start: splash, auth restore, a parent
 * still on the login screen), so the request is parked here and carried out
 * once the user is signed in, the main navigator is mounted and the children
 * are loaded - then the child the message names is selected first. If that
 * child doesn't have the menu, the Dashboard opens with a short message.
 */
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth';
import { ROUTES } from '../constants';
import { useMenuAccess } from '../menu';
import type { ModuleName } from '../brand/BrandContext';
import { navigationRef } from '../../app/navigationRef';
import { AppToast } from '../../design-system/molecules/AppToast';
import type { FCMNotification } from './fcmService';
import { resolveNotificationRoute, NotificationRoute, TARGET_MODULE } from './notificationRouting';

let pending: NotificationRoute | null = null;
const listeners = new Set<(route: NotificationRoute | null) => void>();

/** Queue a tapped notification; NotificationOpener navigates when the app is ready. */
export const openNotification = (notification: FCMNotification): void => {
  // Menu access is per child, so it is checked when opening, once the child
  // the message is about is known (see tryOpen).
  pending = resolveNotificationRoute(notification, () => true);
  listeners.forEach((l) => l(pending));
};

const isMainNavigatorMounted = (): boolean =>
  navigationRef.isReady() &&
  !!navigationRef.getRootState()?.routeNames?.includes(ROUTES.MAIN_TABS);

// Signed out: the request waits for the login and then opens. Signed in: wait
// at most this long for the main navigator to mount, then give up.
const MAX_WAIT_MS = 2 * 60 * 1000;
const POLL_MS = 400;

export const NotificationOpener: React.FC = () => {
  const { isAuthenticated, students, selectedStudentId, selectStudent } = useAuth();
  const menuAccess = useMenuAccess();
  // Read through a ref: these change when the child is selected below, and
  // re-running the effect then would open the screen twice.
  const latest = useRef({ selectedStudentId, menuAccess });
  latest.current = { selectedStudentId, menuAccess };
  const [request, setRequest] = useState<NotificationRoute | null>(pending);

  useEffect(() => {
    listeners.add(setRequest);
    return () => {
      listeners.delete(setRequest);
    };
  }, []);

  useEffect(() => {
    if (!request || !isAuthenticated || students.length === 0) return;

    const startedAt = Date.now();
    let cancelled = false;

    const tryOpen = async () => {
      if (cancelled) return;
      if (!isMainNavigatorMounted()) {
        if (Date.now() - startedAt < MAX_WAIT_MS) setTimeout(tryOpen, POLL_MS);
        return;
      }

      const { isMenuEnabledFor, getMenuLabel } = latest.current.menuAccess;
      let child = students.find((s) => s.id === latest.current.selectedStudentId);
      if (request.adno) {
        const named = students.find(
          (s) => String(s.studentId || s.id) === request.adno || String(s.admissionNo) === request.adno
        );
        if (named) {
          child = named;
          await selectStudent(named.id);
        }
      }

      const nav = navigationRef.navigate as (name: string, params?: object) => void;
      const module = TARGET_MODULE[request.target] as ModuleName | null;
      if (module && child && !isMenuEnabledFor(module, child.id)) {
        AppToast.show(`${getMenuLabel(module)} is not available for ${child.name?.trim() || 'this student'}`);
        nav(ROUTES.MAIN_TABS, { screen: ROUTES.DASHBOARD });
      } else {
        nav(request.route, request.screen ? { screen: request.screen } : undefined);
      }

      pending = null;
      setRequest(null);
    };

    tryOpen();
    return () => {
      cancelled = true;
    };
  }, [request, isAuthenticated, students, selectStudent]);

  return null;
};
