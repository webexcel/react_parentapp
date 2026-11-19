import {StarHistoryItem} from '../types/stars.types';

// Star colours are fixed (gold), not brand colours: a star should look like a
// star in every school's app.
export const STAR_COLOR = '#F59E0B';
export const STAR_DARK = '#B45309';
export const STAR_SOFT = '#FFF7E6';
export const MEDALS = ['🥇', '🥈', '🥉'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-18 14:05' → '18 Nov' */
export const shortDate = (value: string) => {
  const [d] = String(value || '').split(' ');
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return value;
  return `${day} ${MONTHS[m - 1]}`;
};

/** Icon + title for a ledger row. */
export const describe = (item: StarHistoryItem): {icon: 'quiz' | 'star' | 'warning'; title: string} => {
  if (item.source_type === 'MCQ') return {icon: 'quiz', title: item.reason || 'MCQ test'};
  if (item.source_type === 'REVOKE') return {icon: 'warning', title: item.reason || 'Stars taken back'};
  return {icon: 'star', title: item.reason || 'Teacher award'};
};

export const scopeText = (scope?: string, label?: string | null) =>
  scope === 'section' ? `in ${label || 'section'}` : scope === 'class' ? 'in class' : scope === 'school' ? 'in school' : '';
