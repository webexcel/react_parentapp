import React, { useCallback, useEffect, useRef } from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Text, colors, spacing } from '../../../../design-system';
import { FlashMessage } from '../../types/dashboard.types';
import { flashIdOf } from '../../hooks/useFlashSeen';

// WhatsApp-status style row of flash messages (same as the teacher app):
// blue ring = not seen on this device yet, grey = seen. Tap opens the popup.
interface FlashStatusStripProps {
  messages: FlashMessage[];
  seen: string[];
  onOpen: (index: number) => void;
  /** Whether the flash popup is open; the strip re-anchors when it closes. */
  popupOpen?: boolean;
}

const initialOf = (title?: string) =>
  (String(title || '').match(/[\p{L}\p{N}]/u)?.[0] || '?').toUpperCase();

export const FlashStatusStrip: React.FC<FlashStatusStripProps> = ({ messages, seen, onOpen, popupOpen = false }) => {
  // The strip stays anchored at the first bubble unless the parent has swiped
  // it themselves. Android scrolls a horizontal ScrollView on its own when a
  // child gains focus (e.g. focus restored after the popup Modal closes) and
  // can keep a stale offset when the content re-measures; both left the strip
  // part-way along with the first bubbles hidden.
  const ref = useRef<ScrollView>(null);
  const userScrolled = useRef(false);

  const anchorStart = useCallback(() => {
    if (!userScrolled.current) ref.current?.scrollTo({ x: 0, animated: false });
  }, []);

  // After the popup closes: once now, once after Android's focus restore.
  useEffect(() => {
    if (popupOpen) return;
    anchorStart();
    const t = setTimeout(anchorStart, 350);
    return () => clearTimeout(t);
  }, [popupOpen, anchorStart]);

  // A different set of messages (new one arrived / one expired): start over.
  const idsKey = messages.map(flashIdOf).join(',');
  useEffect(() => {
    userScrolled.current = false;
    anchorStart();
  }, [idsKey, anchorStart]);

  if (messages.length === 0) return null;
  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.content}
      onScrollBeginDrag={() => { userScrolled.current = true; }}
      onContentSizeChange={anchorStart}
    >
      {messages.map((m, i) => {
        const isSeen = seen.includes(flashIdOf(m));
        const title = m.Title || m.title || 'Flash';
        const tint = isSeen ? colors.border : colors.primary;
        return (
          <TouchableOpacity
            key={`flash-bubble-${m.nid ?? i}`}
            style={styles.wrap}
            activeOpacity={0.8}
            onPress={() => onOpen(i)}
            accessibilityRole="button"
            accessibilityLabel={`${title}${isSeen ? '' : ', new'}`}
          >
            <View style={[styles.ring, { borderColor: tint }]}>
              <View style={[styles.bubble, { backgroundColor: tint }]}>
                <Text style={styles.initial}>{initialOf(title)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: isSeen ? colors.textSecondary : colors.error }]}>
                <MaterialIcons name="flash-on" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={[styles.label, isSeen && styles.labelSeen]} numberOfLines={1}>
              {title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  strip: { marginBottom: spacing.md },
  content: { paddingHorizontal: spacing.base, gap: spacing.md },
  wrap: { width: 68, alignItems: 'center' },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  initial: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    width: 68,
  },
  labelSeen: { color: colors.textSecondary },
});
