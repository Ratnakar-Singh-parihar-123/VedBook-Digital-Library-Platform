import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, borderRadius, typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { BookCard } from '../../components/common/BookCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Icon } from '../../components/common/Icon'; // ✅ FIXED
import { useLibrary } from '../../context/LibraryContext';
import { categoriesAPI } from '../../api/booksApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const PAGE_SIZE = 20;

export const CategoryDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { recordBookOpened } = useLibrary();

  const { categoryId, categoryName, description, icon } = route.params || {};

  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const requestIdRef = useRef(0);

  // Fetch a page of books                                            //

  const fetchPage = useCallback(
    async (targetPage, mode = 'initial') => {
      const myReqId = ++requestIdRef.current;

      if (mode === 'initial') setLoading(true);
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      setError('');

      try {
        const res = await categoriesAPI.getBooks({
          categoryId,
          categoryName,
          page: targetPage,
          limit: PAGE_SIZE,
        });

        if (myReqId !== requestIdRef.current) return;

        setBooks(prev =>
          mode === 'more' ? [...prev, ...res.books] : res.books,
        );
        setTotal(res.total ?? res.books.length);
        setHasMore(Boolean(res.hasMore));
        setPage(targetPage);
      } catch (e) {
        if (myReqId !== requestIdRef.current) return;
        setError(
          e?.response?.data?.message ||
            'Could not load books for this category.',
        );
        if (mode !== 'more') setBooks([]);
      } finally {
        if (myReqId !== requestIdRef.current) return;
        if (mode === 'initial') setLoading(false);
        if (mode === 'more') setLoadingMore(false);
        if (mode === 'refresh') setRefreshing(false);
      }
    },
    [categoryId, categoryName],
  );

  useEffect(() => {
    fetchPage(1, 'initial');
  }, [fetchPage]);

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(page + 1, 'more');
  };

  const onRefresh = () => fetchPage(1, 'refresh');

  const handleBookPress = book => {
    recordBookOpened?.(book.id);
    navigation.navigate('BookDetails', { bookId: book.id, book });
  };

  //---------------- HEADER SUBTITLE ----------------//
  const headerSubtitle = loading
    ? 'Loading volumes...'
    : `${total || books.length} ${
        (total || books.length) === 1 ? 'volume' : 'volumes'
      } available`;

  //---------------- BODY ----------------//
  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading volumes...</Text>
        </View>
      );
    }

    if (error && books.length === 0) {
      return (
        <View style={styles.centerBox}>
          <View style={styles.stateIconCircle}>
            <Icon name="alert-circle" size={26} color={colors.goldDark} />
          </View>
          <Text style={styles.stateTitle}>Unable to load</Text>
          <Text style={styles.stateMsg}>{error}</Text>

          <View style={styles.retryRow}>
            <TouchableOpacity
              onPress={() => fetchPage(1, 'initial')}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Explore')}
              style={[styles.retryButton, styles.retryButtonGhost]}
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>
                Browse All
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <FlatList
        data={books}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        numColumns={2}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        columnWrapperStyle={books.length > 0 ? styles.columnWrapper : undefined}
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
        ListHeaderComponent={
          description ? (
            <View style={styles.categoryHeroBox}>
              <View style={styles.heroBadge}>
                <Icon name={icon || 'book'} size={14} color={colors.primary} />
                <Text style={styles.heroBadgeText}>
                  {categoryName || 'Category'}
                </Text>
              </View>
              <Text style={styles.categoryHeroDesc}>{description}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : !hasMore && books.length > 0 ? (
            <Text style={styles.endOfList}>— end of collection —</Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={icon || 'book-open'}
            title={`No books in ${categoryName || 'this category'}`}
            message="Check back soon as new additions are regularly catalogued by our curators."
            actionTitle="Browse All Books"
            onActionPress={() => navigation.navigate('Explore')}
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
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      <Header
        title={categoryName || 'Category'}
        subtitle={headerSubtitle}
        showBack
        onBackPress={() => navigation.goBack()}
        border
      />

      {renderBody()}
    </View>
  );
};

//==================================================================//
// STYLES                                                           //
//==================================================================//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridCard: { width: GRID_ITEM_WIDTH },
  gridBookCard: { width: '100%', marginRight: 0 },

  //HERO//
  categoryHeroBox: {
    backgroundColor: colors.sage,
    padding: spacing.md + 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  categoryHeroDesc: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 19,
    fontStyle: 'italic',
    fontFamily: typography.fontSerif,
  },

  //LOADERS / STATES//
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
  stateIconCircle: {
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
  stateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    marginBottom: 4,
  },
  stateMsg: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  retryRow: { flexDirection: 'row', gap: spacing.sm },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryButtonGhost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryText: {
    color: colors.ivory,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
