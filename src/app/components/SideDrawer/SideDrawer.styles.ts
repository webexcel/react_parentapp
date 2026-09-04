import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../../design-system';

export const DRAWER_MAX_WIDTH = 320;

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  panel: {
    backgroundColor: colors.surfaceLight,
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  brandText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  brandTagline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
  },

  // Students
  students: {
    marginTop: spacing.base,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: spacing.md,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentRowSpacing: {
    marginTop: spacing.md,
  },
  studentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  studentAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  studentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  studentClass: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // Menu
  menu: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.base,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logoutIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
    marginLeft: spacing.md,
  },
  version: {
    fontSize: 11,
    color: colors.textMuted,
    paddingBottom: spacing.sm,
  },
});
