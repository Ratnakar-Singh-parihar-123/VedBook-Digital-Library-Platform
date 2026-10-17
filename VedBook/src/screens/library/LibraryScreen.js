// LibraryScreen.js

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Dimensions,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../theme';

import { Icon } from '../../components/common/Icon';
import { BookCard } from '../../components/common/BookCard';
import { EmptyState } from '../../components/common/EmptyState';

import { useLibrary } from '../../context/LibraryContext';

/* ================================================================== */
/*  Responsive helpers                                                */
/* ================================================================== */
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const isSmallScreen = SCREEN_WIDTH < 360;
const isTablet = SCREEN_WIDTH >= 600;

/* Horizontal padding scales with screen */
const H_PADDING = isTablet
  ? spacing.xxl
  : isSmallScreen
  ? spacing.md
  : spacing.lg;

/* Tab label shortening on small screens */
const TAB_LABELS = {
  continue: {
    full: 'In Progress',
    short: 'Progress',
  },
  bookmarks: {
    full: 'Bookmarked',
    short: 'Saved',
  },
  recent: {
    full: 'Recently Opened',
    short: 'Recent',
  },
  completed: {
    full: 'Completed',
    short: 'Done',
  },
};

const TABS = [
  { id: 'continue', icon: 'book-open' },
  { id: 'bookmarks', icon: 'bookmark' },
  { id: 'recent', icon: 'clock' },
  { id: 'completed', icon: 'award' },
];

const EMPTY_INFO = {
  continue: {
    icon: 'book-open',
    title: 'No Active Reads',
    message:
      'Pick up any book from the catalogue to begin tracking your reading journey.',
    action: 'Discover Books',
  },
  bookmarks: {
    icon: 'bookmark',
    title: 'No Bookmarks Saved',
    message: 'Save books to your private reading queue for easy access later.',
    action: 'Explore Stacks',
  },
  completed: {
    icon: 'award',
    title: 'No Completed Books Yet',
    message:
      'Books you finish will be commemorated here as intellectual milestones.',
    action: 'Start Reading',
  },
  recent: {
    icon: 'clock',
    title: 'No Recent History',
    message: 'Books you open and review will appear here automatically.',
    action: 'Browse Library',
  },
};

/* ================================================================== */
/*  Animated Tab Button                                               */
/* ================================================================== */
const TabButton = ({ tab, isActive, count, onPress, small }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const indicatorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  }, [isActive, indicatorAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const label = small
    ? TAB_LABELS[tab.id]?.short || tab.id
    : TAB_LABELS[tab.id]?.full || tab.id;

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
      >
        <View style={styles.tabIconRow}>
          <Icon
            name={tab.icon}
            size={small ? 12 : 13}
            color={isActive ? colors.primary : colors.textSecondary}
          />
          {count > 0 && (
            <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
              <Text
                style={[
                  styles.tabCountText,
                  isActive && styles.tabCountTextActive,
                ]}
              >
                {count > 99 ? '99+' : count}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.tabButtonText,
            isActive && styles.tabButtonTextActive,
            small && { fontSize: 10 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ================================================================== */
/*  Stat Chip                                                         */
/* ================================================================== */
const StatChip = ({ icon, value, label }) => (
  <View style={styles.statChip}>
    <View style={styles.statChipIcon}>
      <Icon name={icon} size={11} color={colors.primary} />
    </View>
    <View>
      <Text style={styles.statChipValue}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  </View>
);

/* ================================================================== */
/*  Library Screen                                                    */
/* ================================================================== */
export const LibraryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const isSmall = screenWidth < 360;
  const isTab = screenWidth >= 600;
  const horizontalPadding = isTab
    ? spacing.xxl
    : isSmall
    ? spacing.md
    : spacing.lg;

  const {
    getContinueReadingBooks,
    getBookmarkedBooks,
    getCompletedBooksList,
    getRecentlyOpenedBooks,
    recordBookOpened,
    bookmarks,
    completedBooks,
    recentlyOpened,
    refreshLibrary,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState('continue');
  const [refreshing, setRefreshing] = useState(false);

  /* ================================================================== */
  /*  Per-tab count (memoized)                                          */
  /* ================================================================== */
  const tabCounts = useMemo(
    () => ({
      continue: (getContinueReadingBooks?.() || []).length,
      bookmarks: bookmarks?.length || 0,
      completed: completedBooks?.length || 0,
      recent: recentlyOpened?.length || 0,
    }),
    [
      getContinueReadingBooks,
      bookmarks,
      completedBooks,
      recentlyOpened,
    ],
  );

  /* ================================================================== */
  /*  Active tab books                                                  */
  /* ================================================================== */
  const activeBooks = useMemo(() => {
    try {
      switch (activeTab) {
        case 'continue':
          return getContinueReadingBooks?.() || [];
        case 'bookmarks':
          return getBookmarkedBooks?.() || [];
        case 'completed':
          return getCompletedBooksList?.() || [];
        case 'recent':
        default:
          return getRecentlyOpenedBooks?.() || [];
      }
    } catch (e) {
      if (__DEV__) console.warn('getBooks failed:', e?.message);
      return [];
    }
  }, [
    activeTab,
    getContinueReadingBooks,
    getBookmarkedBooks,
    getCompletedBooksList,
    getRecentlyOpenedBooks,
  ]);

  /* ================================================================== */
  /*  Refresh                                                           */
  /* ================================================================== */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshLibrary) {
        await refreshLibrary();
      }
    } catch {}
    setRefreshing(false);
  }, [refreshLibrary]);

  /* ================================================================== */
  /*  Handlers                                                          */
  /* ================================================================== */
  const handleBookPress = useCallback(
    book => {
      try {
        recordBookOpened?.(book);
      } catch {}
      navigation.navigate('BookDetails', { bookId: book.id, book });
    },
    [recordBookOpened, navigation],
  );

  const handleEmptyAction = useCallback(() => {
    navigation.navigate('Explore');
  }, [navigation]);

  /* ================================================================== */
  /*  Derived                                                           */
  /* ================================================================== */
  const emptyInfo = EMPTY_INFO[activeTab] || EMPTY_INFO.continue;

  /* ================================================================== */
  /*  FlatList render helpers                                           */
  /* ================================================================== */
  const keyExtractor = useCallback(
    (item, idx) => `${activeTab}-${item?.id || idx}`,
    [activeTab],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <BookCard
        book={item}
        variant="horizontal"
        showProgress={activeTab === 'continue' || !!item?.progress}
        progressData={item?.progress}
        onPress={() => handleBookPress(item)}
      />
    ),
    [activeTab, handleBookPress],
  );

  const ListEmpty = useMemo(
    () => (
      <EmptyState
        icon={emptyInfo.icon}
        title={emptyInfo.title}
        message={emptyInfo.message}
        actionTitle={emptyInfo.action}
        onActionPress={handleEmptyAction}
      />
    ),
    [emptyInfo, handleEmptyAction],
  );

  /* ================================================================== */
  /*  Render                                                            */
  /* ================================================================== */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      {/* ============ HEADER ============ */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 14),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <View style={styles.titleAccentRow}>
              <View style={styles.titleAccent} />
              <Text style={styles.titleOverline}>YOUR SANCTUARY</Text>
            </View>
            <Text style={styles.title}>My Library</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Explore')}
            style={styles.exploreButton}
          >
            <Icon name="plus" size={14} color={colors.primary} />
            <Text style={styles.exploreButtonText}>Explore</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatChip
            icon="book-open"
            value={tabCounts.continue}
            label="Reading"
          />
          <StatChip icon="bookmark" value={tabCounts.bookmarks} label="Saved" />
          <StatChip icon="award" value={tabCounts.completed} label="Finished" />
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <View style={styles.tabsRow}>
            {TABS.map(tab => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                count={tabCounts[tab.id] || 0}
                onPress={() => setActiveTab(tab.id)}
                small={isSmall}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ============ BODY ============ */}
      <FlatList
        data={activeBooks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 20) + 80,
          },
          activeBooks.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={
          activeBooks.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {activeBooks.length}{' '}
                {activeBooks.length === 1 ? 'book' : 'books'}
              </Text>
              <View style={styles.listHeaderDivider} />
            </View>
          ) : null
        }
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
      />
    </View>
  );
};

/* ================================================================== */
/*  STYLES                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },

  /* ============ HEADER ============ */
  header: {
    backgroundColor: colors.ivory,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  /* Title row */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  titleCol: {
    flex: 1,
  },
  titleAccentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  titleAccent: {
    width: 20,
    height: 2,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  titleOverline: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    letterSpacing: 0.2,
  },

  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  exploreButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 5,
    letterSpacing: 0.3,
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  statChipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statChipValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    lineHeight: 17,
  },
  statChipLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 1,
  },

  /* Tabs */
  tabsWrapper: {
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 3,
    ...shadows.soft,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.sage,
    ...shadows.soft,
  },
  tabIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  tabCount: {
    marginLeft: 4,
    minWidth: 16,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCountActive: {
    backgroundColor: colors.gold,
  },
  tabCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  tabCountTextActive: {
    color: colors.primaryDark,
  },

  /* ============ LIST ============ */
  listContent: {
    paddingTop: spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  itemSeparator: {
    height: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  listHeaderDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
});

export default LibraryScreen;
