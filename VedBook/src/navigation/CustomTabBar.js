import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Icon } from '../components/common/Icon';

const TAB_ICONS = {
  Home: 'home',
  Explore: 'explore',
  Categories: 'grid',
  'My Library': 'library',
  Profile: 'profile',
};

export const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  // Bottom padding accounts for safe area without doubling
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomInset }]}>
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const iconName = TAB_ICONS[route.name] || 'book';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={
                options.tabBarAccessibilityLabel || `${label} tab`
              }
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabButton}
            >
              <View
                style={[
                  styles.iconWrapper,
                  isFocused && styles.iconWrapperActive,
                ]}
              >
                <Icon
                  name={iconName}
                  size={20}
                  color={isFocused ? colors.primary : colors.textSecondary}
                  strokeWidth={isFocused ? 2.5 : 1.8}
                />
                {isFocused && <View style={styles.goldDot} />}
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    ...shadows.card,
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: colors.sage,
  },
  goldDot: {
    position: 'absolute',
    top: 2,
    right: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
