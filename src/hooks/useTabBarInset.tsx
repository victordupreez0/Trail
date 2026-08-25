import { createContext, useContext, type ReactNode } from 'react';

// Lets the frosted tab bar in app/(app)/index.tsx go position: 'absolute' (so pager
// content can actually run under it, which is the point of blurring it) while every
// screen still knows how much bottom clearance to leave. A hardcoded constant would
// break at the largest system font size, since the tab bar's height is intrinsic to
// its label text; measuring it and publishing the real number here is what survives
// that.
const TabBarInsetContext = createContext(0);

export function TabBarInsetProvider({ height, children }: { height: number; children: ReactNode }) {
  return <TabBarInsetContext.Provider value={height}>{children}</TabBarInsetContext.Provider>;
}

// 0 outside the pager (no provider mounted), which is the correct clearance there.
export function useTabBarInset(): number {
  return useContext(TabBarInsetContext);
}
