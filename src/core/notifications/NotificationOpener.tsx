/**
 * NotificationOpener
 *
 * Opens the screen a tapped push notification is about. A tap can arrive
 * before the app is ready for it (cold start: splash, auth restore, a parent
 * still on the login screen), so the request is parked here and carried out
 * once the user is signed in, the main navigator is mounted and the children
 * are loaded - then the child the message names is selected first.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { getBrandConfig } from '../brand';
import { ROUTES } from '../constants';
import { navigationRef } from '../../app/navigationRef';
import type { FCMNotification } from './fcmService';
import { resolveNotificationRoute, NotificationRoute } from './notificationRouting';

let pending: NotificationRoute | null = null;
const listeners = new Set<(route: NotificationRoute | null) => void>();

const isModuleEnabled = (module: string): boolean => {
  const modules = getBrandConfig().features.modules as unknown as Record<string, { enabled?: boolean } | undefined>;
  return modules[module]?.enabled !== false;
};

/** Queue a tapped notification; NotificationOpener navigates when the app is ready. */
export const openNotification = (notification: FCMNotification): void => {
  pending = resolveNotificationRoute(notification, isModuleEnabled);
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
  const { isAuthenticated, students, selectStudent } = useAuth();
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

      if (request.adno) {
        const child = students.find(
          (s) => String(s.studentId || s.id) === request.adno || String(s.admissionNo) === request.adno
        );
        if (child) await selectStudent(child.id);
      }

      const nav = navigationRef.navigate as (name: string, params?: object) => void;
      nav(request.route, request.screen ? { screen: request.screen } : undefined);

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
