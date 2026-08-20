import { Pressable, StyleSheet, Text, View } from "react-native";

type TabKey = "main" | "Planner" | "chat" | "timer" | "mypage";

type TabItem = {
    key: TabKey;
    label: string;
};

type TabBarProps = {
    tabs: readonly TabItem[];
    activeTab: TabKey;
    onTabPress: (tab: TabKey) => void;
}

export default function TabBar({tabs, activeTab, onTabPress} : TabBarProps) {
    return (
        <View style={styles.tabBar}>
            {tabs.map((tab) => {
                const isActive = tab.key === activeTab;

                return (
                    <Pressable
                        key={tab.key}
                        onPress={() => onTabPress(tab.key)}
                        style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    >
                        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                )
            })}

        </View>
    )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    height: 60,
    borderTopColor: "#fff",
    boxShadow: "0px -1px 2px rgba(0, 0, 0, 0.08)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // paddingVertical: 8,
    borderRadius: 16,
  },
  tabButtonActive: {
    color: "#5AA9E6",
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabIconInactive: {
    opacity: 1,
  },
  tabLabel: {
    color: "#717171",
    fontSize: 12,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#5AA9E6",
  },
});