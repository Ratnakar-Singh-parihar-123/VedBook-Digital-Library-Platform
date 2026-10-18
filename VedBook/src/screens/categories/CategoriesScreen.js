import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
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
import { EmptyState } from '../../components/common/EmptyState';
import { categoriesAPI, booksAPI } from '../../api/booksApi';
import { categories as fallbackCategories } from '../../data/categoriesData';

export const CategoriesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Fill missing bookCounts via one bulk books fetch               //

  const fillMissingCounts = useCallback(async list => {
    const needsCount = list.some(c => !c.bookCount || c.bookCount === 0);
    if (!needsCount) return list;

    try {
      const res = await booksAPI.searchBooks({ limit: 500 });
      const map = {};
      res.books.forEach(b => {
        const key = (b.category || '').toLowerCase().trim();
        if (!key) return;
        map[key] = (map[key] || 0) + 1;
      });

      return list.map(c => {
        if (c.bookCount && c.bookCount > 0) return c;
        const key = (c.name || '').toLowerCase().trim();
        return { ...c, bookCount: map[key] || 0 };
      });
    } catch {
      return list;
    }
  }, []);

  // Fetch categories                                               //

  const fetchCategories = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const list = await categoriesAPI.getAll();
        const enriched = await fillMissingCounts(list);
        setCategories(enriched.length > 0 ? enriched : fallbackCategories);
      } catch (e) {
        if (fallbackCategories && fallbackCategories.length > 0) {
          setCategories(fallbackCategories);
        } else {
          setError(
            e?.response?.data?.message ||
              'Could not load categories. Please try again.',
          );
          setCategories([]);
        }
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [fillMissingCounts],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => fetchCategories(true);

  const handleCategoryPress = item => {
    navigation.navigate('CategoryDetail', {
      categoryId: item.id,
      categoryName: item.name,
      description: item.description,
      icon: item.icon,
    });
  };

  //---------------- HEADER ----------------//
  const renderHeader = () => {
    const canGoBack = navigation.canGoBack?.();

    return (
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>All Categories</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Curated disciplines of classical & modern thought
            </Text>
          </View>
          {canGoBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack?.()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {!loading && !error && categories.length > 0 && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {categories.length}{' '}
              {categories.length === 1 ? 'discipline' : 'disciplines'}
            </Text>
            <View style={styles.countDivider} />
            <Text style={styles.countHint}>Tap to explore volumes</Text>
          </View>
        )}
      </View>
    );
  };

  //---------------- BODY ----------------//
  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading disciplines...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerBox}>
          <View style={styles.stateIconCircle}>
            <Icon name="alert-circle" size={26} color={colors.goldDark} />
          </View>
          <Text style={styles.stateTitle}>Unable to load</Text>
          <Text style={styles.stateMsg}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchCategories()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (categories.length === 0) {
      return (
        <EmptyState
          icon="book-open"
          title="No Categories Yet"
          message="Categories will appear here once the catalogue is populated."
          actionTitle="Refresh"
          onActionPress={() => fetchCategories()}
        />
      );
    }

    return (
      <FlatList
        data={categories}
        keyExtractor={item => item.id || item.name}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 70 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleCategoryPress(item)}
            style={styles.card}
          >
            <View style={styles.iconCircle}>
              <Icon name={item.icon} size={20} color={colors.primary} />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.bookCountBadge}>
                  <Text style={styles.bookCountText}>
                    {item.bookCount} {item.bookCount === 1 ? 'Book' : 'Books'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>

            <View style={styles.chevronContainer}>
              <Icon name="chevron-right" size={15} color={colors.primary} />
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />
      {renderHeader()}
      {renderBody()}
    </View>
  );
};

//==================================================================//
// STYLES                                                         //
//==================================================================//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },

  //HEADER//
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.ivory,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
  },
  subtitle: {
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
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm + 2,
  },
  countText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  countDivider: {
    width: 1,
    height: 10,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  countHint: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  //LIST//
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBody: { flex: 1 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.fontSerif,
  },
  bookCountBadge: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  bookCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  chevronContainer: {
    paddingLeft: spacing.sm,
  },

  //STATES//
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
