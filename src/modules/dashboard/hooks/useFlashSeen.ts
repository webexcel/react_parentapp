import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../core/constants/keys';

// Flash message ids this device has already shown, newest last. Drives the
// grey/blue status ring and which messages auto-pop on app open / resume.
const SEEN_CAP = 200;

const readSeen = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FLASH_SEEN_IDS);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
};

export const flashIdOf = (m: { nid?: number; id?: number }) => String(m.nid ?? m.id ?? '');

export const useFlashSeen = () => {
  const [seen, setSeen] = useState<string[]>([]);
  const seenRef = useRef<string[]>([]);

  useEffect(() => {
    readSeen().then((ids) => {
      seenRef.current = ids;
      setSeen(ids);
    });
  }, []);

  const markSeen = useCallback((id: string) => {
    if (!id || seenRef.current.includes(id)) return;
    const next = [...seenRef.current, id].slice(-SEEN_CAP);
    seenRef.current = next;
    setSeen(next);
    AsyncStorage.setItem(STORAGE_KEYS.FLASH_SEEN_IDS, JSON.stringify(next)).catch(() => {});
  }, []);

  /** Fresh read from storage — use before deciding what is unread. */
  const loadSeen = useCallback(async () => {
    const ids = await readSeen();
    seenRef.current = ids;
    setSeen(ids);
    return ids;
  }, []);

  return { seen, markSeen, loadSeen };
};
