import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { BottomDock } from '@/components/layout/bottom-dock';
import { NAV_ITEMS } from '@/components/layout/nav-items';
import { SideNav } from '@/components/layout/side-nav';
import { Colors, Layout } from '@/constants/theme';

/**
 * Responsive shell for the three main screens: side nav on wide windows, bottom dock on phones.
 * The default tab bar is hidden; the visible triggers live in `SideNav` / `BottomDock`
 * (docs: "Hidden tab bar" in Expo Router custom tabs).
 */
export default function AppTabs() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= Layout.desktopBreakpoint;

  return (
    <Tabs>
      <TabList style={styles.hidden}>
        {NAV_ITEMS.map((item) => (
          <TabTrigger key={item.name} name={item.name} href={item.href} />
        ))}
      </TabList>

      <View style={[styles.root, isDesktop && styles.rootDesktop]}>
        {isDesktop && <SideNav />}
        <View style={styles.content}>
          <TabSlot style={styles.slot} />
        </View>
        {!isDesktop && <BottomDock />}
      </View>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  rootDesktop: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
});
