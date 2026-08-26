import * as Haptics from 'expo-haptics';

// Defined once, used consistently everywhere something needs feedback, rather than
// scattered ad hoc Haptics.impactAsync calls with no shared meaning:
//   selection - moving between screens or tabs (the pager, not a data change)
//   light     - a lightweight toggle (a switch, a button's default tap)
//   medium    - a committed write (create/join a hike, save/skip a trail)
//   success   - a completed hike (ending one as the owner)
//   warning   - a destructive confirm (removing a saved trail)
export const haptics = {
  selection: () => Haptics.selectionAsync().catch(() => {}),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};
