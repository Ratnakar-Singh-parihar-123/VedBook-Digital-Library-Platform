import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
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
import { categories as fallbackCategories } from '../../data/categoriesData';
import { useLibrary } from '../../context/LibraryContext';
import { booksAPI } from '../../api/booksApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular', icon: 'flame' },
  { id: 'recent', label: 'Recent', icon: 'clock' },
  { id: 'title', label: 'A → Z', icon: 'text' },
  { id: 'rating', label: 'Top Rated', icon: 'star' },
];

export const ExploreScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { recordBookOpened } = useLibrary();

  const initialCategory = route?.params?.category || 'All';

  /* ---------------- STATE ---------------- */
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState('popular');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const requestIdRef = useRef(0);

  /* ---------------- CATEGORY FILTERS ---------------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await booksAPI.getCategories();
        if (cancelled) return;
        if (res && res.length > 0) {
          setCategories(['All', ...res.map(c => c.name)]);
        } else {
          setCategories(['All', ...fallbackCategories.map(c => c.name)]);
        }
      } catch {
        if (!cancelled) {
          setCategories(['All', ...fallbackCategories.map(c => c.name)]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- DEBOUNCE SEARCH ---------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ---------------- FETCH PAGE ---------------- */
  const fetchPage = useCallback(
    async (targetPage, mode = 'initial') => {
      const myRequestId = ++requestIdRef.current;

      if (mode === 'initial') setLoading(true);
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      setError('');

      try {
        const res = await booksAPI.searchBooks({
          query: debouncedQuery,
          category: selectedCategory,
          sort: selectedSort,
          page: targetPage,
          limit: PAGE_SIZE,
        });

        // Ignore stale responses
        if (myRequestId !== requestIdRef.current) return;

        setBooks(prev =>
          mode === 'more' ? [...prev, ...res.books] : res.books,
        );
        setTotal(res.total ?? res.books.length);
        setHasMore(Boolean(res.hasMore));
        setPage(targetPage);
      } catch (e) {
        if (myRequestId !== requestIdRef.current) return;
        setError(
          e?.response?.data?.message ||
            'Unable to load books. Please try again.',
        );
        if (mode !== 'more') setBooks([]);
      } finally {
        if (myRequestId !== requestIdRef.current) return;
        if (mode === 'initial') setLoading(false);
        if (mode === 'more') setLoadingMore(false);
        if (mode === 'refresh') setRefreshing(false);
      }
    },
    [debouncedQuery, selectedCategory, selectedSort],
  );

  /* ---------------- TRIGGER ON FILTER CHANGE ---------------- */
  useEffect(() => {
    fetchPage(1, 'initial');
  }, [fetchPage]);

  /* ---------------- PAGINATION ---------------- */
  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(page + 1, 'more');
  };

  const onRefresh = () => fetchPage(1, 'refresh');

  /* ---------------- HANDLERS ---------------- */
  const handleBookPress = book => {
    recordBookOpened?.(book.id);
    navigation.navigate('BookDetails', { bookId: book.id, book });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategory('All');
    setSelectedSort('popular');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    searchQuery.trim().length > 0 ||
    selectedSort !== 'popular';

  /* ---------------- RENDER ---------------- */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      {/* ============ HEADER ============ */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 14) },
        ]}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Explore</Text>
            <Text style={styles.screenSubtitle} numberOfLines={1}>
              Discover across classical & modern stacks
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack?.()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* SEARCH + SORT */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={17} color={colors.primary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search title, author, keyword..."
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowSortDropdown(v => !v)}
            style={[
              styles.sortButton,
              showSortDropdown && styles.sortButtonActive,
            ]}
          >
            <Icon
              name="sort"
              size={18}
              color={showSortDropdown ? colors.ivory : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* SORT DROPDOWN */}
        {showSortDropdown && (
          <View style={styles.sortDropdown}>
            <View style={styles.sortOptionsRow}>
              {SORT_OPTIONS.map(opt => {
                const active = selectedSort === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedSort(opt.id);
                      setShowSortDropdown(false);
                    }}
                    style={[styles.sortChip, active && styles.sortChipActive]}
                  >
                    <Text
                      style={[
                        styles.sortChipText,
                        active && styles.sortChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* CATEGORY CHIPS */}
        <FlatList
          data={categories}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ============ RESULT INFO ROW ============ */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCount}>
          {loading
            ? 'Searching...'
            : `${total || books.length} ${
                (total || books.length) === 1 ? 'volume' : 'volumes'
              } found`}
        </Text>

        {hasActiveFilters && !loading && (
          <TouchableOpacity
            onPress={clearFilters}
            style={styles.clearFilterButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={12} color={colors.goldDark} />
            <Text style={styles.clearFilterText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ============ BODY ============ */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading catalogue...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <View style={styles.errorIconCircle}>
            <Icon name="alert-circle" size={26} color={colors.goldDark} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchPage(1, 'initial')}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          numColumns={2}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 70 },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : !hasMore && books.length > 0 ? (
              <Text style={styles.endOfList}>— end of catalogue —</Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No Books Found"
              message={`We couldn't find any titles matching "${
                searchQuery || selectedCategory
              }". Try adjusting keywords or explore other categories.`}
              actionTitle="Reset Search"
              onActionPress={clearFilters}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.gridCard}>
              <BookCard
                book={item}
                variant="vertical"
                style={styles.gridBookCard}
                onPress={() => handleBookPress(item)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

/* ================================================================== */
/*  STYLES                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },

  /* HEADER */
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.ivory,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    letterSpacing: 0.2,
  },
  screenSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  /* SEARCH */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    ...shadows.soft,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: spacing.sm,
    fontSize: 13.5,
    color: colors.primary,
  },
  sortButton: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },

  /* SORT DROPDOWN */
  sortDropdown: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sortOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sortChip: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.xs + 2,
  },
  sortChipActive: { backgroundColor: colors.primary },
  sortChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  sortChipTextActive: { color: colors.ivory },

  /* CATEGORY CHIPS */
  chipsScroll: { paddingBottom: 2 },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    marginRight: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primary,
  },
  filterChipTextActive: { color: colors.ivory },

  /* RESULT INFO */
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  resultsCount: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.sage,
  },
  clearFilterText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.goldDark,
    marginLeft: 4,
    letterSpacing: 0.3,
  },

  /* GRID */
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridCard: { width: GRID_ITEM_WIDTH },
  gridBookCard: { width: '100%', marginRight: 0 },

  /* LOADERS / STATES */
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
  },
  footerLoader: { paddingVertical: spacing.lg },
  endOfList: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    paddingVertical: spacing.lg,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  errorIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    marginBottom: 4,
  },
  errorMsg: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.ivory,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
