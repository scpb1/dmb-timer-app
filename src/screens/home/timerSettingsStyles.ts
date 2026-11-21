import { StyleSheet } from 'react-native';

import { typography } from '@/theme/typography';

export const timerSettingsStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: 20,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollWrap: {
    flex: 1,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  vScrollRail: {
    pointerEvents: 'none',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  switchLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: 15,
    lineHeight: 20,
  },
  notificationsLabelWrap: {
    flex: 1,
    paddingRight: 8,
  },
  switchSlot: {
    width: 51,
    height: 31,
  },
  notificationsHint: {
    marginTop: 4,
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  fieldGap: {
    height: 10,
  },
  presetsAfterDates: {
    marginTop: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 22,
  },
  themeLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  themeLinkText: {
    flex: 1,
    paddingRight: 8,
  },
  themeLinkTitle: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 16,
  },
  themeLinkHint: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 13,
    marginTop: 2,
  },
  sectionSpacer: {
    marginTop: 22,
  },
  saveButton: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 4,
    paddingVertical: 13,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  savingCard: {
    minWidth: 200,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 28,
    paddingHorizontal: 32,
  },
  savingLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
  },
  widgetCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(167, 154, 138, 0.25)',
  },
  widgetText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  exportBlock: {
    marginTop: 28,
  },
  exportButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  exportButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
  },
  exportHint: {
    marginTop: 8,
    fontFamily: typography.fontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  stickerHost: {
    position: 'absolute',
    left: -10000,
    top: 0,
    backgroundColor: 'transparent',
  },
  deleteAllLinkWrap: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  deleteAllLinkPressed: {
    opacity: 0.65,
  },
  deleteAllLinkText: {
    fontFamily: typography.fontFamily.sansBold,
    fontSize: 15,
    color: '#bb322e',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
