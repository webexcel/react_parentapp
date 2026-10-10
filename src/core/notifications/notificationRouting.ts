/**
 * Notification routing
 *
 * Decides which screen a tapped push notification should open. School pushes
 * are sent by an external notifier, so the data payload is not guaranteed:
 * explicit data keys (screen / type / module) win, then keywords in the title
 * and body, and anything else opens Circulars - every school message except
 * homework is listed there.
 */
import { ROUTES } from '../constants/routes';
import type { FCMNotification } from './fcmService';

export type NotificationTarget =
  | 'circulars'
  | 'homework'
  | 'attendance'
  | 'exams'
  | 'marks'
  | 'reportCard'
  | 'gallery'
  | 'leaveLetter'
  | 'fees'
  | 'dashboard';

export interface NotificationRoute {
  target: NotificationTarget;
  /** Root-stack route to navigate to */
  route: string;
  /** Nested tab screen when route is MAIN_TABS */
  screen?: string;
  /** Admission number of the child the message is about, when sent */
  adno?: string;
}

/** Brand module that has to be enabled for a target (null = always available) */
export const TARGET_MODULE: Record<NotificationTarget, string | null> = {
  circulars: 'circulars',
  homework: 'homework',
  attendance: 'attendance',
  exams: 'exams',
  marks: 'marks',
  reportCard: 'marks',
  gallery: 'gallery',
  leaveLetter: 'leaveLetter',
  fees: 'fees',
  dashboard: null,
};

// Checked in order; the first match wins. Homework is first because homework
// texts often also mention exams or circulars.
const KEYWORDS: Array<[NotificationTarget, RegExp]> = [
  ['homework', /home\s?work|assignment/i],
  ['leaveLetter', /leave\s?(letter|request)|leave (approved|rejected)/i],
  ['attendance', /absent|attendance|late\s?coming/i],
  ['reportCard', /report\s?card|progress\s?card/i],
  ['marks', /\bmarks?\b|\bresult/i],
  ['exams', /exam|time\s?table|datesheet|syllabus|portion/i],
  ['fees', /\bfees?\b|payment|receipt|due amount/i],
  ['gallery', /gallery|album/i],
  ['circulars', /circular|message|notice/i],
];

const normalise = (value?: string): string => (value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

/** Map an explicit data value ("HOMEWORK", "exam_schedule", "Circulars"...) */
const fromExplicit = (value?: string): NotificationTarget | null => {
  const v = normalise(value);
  if (!v) return null;
  if (v.includes('homework')) return 'homework';
  if (v.includes('leave')) return 'leaveLetter';
  if (v.includes('attendance') || v.includes('absent')) return 'attendance';
  if (v.includes('reportcard')) return 'reportCard';
  if (v.includes('mark') || v.includes('result')) return 'marks';
  if (v.includes('exam')) return 'exams';
  if (v.includes('fee') || v.includes('payment')) return 'fees';
  if (v.includes('gallery') || v.includes('album')) return 'gallery';
  if (v.includes('flash') || v.includes('dashboard') || v.includes('home')) return 'dashboard';
  if (v.includes('circular') || v.includes('sectionwise') || v.includes('message') || v.includes('notice')) {
    return 'circulars';
  }
  return null;
};

const toRoute = (target: NotificationTarget): Pick<NotificationRoute, 'route' | 'screen'> => {
  switch (target) {
    case 'homework':
      return { route: ROUTES.MAIN_TABS, screen: ROUTES.HOMEWORK };
    case 'circulars':
      return { route: ROUTES.MAIN_TABS, screen: ROUTES.CIRCULARS };
    case 'dashboard':
      return { route: ROUTES.MAIN_TABS, screen: ROUTES.DASHBOARD };
    case 'attendance':
      return { route: ROUTES.ATTENDANCE };
    case 'exams':
      return { route: ROUTES.EXAM_SCHEDULE };
    case 'marks':
      return { route: ROUTES.MARKS };
    case 'reportCard':
      return { route: ROUTES.REPORT_CARD };
    case 'gallery':
      return { route: ROUTES.GALLERY };
    case 'leaveLetter':
      return { route: ROUTES.LEAVE_LETTER };
    case 'fees':
      return { route: ROUTES.FEE_DETAILS };
  }
};

/**
 * Work out where a tapped notification should go.
 * @param isEnabled tells whether a brand module is turned on; a target whose
 *   module is off falls back to Circulars (or the Dashboard if that is off too).
 */
export const resolveNotificationRoute = (
  notification: FCMNotification,
  isEnabled: (module: string) => boolean = () => true,
): NotificationRoute => {
  const data = notification.data || {};

  let target: NotificationTarget | null =
    fromExplicit(data.screen) ||
    fromExplicit(data.module) ||
    fromExplicit(data.type) ||
    fromExplicit(data.msgtype) ||
    fromExplicit(data.category);

  if (!target) {
    const text = [notification.title, notification.body, data.title, data.body, data.message]
      .filter(Boolean)
      .join(' ');
    target = KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0] || 'circulars';
  }

  const allowed = (t: NotificationTarget) => {
    const module = TARGET_MODULE[t];
    return module === null || isEnabled(module);
  };
  if (!allowed(target)) {
    target = allowed('circulars') ? 'circulars' : 'dashboard';
  }

  const adno = data.adno || data.ADNO || data.admission_no || data.admissionNo || undefined;

  return { target, ...toRoute(target), adno: adno ? String(adno) : undefined };
};
