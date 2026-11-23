import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Text, LinkedText, AttachmentSection, colors, spacing } from '../../../../design-system';
import { parseAttachments } from '../../../../core/utils/attachments';
import { FlashMessage } from '../../types/dashboard.types';

// Same popup as the teacher app: blue header (bell, title, "n of N", close),
// body with attachments + text, prev / dots / next footer, swipe to step.
// autoPlay: each message stays FLASH_AUTO_MS with a countdown bar, then the
// next one shows; the popup closes after the last.
export const FLASH_AUTO_MS = 5000;
const SWIPE_PX = 50;

interface FlashMessageModalProps {
  messages: FlashMessage[];
  visible: boolean;
  onClose: () => void;
  /** Index to open at (manual open from a status bubble). */
  initialIndex?: number;
  /** Auto-advance every FLASH_AUTO_MS and close after the last message. */
  autoPlay?: boolean;
  /** Called with each message as it is shown (used to mark it seen). */
  onShow?: (message: FlashMessage) => void;
  /** Legacy: kept for older call sites; called when a message is closed. */
  onDismiss?: (messageId: number) => void;
}

const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

export const FlashMessageModal: React.FC<FlashMessageModalProps> = ({
  messages,
  visible,
  onClose,
  initialIndex = 0,
  autoPlay = false,
  onShow,
  onDismiss,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const progress = useRef(new Animated.Value(0)).current;
  const nav = useRef({ index: 0, count: 0 });
  nav.current = { index, count: messages.length };

  useEffect(() => {
    if (visible) setIndex(Math.min(initialIndex, Math.max(messages.length - 1, 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialIndex]);

  const current = messages[index];

  // Whatever is on screen counts as seen.
  useEffect(() => {
    if (visible && current) onShow?.(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, index, current?.nid]);

  const close = useCallback(() => {
    if (current) onDismiss?.(current.nid ?? (current.id as number));
    onClose();
  }, [current, onClose, onDismiss]);

  const step = useCallback((delta: number) => {
    const next = nav.current.index + delta;
    if (next >= 0 && next < nav.current.count) setIndex(next);
  }, []);

  // Auto-advance: restart the countdown whenever the shown message changes
  // (including manual prev / next / swipe).
  useEffect(() => {
    if (!visible || !autoPlay || messages.length === 0) return;
    progress.setValue(0);
    const anim = Animated.timing(progress, { toValue: 1, duration: FLASH_AUTO_MS, useNativeDriver: false });
    anim.start();
    const t = setTimeout(() => {
      if (nav.current.index < nav.current.count - 1) setIndex(nav.current.index + 1);
      else onClose();
    }, FLASH_AUTO_MS);
    return () => {
      clearTimeout(t);
      anim.stop();
    };
  }, [visible, autoPlay, index, messages.length, onClose, progress]);

  // Horizontal swipe only, so the body still scrolls vertically.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -SWIPE_PX) step(1);
        else if (g.dx >= SWIPE_PX) step(-1);
      },
    }),
  ).current;

  if (!current) return null;

  const attachments = current.attachments ?? parseAttachments(current.event_image || current.image, index);
  const title = current.Title || current.title || 'Flash Message';
  const body = current.Discription || current.description || current.message;
  const many = messages.length > 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card} {...pan.panHandlers}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="notifications-active" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text>
              {many && <Text style={styles.headerCount}>{index + 1} of {messages.length}</Text>}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={close} hitSlop={8} accessibilityLabel="Close">
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Auto-play countdown */}
          {autoPlay && (
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                ]}
              />
            </View>
          )}

          {/* Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {attachments.length > 0 && (
              <View style={styles.attachments}>
                {/* Keyed by message so media state never carries to the next one. */}
                <AttachmentSection key={`flash-att-${current.nid ?? index}`} attachments={attachments} variant="compact" />
              </View>
            )}
            {!!body && <LinkedText style={styles.description}>{body}</LinkedText>}
            {!!current.start_date && <Text style={styles.date}>{formatDate(current.start_date)}</Text>}
          </ScrollView>

          {/* Prev / dots / next */}
          {many && (
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
                onPress={() => step(-1)}
                disabled={index === 0}
                accessibilityLabel="Previous message"
              >
                <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.dots}>
                {messages.map((m, i) => (
                  <TouchableOpacity key={`dot-${m.nid ?? i}`} onPress={() => setIndex(i)} hitSlop={4}>
                    <View style={[styles.dot, i === index && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.navBtn, index >= messages.length - 1 && styles.navBtnDisabled]}
                onPress={() => step(1)}
                disabled={index >= messages.length - 1}
                accessibilityLabel="Next message"
              >
                <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '82%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerCount: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: { height: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: colors.primary },
  body: { maxHeight: 400 },
  bodyContent: { padding: spacing.base },
  attachments: { marginBottom: spacing.sm },
  description: { fontSize: 16, color: colors.textPrimary, lineHeight: 23 },
  date: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: { opacity: 0.35 },
  dots: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.primary },
});
